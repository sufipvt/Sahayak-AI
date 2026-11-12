import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Compass, Lock, User, Mail, AlertTriangle, Loader2 } from 'lucide-react'
import { Card } from '../components/ui.jsx'
import { useAuth } from '../auth.jsx'
import { errorMessage } from '../api.js'

function Field({ icon: Icon, label, type = 'text', placeholder, value, onChange, autoComplete }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-navy-800">{label}</span>
      <div className="mt-1 flex items-center gap-2 border border-slate-300 rounded-xl px-3 focus-within:ring-2 focus-within:ring-saffron-300 bg-white">
        <Icon className="w-5 h-5 text-slate-400" />
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          required
          className="w-full py-3 outline-none text-base"
        />
      </div>
    </label>
  )
}

export default function Auth({ mode }) {
  const isLogin = mode === 'login'
  const { login, register } = useAuth()
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      if (isLogin) await login(email, password)
      else await register(name, email, password)
      navigate('/results')
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <Card className="p-6 sm:p-8">
        <div className="text-center">
          <span className="mx-auto w-12 h-12 rounded-2xl bg-navy-900 grid place-items-center">
            <Compass className="w-6 h-6 text-saffron-400" />
          </span>
          <h1 className="mt-4 text-2xl font-bold text-navy-900">{isLogin ? 'Welcome back' : 'Create your account'}</h1>
          <p className="text-slate-600 mt-1">
            {isLogin ? 'Log in to see your saved schemes and history.' : 'Save your profile, chats and schemes.'}
          </p>
        </div>

        <form className="mt-6 space-y-4" onSubmit={submit}>
          {!isLogin && <Field icon={User} label="Full name" placeholder="Your name" value={name} onChange={setName} autoComplete="name" />}
          <Field icon={Mail} label="Email" type="email" placeholder="you@example.com" value={email} onChange={setEmail} autoComplete="email" />
          <Field
            icon={Lock}
            label={isLogin ? 'Password' : 'Password (at least 8 characters)'}
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={setPassword}
            autoComplete={isLogin ? 'current-password' : 'new-password'}
          />

          {error && (
            <p className="flex items-start gap-2 text-sm text-rose-700" role="alert">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" /> {error}
            </p>
          )}

          <button type="submit" disabled={busy} className="w-full py-3 text-lg rounded-xl font-semibold bg-navy-800 text-white hover:bg-navy-700 disabled:opacity-60 inline-flex items-center justify-center gap-2">
            {busy && <Loader2 className="w-5 h-5 animate-spin" />}
            {isLogin ? 'Login' : 'Register'}
          </button>
        </form>

        <p className="mt-6 text-center text-slate-600">
          {isLogin ? 'New to Sahayak? ' : 'Already registered? '}
          <Link to={isLogin ? '/register' : '/login'} className="font-semibold text-saffron-700 hover:underline">
            {isLogin ? 'Create an account' : 'Login'}
          </Link>
        </p>
        <p className="mt-2 text-center">
          <Link to="/results" className="text-sm text-slate-500 hover:underline">Continue as guest (nothing is saved)</Link>
        </p>
      </Card>
    </div>
  )
}
