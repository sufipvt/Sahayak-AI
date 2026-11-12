
import hashlib
import json
import sys
import time
from datetime import datetime, timezone

from playwright.sync_api import sync_playwright

from load_document import DATA_DIR
from content_extractor import extract_all_content


# --------------------------------------------------
# 1. SETTINGS
# --------------------------------------------------

SCHEMES_FILE = DATA_DIR / "schemes.json"
TEXT_DIR = DATA_DIR / "schemes_text"

USER_AGENT = "SahayakAI/1.0 (student project; government scheme information assistant)"

# Wait this many seconds between two requests, to be polite to the websites.
SECONDS_BETWEEN_REQUESTS = 5

# The sections of a myScheme page. Each one has a fixed HTML id on the page.
MYSCHEME_SECTIONS = {
    "details": "Description",
    "benefits": "Benefits",
    "eligibility": "Eligibility",
    "exclusions": "Exclusions",
    "application-process": "Application Process",
    "documents-required": "Documents Required",
}

# Button texts that appear inside sections but are not useful content.
JUNK_LINES = {"Apply Now", "Check Eligibility", "Sign in to apply", "Indicative Documents"}


class BlockedError(Exception):
    """Raised when a website refuses our requests (HTTP 403 or 429)."""


# --------------------------------------------------
# 2. LOAD THE SCHEME LIST
# --------------------------------------------------

def load_schemes():
    """Return the list of schemes from data/schemes.json."""
    with open(SCHEMES_FILE, encoding="utf-8") as file:
        return json.load(file)["schemes"]


# --------------------------------------------------
# 3. READ THE SECTIONS FROM A PAGE
# --------------------------------------------------

def clean_section_text(text, heading):
    """Remove the heading line and button texts from a section."""
    lines = []

    for line in text.splitlines():
        # Remove invisible characters (like ﻿) and extra spaces.
        line = line.replace("﻿", "").strip()

        if not line or line == heading or line in JUNK_LINES:
            continue

        lines.append(line)

    return "\n".join(lines)


def read_myscheme_page(page):
    """Read each section of a myScheme page using its HTML id."""

    # myScheme loads its content with JavaScript, so wait for it to appear.
    page.wait_for_selector("#eligibility", timeout=30000)
    page.wait_for_timeout(2000)

    sections = {}

    for html_id, section_name in MYSCHEME_SECTIONS.items():
        element = page.query_selector(f"#{html_id}")

        if element is None:
            continue

        heading = element.inner_text().strip().split("\n")[0]
        text = clean_section_text(element.inner_text(), heading)

        if text:
            sections[section_name] = text

    return sections


def read_startup_india_page(page, url):
    """Read a Startup India page using the existing content extractor."""

    html = page.content()
    records = extract_all_content(html, url)

    # Group the extracted records by section name.
    sections = {}

    for record in records:
        section_name = record["section"]
        sections.setdefault(section_name, [])
        sections[section_name].append(record["content"])

    return {
        name: "\n\n".join(parts)
        for name, parts in sections.items()
    }


# --------------------------------------------------
# 4. FETCH ONE SCHEME
# --------------------------------------------------

def fetch_scheme(page, scheme):
    """Open the scheme's official page and return its sections."""

    response = page.goto(
        scheme["url"],
        wait_until="domcontentloaded",
        timeout=60000
    )

    # Stop everything if the website is blocking us.
    if response.status in (403, 429):
        raise BlockedError(
            f"{scheme['url']} returned HTTP {response.status}"
        )

    if response.status >= 400:
        raise ValueError(f"HTTP {response.status}")

    if scheme["source"] == "myscheme":
        return read_myscheme_page(page)

    if scheme["source"] == "startup_india":
        return read_startup_india_page(page, scheme["url"])

    raise ValueError(f"Unknown source: {scheme['source']}")


# --------------------------------------------------
# 5. SAVE THE TEXT TO data/schemes_text/
# --------------------------------------------------

def make_content_hash(sections):
    """A SHA-256 fingerprint of the text. It changes when the page changes."""
    text = json.dumps(sections, sort_keys=True, ensure_ascii=False)
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def save_scheme_text(scheme, sections):
    """Save the sections of one scheme to data/schemes_text/<scheme_id>.json."""

    TEXT_DIR.mkdir(exist_ok=True)

    data = {
        "scheme_id": scheme["scheme_id"],
        "source_url": scheme["url"],
        "fetched_at": datetime.now(timezone.utc).isoformat(),
        "content_hash": make_content_hash(sections),
        "sections": sections,
    }

    file_path = TEXT_DIR / f"{scheme['scheme_id']}.json"

    with open(file_path, "w", encoding="utf-8") as file:
        json.dump(data, file, indent=2, ensure_ascii=False)

    return data


def load_scheme_text(scheme_id):
    """Return the saved text of a scheme, or None if it was never fetched."""

    file_path = TEXT_DIR / f"{scheme_id}.json"

    if not file_path.exists():
        return None

    with open(file_path, encoding="utf-8") as file:
        return json.load(file)


# --------------------------------------------------
# 6. FETCH ALL SCHEMES (POLITELY)
# --------------------------------------------------

def fetch_all_schemes(only_ids=None):
    """
    Fetch every web scheme, one request every few seconds.
    If a fetch fails, the old saved text is kept.
    If a website blocks us, stop immediately.
    """

    schemes = [
        scheme for scheme in load_schemes()
        if scheme["source"] in ("myscheme", "startup_india")
    ]

    if only_ids:
        schemes = [s for s in schemes if s["scheme_id"] in only_ids]

    report = {"saved": [], "failed": [], "blocked": False}

    with sync_playwright() as playwright:
        browser = playwright.chromium.launch()
        page = browser.new_page(user_agent=USER_AGENT)

        for number, scheme in enumerate(schemes, start=1):
            if number > 1:
                time.sleep(SECONDS_BETWEEN_REQUESTS)

            print(f"[{number}/{len(schemes)}] Fetching {scheme['scheme_id']} ...")

            try:
                sections = fetch_scheme(page, scheme)

                if not sections:
                    raise ValueError("No sections found on the page")

                save_scheme_text(scheme, sections)
                report["saved"].append(scheme["scheme_id"])
                print(f"    saved {len(sections)} sections")

            except BlockedError as error:
                print(f"    BLOCKED: {error}. Stopping, saved files are kept.")
                report["blocked"] = True
                break

            except Exception as error:
                print(f"    failed: {error}. Keeping the old saved text.")
                report["failed"].append(scheme["scheme_id"])

        browser.close()

    return report


# --------------------------------------------------
# 7. RUN FROM THE COMMAND LINE
# --------------------------------------------------
# python scheme_fetcher.py            -> fetch all schemes
# python scheme_fetcher.py pm-kisan  -> fetch only these schemes

if __name__ == "__main__":
    only_ids = sys.argv[1:] or None

    report = fetch_all_schemes(only_ids)

    print("\nDone.")
    print(f"Saved:   {len(report['saved'])}")
    print(f"Failed:  {report['failed']}")
    print(f"Blocked: {report['blocked']}")
