import { Fragment } from 'react'
import { ArrowRight, ArrowDown, RefreshCw, Database, MapPin, FileStack, ScanText, Scissors, Binary, Layers, User, MonitorSmartphone, Server, UserCog, Search, Bot, MessageSquareQuote, ListChecks } from 'lucide-react'
import { Page, Card } from '../components/ui.jsx'

const offline = [
  { Icon: FileStack, title: 'Scheme sources', sub: 'myScheme, Startup India, PDF' },
  { Icon: ScanText, title: 'Fetch & parse', sub: 'Playwright, BeautifulSoup, PyMuPDF' },
  { Icon: Scissors, title: 'Split by section + metadata', sub: 'scheme_id, section, URL, date' },
  { Icon: Binary, title: 'Embeddings (BGE-small)', sub: 'Dense vectors' },
  { Icon: Layers, title: 'ChromaDB + BM25', sub: 'Vector + keyword index', highlight: true },
]

const online = [
  { Icon: User, title: 'User', sub: 'Plain-language text' },
  { Icon: MonitorSmartphone, title: 'React UI', sub: 'Web, mobile-friendly' },
  { Icon: Server, title: 'FastAPI', sub: 'Backend API' },
  { Icon: UserCog, title: 'Profile extraction (LLM)', sub: 'Age, state, income…' },
  { Icon: ListChecks, title: 'Eligibility rules', sub: 'Python rule check' },
  { Icon: Search, title: 'Hybrid search + re-ranking', sub: 'Filter → BM25 + vector → RRF → rerank', highlight: true },
  { Icon: Bot, title: 'Groq LLM', sub: 'Answers only from context' },
  { Icon: MessageSquareQuote, title: 'Answer with citations', sub: 'Status + sources' },
]

function Box({ Icon, title, sub, highlight, dark }) {
  return (
    <div className={`rounded-xl border-2 p-3 w-full lg:w-auto lg:flex-1 lg:min-w-0 text-center ${
      highlight ? 'border-saffron-400 bg-saffron-50' : dark ? 'border-navy-200 bg-white' : 'border-slate-200 bg-white'
    }`}>
      <Icon className={`w-6 h-6 mx-auto ${highlight ? 'text-saffron-600' : 'text-navy-700'}`} />
      <p className="mt-1.5 font-bold text-navy-900 text-sm leading-snug">{title}</p>
      <p className="text-xs text-slate-500 mt-0.5">{sub}</p>
    </div>
  )
}

function Flow({ items }) {
  return (
    <div className="flex flex-col lg:flex-row items-center lg:items-stretch gap-2">
      {items.map((it, i) => (
        <Fragment key={it.title}>
          <Box {...it} />
          {i < items.length - 1 && (
            <span className="text-saffron-500 shrink-0 self-center">
              <ArrowRight className="w-5 h-5 hidden lg:block" />
              <ArrowDown className="w-5 h-5 lg:hidden" />
            </span>
          )}
        </Fragment>
      ))}
    </div>
  )
}

export default function Architecture() {
  return (
    <Page title="System architecture" subtitle="The Retrieval-Augmented Generation (RAG) pipeline behind Sahayak.">

      <div className="grid xl:grid-cols-[1fr_240px] gap-6">
        <div className="space-y-6">
          <Card className="p-5 sm:p-6 bg-slate-50/60">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <h2 className="font-bold text-navy-900 text-lg">
                <span className="inline-block px-2 py-0.5 mr-2 rounded-md bg-navy-800 text-white text-xs align-middle">OFFLINE</span>
                Ingestion & indexing
              </h2>
              <span className="inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-1 rounded-full bg-saffron-100 text-saffron-700 border border-saffron-200">
                <RefreshCw className="w-4 h-4" /> Weekly refresh (every Sunday)
              </span>
            </div>
            <Flow items={offline} />
          </Card>

          <div className="flex justify-center -my-3">
            <span className="text-xs font-semibold text-slate-500 bg-white border border-slate-200 rounded-full px-3 py-1 flex items-center gap-1">
              <ArrowDown className="w-3.5 h-3.5 text-saffron-500" /> Index is queried at run time
            </span>
          </div>

          <Card className="p-5 sm:p-6 bg-navy-50/60 border-navy-100">
            <h2 className="font-bold text-navy-900 text-lg mb-4">
              <span className="inline-block px-2 py-0.5 mr-2 rounded-md bg-saffron-500 text-navy-900 text-xs align-middle">ONLINE</span>
              Query & answer
            </h2>
            <Flow items={online.map((o) => ({ ...o, dark: true }))} />
          </Card>
        </div>

        <div className="grid sm:grid-cols-3 xl:grid-cols-1 gap-4 content-start">
          <p className="sm:col-span-3 xl:col-span-1 text-sm font-semibold text-slate-500">Supporting services</p>
          {[
            { Icon: Database, title: 'SQLite', sub: 'Users, profiles, history, feedback' },
            { Icon: MapPin, title: 'Service centre finder (map)', sub: 'Banks, post offices and CSCs by location or PIN' },
          ].map(({ Icon, title, sub }) => (
            <div key={title} className="rounded-xl border-2 border-dashed border-navy-200 bg-white p-4 flex gap-3">
              <span className="w-10 h-10 rounded-lg bg-navy-50 text-navy-700 grid place-items-center shrink-0"><Icon className="w-5 h-5" /></span>
              <span>
                <span className="block font-bold text-navy-900 text-sm">{title}</span>
                <span className="text-xs text-slate-500">{sub}</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </Page>
  )
}
