export default function SubjectTopicSelect({ subjects, topics, subjectId, topicId, onChange, disabled }) {
  const filtered = topics.filter(t => t.subject_id === subjectId)
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="text-sm">Subject
        <select disabled={disabled} className="input mt-1" value={subjectId || ''} onChange={e => onChange({ subjectId: e.target.value, topicId: '' })}>
          <option value="">Select subject</option>{subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select></label>
      <label className="text-sm">Topic (optional)
        <select disabled={disabled || !subjectId} className="input mt-1" value={topicId || ''} onChange={e => onChange({ subjectId, topicId: e.target.value })}>
          <option value="">No specific topic</option>{filtered.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select></label>
    </div>
  )
}
