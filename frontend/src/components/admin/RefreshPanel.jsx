import { useCallback, useEffect, useRef, useState } from 'react'
import { RefreshCw, Loader2 } from 'lucide-react'
import { Card, formatDate } from '../ui.jsx'
import { getRefreshLog, runRefreshNow, errorMessage } from '../../api.js'

// 1. Colours for the status of one refresh run (see refresh_job.py).
const statusColours = {
  running: 'bg-sky-50 text-sky-700 border-sky-200',
  ok: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  partial: 'bg-amber-50 text-amber-700 border-amber-200',
  blocked: 'bg-rose-50 text-rose-700 border-rose-200',
  failed: 'bg-rose-50 text-rose-700 border-rose-200',
}

// The weekly refresh: "Run refresh now" button + the last 20 runs.
// onFinished() is called when a run ends, so the schemes list can reload.
export default function RefreshPanel({ onFinished }) {
  const [log, setLog] = useState(null)
  const [error, setError] = useState('')
  const wasRunning = useRef(false)

  const load = useCallback(() => {
    getRefreshLog()
      .then((data) => {
        if (wasRunning.current && !data.running) onFinished()
        wasRunning.current = data.running
        setLog(data)
      })
      .catch((e) => setError(errorMessage(e)))
  }, [onFinished])

  // 2. Load once, then every 5 seconds while a refresh is running.
  useEffect(load, [load])
  useEffect(() => {
    if (!log?.running) return
    const timer = setInterval(load, 5000)
    return () => clearInterval(timer)
  }, [log?.running, load])

  // 3. Start a refresh in the background (the server answers at once).
  async function start() {
    setError('')
    try {
      await runRefreshNow()
      load()
    } catch (e) {
      setError(errorMessage(e))
    }
  }

  const running = log?.running

  return (
    <Card className="p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-navy-900 flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-saffron-600" /> Weekly data refresh
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            {running
              ? 'A refresh is running now (about 2 minutes for 15 pages)…'
              : `Next scheduled run: ${formatDate(log?.next_run)}`}
          </p>
        </div>
        <button
          onClick={start}
          disabled={!log || running}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold bg-saffron-500 text-navy-900 hover:bg-saffron-400 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          {running ? 'Running…' : 'Run refresh now'}
        </button>
      </div>

      {error && <p className="mt-3 text-sm text-rose-700">{error}</p>}

      {/* 4. The refresh log */}
      <div className="mt-5 overflow-x-auto">
        {log?.runs.length === 0 && <p className="text-sm text-slate-500">No refresh has run yet.</p>}
        {log?.runs.length > 0 && (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b border-slate-200">
                <th className="py-2 pr-3 font-semibold">Started</th>
                <th className="py-2 pr-3 font-semibold">By</th>
                <th className="py-2 pr-3 font-semibold">Status</th>
                <th className="py-2 pr-3 font-semibold">Changed</th>
                <th className="py-2 font-semibold">Message</th>
              </tr>
            </thead>
            <tbody>
              {log.runs.map((run) => (
                <tr key={run.id} className="border-b border-slate-100 align-top">
                  <td className="py-2 pr-3 whitespace-nowrap">{formatDate(run.started_at)}</td>
                  <td className="py-2 pr-3">{run.triggered_by}</td>
                  <td className="py-2 pr-3">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${statusColours[run.status] || statusColours.failed}`}>
                      {run.status}
                    </span>
                  </td>
                  <td className="py-2 pr-3">{run.changed.length ? run.changed.join(', ') : '–'}</td>
                  <td className="py-2 text-slate-600 min-w-64">{run.message}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Card>
  )
}
