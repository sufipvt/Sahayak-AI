import { Link } from 'react-router-dom'
import { ArrowLeft, Info, Search } from 'lucide-react'
import { Page, Card } from '../components/ui.jsx'

export default function SchemeDetail() {
  return (
    <Page>
      <Link to="/results" className="inline-flex items-center gap-1 text-navy-600 hover:underline mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to results
      </Link>
      <Card className="p-8 sm:p-12 text-center bg-gradient-to-br from-white to-navy-50">
        <Search className="w-12 h-12 mx-auto text-navy-400" />
        <h1 className="mt-4 text-2xl font-bold text-navy-900">Scheme details are unavailable</h1>
        <p className="mt-2 max-w-xl mx-auto text-slate-600">
          Scheme information, eligibility, benefits, and official citations will appear here after a verified scheme data source is connected.
        </p>
        <p className="mt-4 inline-flex items-center gap-2 text-sm text-amber-800">
          <Info className="w-4 h-4 shrink-0" /> No scheme data is currently available.
        </p>
      </Card>
    </Page>
  )
}
