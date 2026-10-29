// One data layer, two backends. Pages never know which one is active.
import { supabase, isSupabaseConfigured } from './supabaseClient'

// ---------- Demo backend (localStorage) ----------
const PREFIX = 'studytrack:demo:'
const read = (k, fb) => { try { return JSON.parse(localStorage.getItem(PREFIX + k)) ?? fb } catch { return fb } }
const write = (k, v) => localStorage.setItem(PREFIX + k, JSON.stringify(v))
const local = {
  async list(t) { return read(t, []) },
  async insert(t, row) {
    const item = { id: crypto.randomUUID(), created_at: new Date().toISOString(), ...row }
    write(t, [...read(t, []), item]); return item
  },
  async update(t, id, patch) {
    write(t, read(t, []).map(r => r.id === id ? { ...r, ...patch, updated_at: new Date().toISOString() } : r))
  },
  async remove(t, id) { write(t, read(t, []).filter(r => r.id !== id)) },
}

// ---------- Supabase backend ----------
// Empty strings from forms become null (uuid/date columns reject ''), and
// server-owned fields are never sent back. user_id is filled by the database.
const clean = (row) => Object.fromEntries(Object.entries(row).map(([k, v]) => [k, v === '' ? null : v]))
const stripServer = ({ id, user_id, created_at, updated_at, ...rest }) => rest
const check = ({ data, error }) => { if (error) throw new Error(error.message); return data }
const remote = {
  async list(t) { return check(await supabase.from(t).select('*').order('created_at', { ascending: true })) },
  async insert(t, row) { return check(await supabase.from(t).insert(clean(stripServer(row))).select().single()) },
  async update(t, id, patch) { check(await supabase.from(t).update(clean(stripServer(patch))).eq('id', id)) },
  async remove(t, id) { check(await supabase.from(t).delete().eq('id', id)) },
}

export const db = isSupabaseConfigured ? remote : local
