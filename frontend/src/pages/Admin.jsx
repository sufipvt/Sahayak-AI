import { Users, MessageSquare, Timer, Star, RefreshCw, Target, Info } from 'lucide-react'
import { Page, Card } from '../components/ui.jsx'

const statIcons = [Users, MessageSquare, Timer, Star]
const statLabels = ['Users', 'Queries', 'Avg response time', 'Rating']

export default function Admin() {
  return (
    <Page title="Admin dashboard" subtitle="System metrics and data operations will appear here when the admin backend is connected.">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statLabels.map((label, i) => {
          const Icon = statIcons[i]
          return (
            <Card key={label} className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-500">{label}</p>
                <span className="w-9 h-9 rounded-lg bg-navy-50 text-navy-700 grid place-items-center"><Icon className="w-4 h-4" /></span>
              </div>
              <p className="mt-2 text-2xl sm:text-3xl font-extrabold text-slate-400">Unavailable</p>
              <p className="mt-1 text-xs text-slate-500">No live data connected</p>
            </Card>
          )
        })}
      </div>

      <div className="mt-6 grid lg:grid-cols-[1.4fr_1fr] gap-6">
        <Card className="p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-navy-900 flex items-center gap-2"><RefreshCw className="w-5 h-5 text-saffron-600" /> Weekly data refresh</h2>
              <p className="text-sm text-slate-500 mt-1">Refresh history is unavailable until a data pipeline is connected.</p>
            </div>
            <button disabled className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold bg-saffron-500 text-navy-900 opacity-50 cursor-not-allowed">
              <RefreshCw className="w-4 h-4" /> Refresh unavailable
            </button>
          </div>

          <div className="mt-5 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
            <Info className="w-8 h-8 mx-auto text-slate-400" />
            <p className="mt-2 font-semibold text-navy-900">No refresh activity available</p>
            <p className="mt-1 text-sm text-slate-500">Refresh actions and scheme change approvals are not connected.</p>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-bold text-navy-900 flex items-center gap-2"><Target className="w-5 h-5 text-saffron-600" /> Evaluation</h2>
          <p className="text-sm text-slate-500 mt-1">Evaluation results are not available.</p>
          <div className="mt-5 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
            <Info className="w-8 h-8 mx-auto text-slate-400" />
            <p className="mt-2 font-semibold text-navy-900">No evaluation data connected</p>
            <p className="mt-1 text-sm text-slate-500">No live performance metrics or test-set scores are shown.</p>
          </div>
        </Card>
      </div>
    </Page>
  )
}
