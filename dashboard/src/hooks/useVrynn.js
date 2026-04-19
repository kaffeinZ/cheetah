import { useState, useEffect, useCallback } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'

const API = 'https://vrynn.xyz/api'

export function useVrynn() {
  const { publicKey } = useWallet()
  const [portfolio, setPortfolio]     = useState(null)
  const [alerts, setAlerts]           = useState([])
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)

  const fetchData = useCallback(async () => {
    if (!publicKey) return
    setLoading(true)
    setError(null)
    try {
      const address = publicKey.toBase58()
      const [portfolioRes, alertsRes] = await Promise.all([
        fetch(`${API}/portfolio/${address}`),
        fetch(`${API}/alerts/${address}?limit=10`),
      ])
      const portfolioData = await portfolioRes.json()
      const alertsData    = await alertsRes.json()
      if (!portfolioRes.ok) throw new Error(portfolioData.error)
      setPortfolio(portfolioData)
      setAlerts(alertsData)
      setLastUpdated(new Date().toLocaleTimeString())
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [publicKey])

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 60_000)
    return () => clearInterval(interval)
  }, [fetchData])

  return { portfolio, alerts, loading, error, lastUpdated, refresh: fetchData }
}
