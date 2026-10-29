import { createContext, useContext, useEffect, useState } from 'react'
import { supabase, isSupabaseConfigured } from '../services/supabaseClient'
import { seedDemoData } from '../data/seed'

const AuthContext = createContext(null)
export const useAuth = () => useContext(AuthContext)
const toUser = (u) => u && { id: u.id, email: u.email, full_name: u.user_metadata?.full_name || u.email?.split('@')[0] }

export function AuthProvider({ children }) {
  const demo = !isSupabaseConfigured
  const [user, setUser] = useState(() => demo ? JSON.parse(localStorage.getItem('studytrack:user') || 'null') : null)
  const [loading, setLoading] = useState(!demo)

  useEffect(() => {
    if (demo) return
    supabase.auth.getSession().then(({ data }) => { setUser(toUser(data.session?.user)); setLoading(false) })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => setUser(toUser(session?.user)))
    return () => sub.subscription.unsubscribe()
  }, [demo])

  // Each returns an error message string, or null on success.
  const signUp = async ({ name, email, password }) => {
    if (demo) { await seedDemoData(); const u = { id: 'demo-user', full_name: name, email }; localStorage.setItem('studytrack:user', JSON.stringify(u)); setUser(u); return null }
    const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: name } } })
    if (error) return error.message
    return data.session ? null : 'Account created. Check your email to confirm it, then log in.'
  }
  const signIn = async ({ email, password }) => {
    if (demo) { await seedDemoData(); const u = { id: 'demo-user', full_name: email.split('@')[0], email }; localStorage.setItem('studytrack:user', JSON.stringify(u)); setUser(u); return null }
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return error ? error.message : null
  }
  const signOut = async () => {
    if (demo) { localStorage.removeItem('studytrack:user'); setUser(null) } else await supabase.auth.signOut()
  }
  return <AuthContext.Provider value={{ user, loading, demo, signUp, signIn, signOut }}>{children}</AuthContext.Provider>
}
