import { MessageSquare, Bookmark } from 'lucide-react'
import { Page, Card } from '../components/ui.jsx'

export default function History() {
  return (
    <Page title="History & saved schemes" subtitle="Your conversations and saved schemes will appear here when account services are connected.">
      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="p-5">
          <h2 className="font-bold text-lg text-navy-900 flex items-center gap-2"><MessageSquare className="w-5 h-5 text-saffron-600" /> Past chats</h2>
          <p className="mt-4 py-8 text-center text-slate-500">Chat history is unavailable until account services are connected.</p>
        </Card>

        <Card className="p-5">
          <h2 className="font-bold text-lg text-navy-900 flex items-center gap-2"><Bookmark className="w-5 h-5 text-saffron-600" /> Saved schemes</h2>
          <p className="mt-4 py-8 text-center text-slate-500">Saved schemes are unavailable until account services are connected.</p>
        </Card>
      </div>
    </Page>
  )
}
