import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { LayoutDashboard, BookOpen, CalendarDays, Timer, ListChecks, LineChart, Target, History, User } from 'lucide-react'
const links = [
  ['/dashboard', 'Dashboard', LayoutDashboard], ['/subjects', 'Subjects', BookOpen],
  ['/timetable', 'Timetable', CalendarDays], ['/study', 'Study room', Timer],
  ['/quizzes', 'Quizzes', ListChecks], ['/progress', 'Progress', LineChart],
  ['/goals', 'Goals', Target], ['/history', 'History', History], ['/profile', 'Profile', User],
]
const cls = ({ isActive }) => `flex items-center gap-2 rounded-xl px-3 py-2 text-sm ${isActive ? 'bg-brand-50 font-medium text-brand-700' : 'text-slate-600 hover:bg-slate-100'}`
export default function AppLayout() {
  const { signOut, user } = useAuth()
  return (
    <div className="min-h-screen md:flex">
      <aside className="hidden w-60 shrink-0 border-r bg-white p-4 md:block">
        <h1 className="mb-6 px-3 text-xl font-bold text-brand-700">StudyTrack</h1>
        <nav className="space-y-1">{links.map(([to, label, Icon]) => <NavLink key={to} to={to} className={cls}><Icon size={18} />{label}</NavLink>)}</nav>
        <div className="mt-6 border-t px-3 pt-4 text-xs text-slate-500"><p className="truncate">{user?.full_name}</p><button onClick={signOut} className="mt-1 text-brand-500">Log out</button></div>
      </aside>
      <main className="flex-1 p-4 pb-24 md:p-8"><Outlet /></main>
      <nav className="fixed inset-x-0 bottom-0 flex overflow-x-auto border-t bg-white md:hidden">
        {links.map(([to, label, Icon]) => <NavLink key={to} to={to} className={({ isActive }) => `flex min-w-[72px] flex-col items-center p-2 text-[11px] ${isActive ? 'text-brand-500' : 'text-slate-500'}`}><Icon size={20} />{label}</NavLink>)}
      </nav>
    </div>
  )
}
