
import json
import sys
import threading
import time

from apscheduler.schedulers.background import BackgroundScheduler
from playwright.sync_api import sync_playwright

from database import RefreshLog, SessionLocal, now
from scheme_fetcher import (
    TEXT_DIR, USER_AGENT, SECONDS_BETWEEN_REQUESTS, BlockedError,
    fetch_scheme, load_schemes, load_scheme_text, make_content_hash, save_scheme_text,
)
from ingest_schemes import index_scheme


# --------------------------------------------------
# 1. SETTINGS
# --------------------------------------------------
# The job runs every Sunday at 03:00 (the computer's local time),
# when nobody is using the app. An admin can also start it by hand.

WEEKLY_DAY = "sun"
WEEKLY_HOUR = 3

# Only one refresh may run at a time (the weekly one or a manual one).
refresh_lock = threading.Lock()


# --------------------------------------------------
# 2. REFRESH ONE SCHEME
# --------------------------------------------------

def restore_old_text(scheme_id, old_data):
    """Put the old saved file back exactly as it was."""
    with open(TEXT_DIR / f"{scheme_id}.json", "w", encoding="utf-8") as file:
        json.dump(old_data, file, indent=2, ensure_ascii=False)


def refresh_scheme(page, scheme):
    """
    Fetch one official page and compare its fingerprint (hash) with the saved one.
    Returns "unchanged" or "changed". Raises an error if something fails;
    in that case the old text and the old chunks are kept.
    """

    old_data = load_scheme_text(scheme["scheme_id"])

    # 2a. Fetch the page (nothing is saved yet).
    sections = fetch_scheme(page, scheme)

    if not sections:
        raise ValueError("No sections found on the page")

    # 2b. Same hash = same text. Leave the saved file and the index alone.
    if old_data and old_data["content_hash"] == make_content_hash(sections):
        return "unchanged"

    # 2c. The page changed: save the new text and re-index only this scheme.
    save_scheme_text(scheme, sections)

    try:
        index_scheme(scheme)
    except Exception:
        # Re-indexing failed: go back to the old text and the old chunks.
        if old_data:
            restore_old_text(scheme["scheme_id"], old_data)
            index_scheme(scheme)
        raise

    return "changed"


# --------------------------------------------------
# 3. REFRESH ALL WEB SCHEMES
# --------------------------------------------------

def finish_log(log, status, message):
    log.status = status
    log.message = message
    log.finished_at = now()


def run_refresh(triggered_by="schedule", only_ids=None):
    """
    Check every web scheme (one request every 5 seconds), re-index the changed
    ones, and write one row to the refresh_log table.
    Returns the log row as a dict, or None if a refresh is already running.
    """

    if not refresh_lock.acquire(blocking=False):
        print("Refresh: another refresh is already running.")
        return None

    db = SessionLocal()
    log = RefreshLog(triggered_by=triggered_by, changed=[], failed=[])
    db.add(log)
    db.commit()

    # The startup playbook is a local PDF, so only web pages are checked.
    schemes = [s for s in load_schemes() if s["source"] in ("myscheme", "startup_india")]
    if only_ids:
        schemes = [s for s in schemes if s["scheme_id"] in only_ids]

    changed, failed, blocked = [], [], False

    try:
        with sync_playwright() as playwright:
            browser = playwright.chromium.launch()
            page = browser.new_page(user_agent=USER_AGENT)

            for number, scheme in enumerate(schemes, start=1):
                if number > 1:
                    time.sleep(SECONDS_BETWEEN_REQUESTS)

                scheme_id = scheme["scheme_id"]

                try:
                    result = refresh_scheme(page, scheme)
                    print(f"Refresh [{number}/{len(schemes)}] {scheme_id}: {result}")
                    if result == "changed":
                        changed.append(scheme_id)

                except BlockedError as error:
                    # The website is refusing us: stop at once, keep everything.
                    print(f"Refresh: BLOCKED ({error}). Stopping.")
                    blocked = True
                    break

                except Exception as error:
                    print(f"Refresh [{number}/{len(schemes)}] {scheme_id}: FAILED ({error})")
                    failed.append(scheme_id)

                log.checked = number   # not reached after "break"

            browser.close()

        # 3a. Keyword search (BM25) keeps the chunks in memory: load them again.
        if changed:
            import hybrid_retriever
            hybrid_retriever.reload_index()

        if blocked:
            status = "blocked"
        elif failed and len(failed) == len(schemes):
            status = "failed"
        elif failed:
            status = "partial"
        else:
            status = "ok"

        message = (
            f"Checked {log.checked} of {len(schemes)} pages: "
            f"{len(changed)} changed, {len(failed)} failed."
        )
        if blocked:
            message += " Stopped early because a website blocked the request."

    except Exception as error:
        # For example: no internet, or the Playwright browser is missing.
        status, message = "failed", f"Refresh stopped: {error}"

    log.changed, log.failed = changed, failed
    finish_log(log, status, message)
    db.commit()

    print(f"Refresh finished: {status}. {message}")
    result = log_info(log)

    db.close()
    refresh_lock.release()

    return result


def log_info(log):
    return {
        "id": log.id,
        "started_at": log.started_at,
        "finished_at": log.finished_at,
        "triggered_by": log.triggered_by,
        "status": log.status,
        "checked": log.checked,
        "changed": log.changed,
        "failed": log.failed,
        "message": log.message,
    }


# --------------------------------------------------
# 4. START THE JOB (WEEKLY, OR NOW)
# --------------------------------------------------

scheduler = BackgroundScheduler()


def mark_unfinished_runs():
    """If the server was stopped during a refresh, its row still says "running"."""
    db = SessionLocal()
    for log in db.query(RefreshLog).filter(RefreshLog.status == "running"):
        finish_log(log, "failed", "The server stopped during this refresh.")
    db.commit()
    db.close()


def start_scheduler():
    """Called once when the API server starts."""
    mark_unfinished_runs()
    scheduler.add_job(
        run_refresh, "cron", day_of_week=WEEKLY_DAY, hour=WEEKLY_HOUR,
        id="weekly_refresh", replace_existing=True,
    )
    scheduler.start()
    print(f"Weekly refresh scheduled. Next run: {next_run_time()}")


def stop_scheduler():
    if scheduler.running:
        scheduler.shutdown(wait=False)


def next_run_time():
    job = scheduler.get_job("weekly_refresh")
    return job.next_run_time if job else None


def is_running():
    return refresh_lock.locked()


def start_refresh_now():
    """The admin's "Run refresh now" button. Runs in the background
    (it takes about 2 minutes) so the request returns at once."""
    if is_running():
        return False
    threading.Thread(target=run_refresh, args=("admin",), daemon=True).start()
    return True


# --------------------------------------------------
# 5. TEST (needs internet)
# --------------------------------------------------
# python refresh_job.py              -> check all 15 web schemes
# python refresh_job.py apy pmjjby   -> check only these schemes

if __name__ == "__main__":
    only_ids = sys.argv[1:] or None

    result = run_refresh(triggered_by="admin", only_ids=only_ids)

    print("\nResult:")
    for key, value in result.items():
        print(f"  {key:<13} {value}")
