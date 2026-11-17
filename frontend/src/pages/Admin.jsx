import { useCallback, useEffect, useState } from 'react'
import { Users, MessageSquare, MessagesSquare, Star } from 'lucide-react'
import { Page, Card } from '../components/ui.jsx'
import RefreshPanel from '../components/admin/RefreshPanel.jsx'
import SchemesPanel from '../components/admin/SchemesPanel.jsx'
import CentresPanel from '../components/admin/CentresPanel.jsx'
import { useAuth } from '../auth.jsx'
import { getAdminStats, errorMessage } from '../api.js'

export default function Admin() {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [error, setError] = useState('')

  // When a refresh finishes, the schemes list loads again (new dates, highlights).
  const [schemesKey, setSchemesKey] = useState(0)
  const refreshFinished = useCallback(() => setSchemesKey((key) => key + 1), [])

  useEffect(() => {
    if (user?.role !== 'admin') return
    getAdminStats().then(setStats).catch((e) => setError(errorMessage(e)))
  }, [user])

  // Only admins may see this page (the backend checks this too).
  if (user?.role !== 'admin') {
    return (
      <Page title="Admin dashboard" wide={false}>
        <Card className="p-8 text-center">
          <p className="text-lg font-semibold text-navy-900">This page is only for administrators.</p>
          <p className="mt-1 text-slate-600">Admin accounts are created by the project team with create_admin.py.</p>
        </Card>
      </Page>
    )
  }

  const rated = stats ? stats.helpful_answers + stats.unhelpful_answers : 0
  const cards = [
    { Icon: Users, label: 'Users', value: stats?.users },
    { Icon: MessageSquare, label: 'Questions asked', value: stats?.questions },
    { Icon: MessagesSquare, label: 'Conversations', value: stats?.conversations },
    {
      Icon: Star,
      label: 'Helpful answers',
      value: rated ? `${Math.round((stats.helpful_answers / rated) * 100)}%` : '–',
      note: `${rated} rating(s)`,
    },
  ]

  return (
    <Page title="Admin dashboard" subtitle="Usage, official page refresh, schemes and service centres.">
      {error && <p className="mb-4 text-rose-700">{error}</p>}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(({ Icon, label, value, note }) => (
          <Card key={label} className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-500">{label}</p>
              <span className="w-9 h-9 rounded-lg bg-navy-50 text-navy-700 grid place-items-center"><Icon className="w-4 h-4" /></span>
            </div>
            <p className="mt-2 text-2xl sm:text-3xl font-extrabold text-navy-900">{value ?? '…'}</p>
            {note && <p className="mt-1 text-xs text-slate-500">{note}</p>}
          </Card>
        ))}
      </div>

      <div className="mt-6 grid lg:grid-cols-[1.5fr_1fr] gap-6 items-start">
        <RefreshPanel onFinished={refreshFinished} />
        <CentresPanel />
      </div>

      <div className="mt-6">
        <SchemesPanel reloadKey={schemesKey} />
      </div>
    </Page>
  )
}
