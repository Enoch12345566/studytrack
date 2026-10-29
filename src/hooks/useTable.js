import { useState, useEffect, useCallback } from 'react'
import { db } from '../services/storage'
// Loads a table, exposes add/edit/remove, and reports loading + errors.
export function useTable(table) {
  const [rows, setRows] = useState([]); const [loading, setLoading] = useState(true); const [error, setError] = useState('')
  const refresh = useCallback(async () => {
    try { setRows(await db.list(table)); setError('') } catch (e) { setError(e.message) } finally { setLoading(false) }
  }, [table])
  useEffect(() => { refresh() }, [refresh])
  const run = async (fn) => { try { const r = await fn(); await refresh(); return r } catch (e) { setError(e.message) } }
  return {
    rows, loading, error,
    add: (r) => run(() => db.insert(table, r)),
    edit: (id, p) => run(() => db.update(table, id, p)),
    remove: (id) => run(() => db.remove(table, id)),
  }
}
