import { UploadCloud, Info } from 'lucide-react'
import { Page, Card } from '../components/ui.jsx'

export default function Upload() {
  return (
    <Page title="Upload a document" subtitle="Document upload and certificate processing are not connected yet." wide={false}>
      <Card className="p-6">
        <div className="border-2 border-dashed border-navy-200 rounded-2xl bg-navy-50/50 p-10 text-center">
          <UploadCloud className="w-14 h-14 mx-auto text-navy-500" />
          <p className="mt-3 text-lg font-semibold text-navy-900">Document upload is unavailable</p>
          <p className="mt-2 max-w-md mx-auto text-slate-500">No files are selected or uploaded. The service will be available after secure document processing is integrated.</p>
        </div>
      </Card>

      <p className="mt-4 flex items-center justify-center gap-2 text-sm text-amber-800 text-center">
        <Info className="w-4 h-4 shrink-0" /> Do not submit personal documents here; this page does not process or store files.
      </p>
    </Page>
  )
}
