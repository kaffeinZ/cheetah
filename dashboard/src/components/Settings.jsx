import { useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'

const API = 'https://vrynn.xyz/api'

export default function Settings({ settings, onSaved }) {
  const { publicKey } = useWallet()
  const [hfWarning,        setHfWarning]        = useState(settings?.hf_warning        ?? 1.5)
  const [perpAlertPct,     setPerpAlertPct]     = useState(settings?.perp_alert_pct     ?? 10)
  const [perpCriticalPct,  setPerpCriticalPct]  = useState(settings?.perp_critical_pct  ?? 5)
  const [saving,           setSaving]           = useState(false)
  const [error,            setError]            = useState(null)
  const [saved,            setSaved]            = useState(false)

  async function handleSave() {
    if (!publicKey) return
    setSaving(true)
    setError(null)
    setSaved(false)
    try {
      const auth      = JSON.parse(localStorage.getItem('vrynn_auth') || '{}')
      const signature = auth.signature
      if (!signature) throw new Error('Session expired — please reconnect your wallet')
      const res = await fetch(`${API}/settings`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          address:          publicKey.toBase58(),
          signature,
          hfWarning:        parseFloat(hfWarning),
          perpAlertPct:     parseFloat(perpAlertPct),
          perpCriticalPct:  parseFloat(perpCriticalPct),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setSaved(true)
      onSaved?.(data.settings)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <span className="font-semibold text-sm">Dashboard Thresholds</span>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">

        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <Label className="text-muted-foreground text-xs">Lending warning threshold (HF)</Label>
            <span className="font-mono font-bold text-sm" style={{ color: '#e06000' }}>{parseFloat(hfWarning).toFixed(2)}</span>
          </div>
          <Slider
            value={[parseFloat(hfWarning)]}
            onValueChange={([v]) => setHfWarning(v)}
            min={1.05} max={2.5} step={0.05}
          />
          <p className="text-muted-foreground text-xs">Lending HF indicator turns orange below this</p>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <Label className="text-muted-foreground text-xs">Perp warning zone</Label>
            <span className="font-mono font-bold text-sm" style={{ color: '#e06000' }}>{parseFloat(perpAlertPct).toFixed(0)}% from liq</span>
          </div>
          <Slider
            value={[parseFloat(perpAlertPct)]}
            onValueChange={([v]) => setPerpAlertPct(Math.max(v, parseFloat(perpCriticalPct) + 1))}
            min={3} max={30} step={1}
          />
          <p className="text-muted-foreground text-xs">Liq. Distance turns orange when within this range</p>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <Label className="text-muted-foreground text-xs">Perp danger zone</Label>
            <span className="font-mono font-bold text-sm" style={{ color: '#e0007a' }}>{parseFloat(perpCriticalPct).toFixed(0)}% from liq</span>
          </div>
          <Slider
            value={[parseFloat(perpCriticalPct)]}
            onValueChange={([v]) => setPerpCriticalPct(Math.min(v, parseFloat(perpAlertPct) - 1))}
            min={1} max={15} step={1}
          />
          <p className="text-muted-foreground text-xs">Liq. Distance turns red when within this range</p>
        </div>

        {error && <p className="text-[#e0007a] text-sm">{error}</p>}

        <div className="flex items-center justify-between">
          {saved ? <p className="text-[#2ecc00] text-xs font-medium">Saved ✓</p> : <span />}
          <Button
            onClick={handleSave}
            disabled={saving}
            className="text-white"
            style={{ background: 'linear-gradient(90deg, #00c8e0, #7000e0)' }}
          >
            {saving ? 'Signing...' : 'Save'}
          </Button>
        </div>

      </CardContent>
    </Card>
  )
}
