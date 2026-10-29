const pad = (n) => String(n).padStart(2, '0')
export const toDateStr = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
export const todayStr = () => toDateStr()
export function startOfWeekStr(d = new Date()) {
  const x = new Date(d); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return toDateStr(x) // Monday
}
export const fmtClock = (ms) => { const s = Math.floor(ms / 1000); return `${pad(Math.floor(s / 60))}:${pad(s % 60)}` }
