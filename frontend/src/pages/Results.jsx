import { Search, Info } from 'lucide-react'
import { Page, Card, Btn } from '../components/ui.jsx'

export default function Results() {
  return (
    <Page title="Scheme search">
      <Card className="p-8 sm:p-12 text-center">
        <Search className="w-12 h-12 mx-auto text-navy-400" />
        <h2 className="mt-4 text-xl font-bold text-navy-900">Scheme search is not connected yet</h2>
        <p className="mt-2 max-w-xl mx-auto text-slate-600">
          No scheme matches, eligibility decisions, or citations are available. Connect the search service to see results grounded in verified sources.
        </p>
        <p className="mt-4 inline-flex items-center gap-2 text-sm text-amber-800">
          <Info className="w-4 h-4 shrink-0" /> Nothing you enter is currently processed or saved.
        </p>
        <div className="mt-6"><Btn to="/" variant="accent">Back to home</Btn></div>
      </Card>
    </Page>
  )
}
