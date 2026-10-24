import { useState } from 'react'
import { UserRound, Info } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Page, Card, Btn } from '../components/ui.jsx'

export default function Profile() {
  return (
    <Page title="Your profile" subtitle="Your details will appear here when profile services are connected." wide={false}>
      <Card className="p-8 text-center">
        <UserRound className="w-12 h-12 mx-auto text-navy-400" />
        <h2 className="mt-4 text-xl font-bold text-navy-900">No profile details yet</h2>
        <p className="mt-2 text-slate-600">No personal information has been submitted or saved.</p>
        <p className="mt-4 inline-flex items-center gap-2 text-sm text-amber-800">
          <Info className="w-4 h-4 shrink-0" /> Profile extraction and storage are not connected yet.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Btn to="/" variant="accent">Start with a question</Btn>
          <Link to="/results" className="inline-flex items-center px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-navy-800 font-semibold hover:bg-slate-50">
            View search status
          </Link>
        </div>
      </Card>
    </Page>
  )
}
