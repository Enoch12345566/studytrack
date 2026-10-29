import { useState } from 'react'
import { Trash2, Plus, Pencil } from 'lucide-react'
import { useTable } from '../hooks/useTable'

const STATUS = [['not_started', 'Not started'], ['in_progress', 'In progress'], ['completed', 'Completed']]
const PRIORITY = ['low', 'medium', 'high']

export default function Subjects() {
  const subjects = useTable('subjects'); const topics = useTable('topics')
  const [name, setName] = useState(''); const [err, setErr] = useState('')
  const [newTopic, setNewTopic] = useState({}) // subjectId -> text

  const addSubject = (e) => {
    e.preventDefault()
    if (name.trim().length < 2) return setErr('Subject name needs at least 2 characters.')
    if (subjects.rows.some(s => s.name.toLowerCase() === name.trim().toLowerCase())) return setErr('That subject already exists.')
    subjects.add({ name: name.trim(), color: '#4f46e5', description: '' }); setName(''); setErr('')
  }
  const rename = (s) => {
    const v = window.prompt('Rename subject', s.name)
    if (v && v.trim().length >= 2) subjects.edit(s.id, { name: v.trim() })
  }
  const delSubject = (s) => {
    if (!window.confirm(`Delete "${s.name}" and all its topics?`)) return
    topics.rows.filter(t => t.subject_id === s.id).forEach(t => topics.remove(t.id)); subjects.remove(s.id)
  }
  const addTopic = (s) => {
    const text = (newTopic[s.id] || '').trim()
    if (text.length < 2) return
    topics.add({ subject_id: s.id, name: text, status: 'not_started', priority: 'medium' })
    setNewTopic({ ...newTopic, [s.id]: '' })
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h2 className="text-2xl font-bold">Subjects & topics</h2>
      <form onSubmit={addSubject} className="card flex gap-2">
        <input aria-label="New subject name" className="input" placeholder="Add a subject, e.g. Geography" value={name} onChange={e => { setName(e.target.value); setErr('') }} />
        <button className="btn flex items-center gap-1"><Plus size={16} />Add</button>
      </form>
      {err && <p role="alert" className="text-sm text-red-600">{err}</p>}
      {subjects.rows.length === 0 && <div className="card text-sm text-slate-500">No subjects yet. Add your first one above.</div>}
      {subjects.rows.map(s => {
        const ts = topics.rows.filter(t => t.subject_id === s.id)
        const pct = ts.length ? Math.round(ts.filter(t => t.status === 'completed').length / ts.length * 100) : 0
        return (
          <section key={s.id} className="card space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">{s.name} {s.is_sample && <span className="ml-1 rounded bg-brand-50 px-2 py-0.5 text-xs text-brand-500">Sample</span>}</h3>
              <div className="flex gap-1">
                <button aria-label={`Rename ${s.name}`} onClick={() => rename(s)} className="p-2 text-slate-500 hover:text-brand-500"><Pencil size={16} /></button>
                <button aria-label={`Delete ${s.name}`} onClick={() => delSubject(s)} className="p-2 text-slate-500 hover:text-red-600"><Trash2 size={16} /></button>
              </div>
            </div>
            <div><div className="h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-brand-500 transition-all" style={{ width: `${pct}%` }} /></div>
              <p className="mt-1 text-xs text-slate-500">{pct}% complete · {ts.length} topic{ts.length === 1 ? '' : 's'}</p></div>
            <ul className="space-y-2">
              {ts.map(t => (
                <li key={t.id} className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="flex-1 min-w-[120px]">{t.name}</span>
                  <select aria-label="Status" className="input w-auto" value={t.status} onChange={e => topics.edit(t.id, { status: e.target.value })}>{STATUS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
                  <select aria-label="Priority" className="input w-auto" value={t.priority} onChange={e => topics.edit(t.id, { priority: e.target.value })}>{PRIORITY.map(p => <option key={p} value={p}>{p}</option>)}</select>
                  <button aria-label={`Delete topic ${t.name}`} onClick={() => window.confirm(`Delete topic "${t.name}"?`) && topics.remove(t.id)} className="p-1 text-slate-400 hover:text-red-600"><Trash2 size={14} /></button>
                </li>
              ))}
            </ul>
            <div className="flex gap-2">
              <input aria-label={`New topic for ${s.name}`} className="input" placeholder="Add a topic" value={newTopic[s.id] || ''} onChange={e => setNewTopic({ ...newTopic, [s.id]: e.target.value })} onKeyDown={e => e.key === 'Enter' && addTopic(s)} />
              <button className="btn-secondary" onClick={() => addTopic(s)}>Add topic</button>
            </div>
          </section>
        )
      })}
    </div>
  )
}
