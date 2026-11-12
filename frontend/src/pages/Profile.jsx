import { useEffect, useState } from 'react'
import { ShieldCheck, Trash2, Loader2, CheckCircle2 } from 'lucide-react'
import { Page, Card, LoginRequired } from '../components/ui.jsx'
import ProfileCard from '../components/ProfileCard.jsx'
import { useAuth } from '../auth.jsx'
import { getSavedProfile, saveProfileToAccount, deleteSavedProfile, errorMessage } from '../api.js'
import { loadProfile, saveProfile } from '../store.js'

export default function Profile() {
  const { user } = useAuth()
  const [profile, setProfile] = useState(loadProfile)
  const [savedInAccount, setSavedInAccount] = useState(false)
  const [consent, setConsent] = useState(false)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  // 1. Load the profile saved in the account (if the user saved one).
  useEffect(() => {
    if (!user) return
    getSavedProfile()
      .then((data) => {
        if (data.profile) {
          setProfile(data.profile)
          saveProfile(data.profile)
          setSavedInAccount(true)
          setConsent(true)
        }
      })
      .catch((e) => setMessage(errorMessage(e)))
      .finally(() => setLoading(false))
  }, [user])

  if (!user) {
    return <Page title="Your profile" wide={false}><LoginRequired what="save your profile" /></Page>
  }

  // 2. Edit the details (stays in this browser until saved to the account).
  function onEdit(newProfile) {
    setProfile(newProfile)
    saveProfile(newProfile)
    setMessage('')
  }

  // 3. Save to the account: only with the consent box ticked.
  async function onSaveToAccount() {
    try {
      await saveProfileToAccount(profile, consent)
      setSavedInAccount(true)
      setMessage('Saved to your account.')
    } catch (e) {
      setMessage(errorMessage(e))
    }
  }

  // 4. Delete from the account at any time.
  async function onDelete() {
    if (!window.confirm('Delete your saved profile from your account?')) return
    try {
      await deleteSavedProfile()
      setSavedInAccount(false)
      setConsent(false)
      setMessage('Your saved profile was deleted from your account.')
    } catch (e) {
      setMessage(errorMessage(e))
    }
  }

  function onClear() {
    setProfile({})
    saveProfile({})
  }

  return (
    <Page title="Your profile" subtitle="These details decide which schemes match you." wide={false}>
      {loading ? (
        <p className="flex items-center gap-2 text-slate-500"><Loader2 className="w-4 h-4 animate-spin" /> Loading…</p>
      ) : (
        <div className="space-y-4">
          <ProfileCard key={JSON.stringify(profile)} profile={profile} onSave={onEdit} onClear={onClear} />

          <Card className="p-5">
            <h2 className="font-bold text-navy-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-saffron-600" /> Save to your account
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              {savedInAccount
                ? 'Your profile is saved. It is updated when you chat, and only you can see it.'
                : 'Not saved yet. Saving lets Sahayak remember you on any device.'}
            </p>

            <label className="mt-3 flex items-start gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1" />
              <span>
                I agree that Sahayak stores these details in my account to find schemes for me.
                My questions are processed by an external AI service (Groq). I can delete the saved profile at any time.
              </span>
            </label>

            <div className="mt-4 flex flex-wrap gap-2">
              <button onClick={onSaveToAccount} disabled={!consent}
                className="px-4 py-2 rounded-lg bg-navy-800 text-white font-semibold disabled:opacity-50">
                Save to account
              </button>
              {savedInAccount && (
                <button onClick={onDelete} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-rose-300 text-rose-700 font-semibold hover:bg-rose-50">
                  <Trash2 className="w-4 h-4" /> Delete saved profile
                </button>
              )}
            </div>

            {message && (
              <p className="mt-3 flex items-center gap-1.5 text-sm text-navy-800" role="status">
                <CheckCircle2 className="w-4 h-4" /> {message}
              </p>
            )}
          </Card>
        </div>
      )}
    </Page>
  )
}
