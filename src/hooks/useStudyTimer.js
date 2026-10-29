import { useState, useEffect } from 'react'
const KEY = 'studytrack:timer'
const idle = { status: 'idle', accumulatedMs: 0, runStart: null, sessionStart: null, subjectId: '', topicId: '', notes: '' }
const load = () => { try { return { ...idle, ...JSON.parse(localStorage.getItem(KEY)) } } catch { return idle } }

// Elapsed time is computed from timestamps, never counted by the interval,
// so it survives page changes and refreshes. Paused time is never added.
export function useStudyTimer() {
  const [t, setT] = useState(load)
  const [, tick] = useState(0)
  useEffect(() => { if (t.status !== 'running') return; const i = setInterval(() => tick(n => n + 1), 500); return () => clearInterval(i) }, [t.status])
  const save = (next) => { localStorage.setItem(KEY, JSON.stringify(next)); setT(next) }
  const elapsedMs = t.accumulatedMs + (t.status === 'running' ? Date.now() - t.runStart : 0)
  return {
    ...t, elapsedMs,
    setFields: (p) => save({ ...t, ...p }),
    start: () => save({ ...t, status: 'running', runStart: Date.now(), accumulatedMs: 0, sessionStart: new Date().toISOString() }),
    pause: () => save({ ...t, status: 'paused', accumulatedMs: elapsedMs, runStart: null }),
    resume: () => save({ ...t, status: 'running', runStart: Date.now() }),
    // returns the finished session data and clears the timer
    stop: () => { const out = { ms: elapsedMs, started_at: t.sessionStart, subject_id: t.subjectId, topic_id: t.topicId, notes: t.notes }; save(idle); return out },
  }
}
