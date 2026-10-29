import { useState } from 'react'
import { Trash2, Pencil, Check } from 'lucide-react'
import { useTable } from '../hooks/useTable'
import { todayStr } from '../utils/dates'
import SubjectTopicSelect from '../components/SubjectTopicSelect'

const blank = () => ({ title: '', description: '', subject_id: '', topic_id: '', scheduled_date: todayStr(), start_time: '16:00', end_time: '17:00' })

export default function Timetable() {
  const tasks = useTable('study_tasks'); const subjects = useTable('subjects').rows; const topics = useTable('topics').rows
  const [f, setF] = useState(blank()); const [editId, setEditId] = useState(null); const [err, setErr] = useState('')
  const subjName = (id) => subjects.find(s => s.id === id)?.name || 'General'

  const submit = (e) => {
    e.preventDefault()
    if (f.title.trim().length < 2) return setErr('Give the task a title.')
    if (!f.subject_id) return setErr('Please choose a subject.')
    if (f.end_time <= f.start_time) return setErr('End time must be after start time.')
    if (editId) tasks.edit(editId, f); else tasks.add({ ...f, status: 'planned' })
    setF(blank()); setEditId(null); setErr('')
  }
  const now = new Date(); const nowTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
  const isOverdue = (t) => t.status !== 'completed' && (t.scheduled_date < todayStr() || (t.scheduled_date === todayStr() && t.end_time < nowTime))
  const sorted = [...tasks.rows].sort((a, b) => (a.scheduled_date + a.start_time).localeCompare(b.scheduled_date + b.start_time))
  const byDate = sorted.reduce((acc, t) => ((acc[t.scheduled_date] ||= []).push(t), acc), {})

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h2 className="text-2xl font-bold">Study timetable</h2>
      <form onSubmit={submit} className="card space-y-3">
        <input aria-label="Task title" className="input" placeholder="What will you study?" value={f.title} onChange={e => setF({ ...f, title: e.target.value })} />
        <SubjectTopicSelect subjects={subjects} topics={topics} subjectId={f.subject_id} topicId={f.topic_id} onChange={({ subjectId, topicId }) => setF({ ...f, subject_id: subjectId, topic_id: topicId })} />
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="text-sm">Date<input type="date" className="input mt-1" value={f.scheduled_date} onChange={e => setF({ ...f, scheduled_date: e.target.value })} /></label>
          <label className="text-sm">Start<input type="time" className="input mt-1" value={f.start_time} onChange={e => setF({ ...f, start_time: e.target.value })} /></label>
          <label className="text-sm">End<input type="time" className="input mt-1" value={f.end_time} onChange={e => setF({ ...f, end_time: e.target.value })} /></label>
        </div>
        <input aria-label="Description" className="input" placeholder="Short description (optional)" value={f.description} onChange={e => setF({ ...f, description: e.target.value })} />
        {err && <p role="alert" className="text-sm text-red-600">{err}</p>}
        <div className="flex gap-2"><button className="btn">{editId ? 'Save changes' : 'Add task'}</button>
          {editId && <button type="button" className="btn-secondary" onClick={() => { setEditId(null); setF(blank()) }}>Cancel</button>}</div>
      </form>
      {sorted.length === 0 && <div className="card text-sm text-slate-500">No tasks yet. Plan your first study session above.</div>}
      {Object.entries(byDate).map(([date, list]) => (
        <section key={date}>
          <h3 className="mb-2 text-sm font-semibold text-slate-500">{date === todayStr() ? `Today (${date})` : date}</h3>
          <ul className="space-y-2">{list.map(t => (
            <li key={t.id} className={`card flex items-center gap-3 !p-3 ${t.status === 'completed' ? 'opacity-60' : ''} ${isOverdue(t) ? 'ring-red-300' : ''}`}>
              <button aria-label={t.status === 'completed' ? 'Mark as planned' : 'Mark as completed'} onClick={() => tasks.edit(t.id, { status: t.status === 'completed' ? 'planned' : 'completed' })}
                className={`grid h-6 w-6 place-items-center rounded-full border ${t.status === 'completed' ? 'border-green-500 bg-green-500 text-white' : 'border-slate-300'}`}>{t.status === 'completed' && <Check size={14} />}</button>
              <div className="flex-1 text-sm"><p className={`font-medium ${t.status === 'completed' ? 'line-through' : ''}`}>{t.title}</p>
                <p className="text-xs text-slate-500">{subjName(t.subject_id)} · {t.start_time}–{t.end_time} {isOverdue(t) && <span className="font-medium text-red-600">· Overdue</span>}</p></div>
              <button aria-label="Edit task" onClick={() => { setF({ ...blank(), ...t }); setEditId(t.id); window.scrollTo(0, 0) }} className="p-1 text-slate-400 hover:text-brand-500"><Pencil size={16} /></button>
              <button aria-label="Delete task" onClick={() => window.confirm('Delete this task?') && tasks.remove(t.id)} className="p-1 text-slate-400 hover:text-red-600"><Trash2 size={16} /></button>
            </li>))}</ul>
        </section>
      ))}
    </div>
  )
}
