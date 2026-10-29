import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
export default function Auth({ mode }) {
  const isSignup = mode === 'signup'
  const { signIn, signUp, demo, user } = useAuth(); const nav = useNavigate()
  const [busy, setBusy] = useState(false)
  useEffect(() => { if (user) nav('/dashboard') }, [user, nav])
  const [f, setF] = useState({ name: '', email: '', password: '' }); const [err, setErr] = useState('')
  const submit = async (e) => {
    e.preventDefault()
    if (isSignup && f.name.trim().length < 2) return setErr('Please enter your name.')
    if (!/^\S+@\S+\.\S+$/.test(f.email)) return setErr('Please enter a valid email address.')
    if (f.password.length < 8) return setErr('Password must be at least 8 characters.')
    setBusy(true)
    const msg = await (isSignup ? signUp({ name: f.name.trim(), email: f.email, password: f.password }) : signIn({ email: f.email, password: f.password }))
    setBusy(false)
    if (msg) setErr(msg)
  }
  const set = (k) => (e) => { setErr(''); setF({ ...f, [k]: e.target.value }) }
  return (
    <div className="grid min-h-screen place-items-center bg-gradient-to-br from-brand-50 to-white p-4">
      <form onSubmit={submit} className="card w-full max-w-sm space-y-3">
        <h2 className="text-xl font-bold text-brand-700">{isSignup ? 'Create account' : 'Welcome back'}</h2>
        <p className="text-xs text-slate-500">{demo ? 'Demo mode: data stays in this browser only.' : 'Secure sign-in'}</p>
        {isSignup && <label className="block text-sm">Full name<input className="input mt-1" value={f.name} onChange={set('name')} /></label>}
        <label className="block text-sm">Email<input type="email" className="input mt-1" value={f.email} onChange={set('email')} /></label>
        <label className="block text-sm">Password<input type="password" className="input mt-1" value={f.password} onChange={set('password')} /></label>
        {err && <p role="alert" className="text-sm text-red-600">{err}</p>}
        <button disabled={busy} className="btn w-full disabled:opacity-60">{isSignup ? 'Sign up' : 'Log in'}</button>
        <p className="text-center text-sm"><Link className="text-brand-500" to={isSignup ? '/login' : '/signup'}>{isSignup ? 'Have an account? Log in' : 'New here? Sign up'}</Link></p>
      </form>
    </div>
  )
}
