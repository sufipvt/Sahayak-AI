import { Link } from 'react-router-dom'
import { Compass, Phone, Lock, User, Mail, Info } from 'lucide-react'
import { Card } from '../components/ui.jsx'

function Field({ icon: Icon, label, type = 'text', placeholder }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-navy-800">{label}</span>
      <div className="mt-1 flex items-center gap-2 border border-slate-300 rounded-xl px-3 focus-within:ring-2 focus-within:ring-saffron-300 bg-white">
        <Icon className="w-5 h-5 text-slate-400" />
        <input type={type} placeholder={placeholder} className="w-full py-3 outline-none text-base" />
      </div>
    </label>
  )
}

export default function Auth({ mode }) {
  const isLogin = mode === 'login'

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <Card className="p-6 sm:p-8">
        <div className="text-center">
          <span className="mx-auto w-12 h-12 rounded-2xl bg-navy-900 grid place-items-center">
            <Compass className="w-6 h-6 text-saffron-400" />
          </span>
          <h1 className="mt-4 text-2xl font-bold text-navy-900">{isLogin ? 'Welcome back' : 'Create your account'}</h1>
          <p className="text-slate-600 mt-1">
            {isLogin ? 'Log in to see your saved schemes and history.' : 'Save your profile and get updates on new schemes.'}
          </p>
        </div>

        <form className="mt-6 space-y-4" onSubmit={(e) => e.preventDefault()}>
          {!isLogin && <Field icon={User} label="Full name" placeholder="Your name" />}
          <Field icon={Phone} label="Mobile number" placeholder="98XXXXXXXX" />
          {!isLogin && <Field icon={Mail} label="Email (optional)" placeholder="you@example.com" />}
          <Field icon={Lock} label="Password" type="password" placeholder="••••••••" />
          {isLogin && (
            <p className="text-right text-sm text-slate-500">OTP login is not connected yet.</p>
          )}
          <button type="submit" disabled className="w-full py-3 text-lg rounded-xl font-semibold bg-navy-800 text-white opacity-50 cursor-not-allowed">
            {isLogin ? 'Login' : 'Register'}
          </button>
        </form>

        <p className="mt-4 flex items-start gap-2 text-sm text-amber-800">
          <Info className="w-4 h-4 shrink-0 mt-0.5" /> Authentication is not connected; this form will not create an account or sign you in.
        </p>
        <p className="mt-6 text-center text-slate-600">
          {isLogin ? 'New to Sahayak? ' : 'Already registered? '}
          <Link to={isLogin ? '/register' : '/login'} className="font-semibold text-saffron-700 hover:underline">
            {isLogin ? 'Create an account' : 'Login'}
          </Link>
        </p>
        <p className="mt-2 text-center">
          <Link to="/results" className="text-sm text-slate-500 hover:underline">Continue as guest</Link>
        </p>
      </Card>
    </div>
  )
}
