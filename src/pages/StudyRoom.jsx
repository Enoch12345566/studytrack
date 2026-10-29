import { useState } from 'react'
import { Play, Pause, Square } from 'lucide-react'
import { useTable } from '../hooks/useTable'
import { useStudyTimer } from '../hooks/useStudyTimer'
import { fmtClock, todayStr, startOfWeekStr, toDateStr } from '../utils/dates'
import SubjectTopicSelect from '../components/SubjectTopicSelect'

export default function StudyRoom() {
  const timer = useStudyTimer(); const sessions = useTable('study_sessions')
  const subjects = useTable('subjects').rows; const topics = useTable('topics').rows
  const [msg, setMsg] = useState(''); const [m, setM] = useState({ subject_id: '', topic_id: '', minutes: 30, date: todayStr(), notes: '' })

  const stop = () => {
    const s = timer.stop(); const minutes = Math.round(s.ms / 60000)
    if (!s.subject_id) return setMsg('Pick a subject next time so sessions are tracked properly.')
    if (minutes < 1) return setMsg('Session shorter than 1 minute was not saved.')
    sessions.add({ subject_id: s.subject_id, topic_id: s.topic_id, duration_minutes: minutes, notes: s.notes, started_at: s.started_at, ended_at: new Date().toISOString() })
    setMsg(`Saved ${minutes} minute session. Well done!`)
  }
  const logManual = (e) => {
    e.preventDefault()
    const mins = Number(m.minutes)
    if (!m.subject_id) return setMsg('Choose a subject for the manual session.')
    if (!Number.isInteger(mins) || mins < 1 || mins > 720) return setMsg('Minutes must be a whole number from 1 to 720.')
    const at = new Date(`${m.date}T12:00:00`).toISOString()
    sessions.add({ subject_id: m.subject_id, topic_id: m.topic_id, duration_minutes: mins, notes: m.notes, started_at: at, ended_at: at })
    setMsg('Manual session saved.'); setM({ ...m, notes: '' })
  }
  const dayOf = (s) => toDateStr(new Date(s.started_at))
  const sum = (list) => list.reduce((a, s) => a + s.duration_minutes, 0)
  const todayMin = sum(sessions.rows.filter(s => dayOf(s) === todayStr()))
  const weekMin = sum(sessions.rows.filter(s => dayOf(s) >= startOfWeekStr()))
  const active = timer.status !== 'idle'

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h2 className="text-2xl font-bold">Study room</h2>
      <div className="card space-y-4 text-center">
        <p className="text-6xl font-bold tabular-nums text-brand-700" aria-live="off">{fmtClock(timer.elapsedMs)}</p>
        <p className="text-sm text-slate-500">{timer.status === 'paused' ? 'Paused (not counted)' : timer.status === 'running' ? 'Studying…' : 'Ready'}</p>
        <div className="text-left"><SubjectTopicSelect subjects={subjects} topics={topics} disabled={active} subjectId={timer.subjectId} topicId={timer.topicId} onChange={({ subjectId, topicId }) => timer.setFields({ subjectId, topicId })} /></div>
        <textarea aria-label="Session notes" className="input" rows={2} placeholder="Notes about this session" value={timer.notes} onChange={e => timer.setFields({ notes: e.target.value })} />
        <div className="flex justify-center gap-2">
          {timer.status === 'idle' && <button className="btn flex items-center gap-1" disabled={!timer.subjectId} onClick={() => { setMsg(''); timer.start() }}><Play size={16} />Start</button>}
          {timer.status === 'running' && <button className="btn-secondary flex items-center gap-1" onClick={timer.pause}><Pause size={16} />Pause</button>}
          {timer.status === 'paused' && <button className="btn flex items-center gap-1" onClick={timer.resume}><Play size={16} />Resume</button>}
          {active && <button className="btn-secondary flex items-center gap-1 !text-red-600" onClick={stop}><Square size={16} />Stop & save</button>}
        </div>
        {!timer.subjectId && !active && <p className="text-xs text-slate-500">Choose a subject to enable Start.</p>}
      </div>
      {msg && <p role="status" className="rounded-xl bg-brand-50 p-3 text-sm text-brand-700">{msg}</p>}
      <div className="grid grid-cols-2 gap-3">
        <div className="card"><p className="text-xs text-slate-500">Today</p><p className="text-xl font-bold">{todayMin} min</p></div>
        <div className="card"><p className="text-xs text-slate-500">This week</p><p className="text-xl font-bold">{(weekMin / 60).toFixed(1)} h</p></div>
      </div>
      <form onSubmit={logManual} className="card space-y-3">
        <h3 className="font-semibold">Forgot the timer? Log a session</h3>
        <SubjectTopicSelect subjects={subjects} topics={topics} subjectId={m.subject_id} topicId={m.topic_id} onChange={({ subjectId, topicId }) => setM({ ...m, subject_id: subjectId, topic_id: topicId })} />
        <div className="grid grid-cols-2 gap-3">
          <label className="text-sm">Minutes<input type="number" min="1" max="720" className="input mt-1" value={m.minutes} onChange={e => setM({ ...m, minutes: e.target.value })} /></label>
          <label className="text-sm">Date<input type="date" max={todayStr()} className="input mt-1" value={m.date} onChange={e => setM({ ...m, date: e.target.value })} /></label>
        </div>
        <input aria-label="Notes" className="input" placeholder="Notes (optional)" value={m.notes} onChange={e => setM({ ...m, notes: e.target.value })} />
        <button className="btn">Save session</button>
      </form>
    </div>
  )
}
