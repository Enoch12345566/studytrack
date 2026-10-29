import { db } from '../services/storage'
const SUBJECTS = [['Mathematics', '#4f46e5'], ['Physics', '#0ea5e9'], ['Chemistry', '#10b981'], ['Biology', '#f59e0b'], ['English', '#ec4899']]
// Demo mode only. With Supabase, the sign-up trigger in schema.sql creates these.
export async function seedDemoData() {
  if ((await db.list('subjects')).length) return
  for (const [name, color] of SUBJECTS) await db.insert('subjects', { name, color, description: '', is_sample: true })
}
