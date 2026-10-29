import { Routes, Route, Link, Navigate } from 'react-router-dom'
import AppLayout from './layouts/AppLayout'
import ProtectedRoute from './components/ProtectedRoute'
import Auth from './pages/Auth'
import Placeholder from './pages/Placeholder'
import Subjects from './pages/Subjects'
import Timetable from './pages/Timetable'
import StudyRoom from './pages/StudyRoom'

const Landing = () => (
  <div className="grid min-h-screen place-items-center bg-gradient-to-br from-brand-900 to-brand-500 p-6 text-center text-white">
    <div><h1 className="text-4xl font-bold">StudyTrack</h1><p className="mt-3 opacity-90">Plan, time, test and track your studies.</p>
      <div className="mt-6 flex justify-center gap-3"><Link to="/signup" className="rounded-xl bg-white px-5 py-2 font-medium text-brand-700">Get started</Link><Link to="/login" className="rounded-xl px-5 py-2 ring-1 ring-white/60">Log in</Link></div></div>
  </div>
)
const pages = ['dashboard','quizzes','progress','goals','history','profile']
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/signup" element={<Auth mode="signup" />} />
      <Route path="/login" element={<Auth mode="login" />} />
      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route path="/subjects" element={<Subjects />} />
        <Route path="/timetable" element={<Timetable />} />
        <Route path="/study" element={<StudyRoom />} />
        {pages.map(p => <Route key={p} path={`/${p}`} element={<Placeholder title={p[0].toUpperCase() + p.slice(1)} />} />)}
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
