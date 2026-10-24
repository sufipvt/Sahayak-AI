import { UploadCloud, FileText, CheckCircle2, X, ScanText, Plus } from 'lucide-react'
import { Page, Card, Btn } from '../components/ui.jsx'

export default function Upload() {
  return (
    <Page title="Upload a document" subtitle="We read key details from your certificate so you don’t have to type them." wide={false}>
      <Card className="p-6">
        <div className="border-2 border-dashed border-navy-200 rounded-2xl bg-navy-50/50 p-10 text-center hover:border-saffron-400 hover:bg-saffron-50/40 transition cursor-pointer">
          <UploadCloud className="w-14 h-14 mx-auto text-navy-500" />
          <p className="mt-3 text-lg font-semibold text-navy-900">Drag and drop your file here</p>
          <p className="text-slate-500">or <span className="text-saffron-700 font-semibold underline">browse files</span></p>
          <p className="mt-2 text-sm text-slate-400">PDF, JPG or PNG · up to 5 MB · Income, caste, domicile certificates</p>
        </div>

        <div className="mt-5 flex items-center gap-3 p-3 rounded-xl border border-slate-200">
          <span className="w-11 h-11 rounded-lg bg-red-50 text-red-600 grid place-items-center"><FileText className="w-5 h-5" /></span>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-navy-900 truncate">income_certificate.pdf</p>
            <div className="mt-1 h-1.5 rounded-full bg-slate-100 overflow-hidden"><div className="h-full w-full bg-emerald-500" /></div>
            <p className="text-xs text-slate-500 mt-1">248 KB · Uploaded · Text read with OCR</p>
          </div>
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <button className="p-1.5 rounded-lg hover:bg-slate-100" aria-label="Remove"><X className="w-4 h-4 text-slate-400" /></button>
        </div>
      </Card>

      <Card className="mt-5 p-6 border-emerald-200 bg-emerald-50/50">
        <p className="text-sm font-semibold text-emerald-700 flex items-center gap-1.5"><ScanText className="w-4 h-4" /> We found</p>
        <p className="mt-2 text-2xl font-bold text-navy-900">Annual income ₹2,40,000</p>
        <p className="text-slate-600 mt-1">Issued by Tehsildar, Gurugram · Valid for financial year 2026–27</p>
        <p className="mt-4 text-lg text-navy-900 font-medium">Add to profile?</p>
        <div className="mt-3 flex flex-wrap gap-3">
          <Btn to="/profile" variant="accent"><Plus className="w-4 h-4" /> Add to profile</Btn>
          <Btn to="/" variant="outline">Not now</Btn>
        </div>
      </Card>

      <p className="mt-4 text-sm text-slate-500 text-center">Your document is used only to read these details and is not stored after processing.</p>
    </Page>
  )
}
