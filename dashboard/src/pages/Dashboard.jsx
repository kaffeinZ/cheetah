import { useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { LayoutDashboard, TrendingUp, Bell, Settings2 } from 'lucide-react'
import { useVrynn } from '../hooks/useVrynn'
import { useTheme } from '../hooks/useTheme'
import Sidebar from '../components/Sidebar'
import ThemeToggle from '../components/ThemeToggle'
import PortfolioView from './views/PortfolioView'
import MarketsView from './views/MarketsView'
import AlertsView from './views/AlertsView'
import SettingsView from './views/SettingsView'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

const MOBILE_NAV = [
  { id: 'portfolio', label: 'Portfolio', icon: LayoutDashboard },
  { id: 'rates',     label: 'Rates',     icon: TrendingUp },
  { id: 'alerts',    label: 'Alerts',    icon: Bell },
  { id: 'settings',  label: 'Settings',  icon: Settings2 },
]

export default function Dashboard() {
  const { publicKey } = useWallet()
  const { portfolio, alerts, loading, error, lastUpdated, refresh } = useVrynn()
  const { dark, toggle } = useTheme()
  const [activePage, setActivePage] = useState('portfolio')

  const address = publicKey?.toBase58() ?? ''
  const short = address ? `${address.slice(0, 4)}...${address.slice(-4)}` : ''

  function renderView() {
    switch (activePage) {
      case 'rates':    return <MarketsView />
      case 'alerts':   return <AlertsView alerts={alerts} />
      case 'settings': return <SettingsView settings={portfolio?.settings} onSaved={(s) => console.log('settings saved', s)} />
      default:         return <PortfolioView portfolio={portfolio} loading={loading} error={error} onRefresh={refresh} />
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex overflow-x-hidden">

      {/* Desktop sidebar */}
      <Sidebar active={activePage} onNavigate={setActivePage} />

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Header */}
        <header className="bg-card border-b border-border px-4 md:px-6 h-16 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            {/* Mobile logo */}
            <span className="md:hidden text-xl font-black gradient-text mr-2">Vrynn</span>
            <Badge variant="outline" style={{ color: '#00c8e0', borderColor: '#00c8e040' }} className="hidden sm:inline-flex">Beta</Badge>
            <span className="hidden sm:inline text-muted-foreground text-xs font-mono">{short}</span>
            {loading && <span className="text-muted-foreground text-xs">Updating…</span>}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={refresh} disabled={loading} className="text-xs h-8 hidden sm:flex">
              ↻ Refresh
            </Button>
            <ThemeToggle dark={dark} toggle={toggle} />
            <WalletMultiButton />
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 md:p-6 overflow-y-auto pb-20 md:pb-6">
          {renderView()}
        </main>

        {/* Mobile bottom nav */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border flex z-50">
          {MOBILE_NAV.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActivePage(id)}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-semibold transition-colors
                ${activePage === id ? 'text-primary' : 'text-muted-foreground'}`}
            >
              <Icon size={20} />
              <span>{label}</span>
            </button>
          ))}
        </nav>

      </div>
    </div>
  )
}