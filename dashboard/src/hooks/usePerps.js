import { useState, useEffect } from 'react'

const API = import.meta.env.VITE_API_URL ?? ''

export function usePerps() {
  const [perps,   setPerps]   = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  useEffect(() => {
    async function load() {
      try {
        setLoading(true)
        const data = await fetch(`${API}/api/perps`).then(r => r.json())
        setPerps(Array.isArray(data) ? data : [])
        setError(null)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    load()
    const id = setInterval(load, 5 * 60 * 1000)
    return () => clearInterval(id)
  }, [])

  return { perps, loading, error }
}
