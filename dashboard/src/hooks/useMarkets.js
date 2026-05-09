import { useState, useEffect } from 'react'

const API = import.meta.env.VITE_API_URL ?? ''

export function useMarkets() {
  const [markets, setMarkets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const res  = await fetch(`${API}/api/markets`)
        const data = await res.json()
        if (!cancelled) setMarkets(data)
      } catch (e) {
        if (!cancelled) setError(e.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    const interval = setInterval(load, 5 * 60 * 1000)
    return () => { cancelled = true; clearInterval(interval) }
  }, [])

  return { markets, loading, error }
}
