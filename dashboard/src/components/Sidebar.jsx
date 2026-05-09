import { useState } from 'react'
import { LayoutDashboard, TrendingUp, Bell, Settings2, ChevronLeft, Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'

const NAV = [
  { id: 'portfolio', label: 'Portfolio',  icon: LayoutDashboard },
  { id: 'rates',     label: 'Live Rates', icon: TrendingUp },
  { id: 'alerts',    label: 'Alerts',     icon: Bell },
  { id: 'settings',  label: 'Settings',   icon: Settings2 },
]

export default function Sidebar({ active, onNavigate }) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside
      className="hidden md:flex h-screen sticky top-0 bg-card border-r border-border flex-col overflow-hidden shrink-0 transition-all duration-200"
      style={{ width: collapsed ? 60 : 220 }}
    >
      {/* Logo + collapse toggle */}
      <div className="flex items-center justify-between px-3 border-b border-border h-16 shrink-0">
        {!collapsed && (
          <span className="text-xl font-black gradient-text pl-1 select-none">Vrynn</span>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0 ml-auto"
          onClick={() => setCollapsed(c => !c)}
        >
          {collapsed ? <Menu size={18} /> : <ChevronLeft size={18} />}
        </Button>
      </div>

      {/* Nav */}
      <nav className="flex-1 flex flex-col gap-1 p-2 pt-4">
        {NAV.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onNavigate(id)}
            title={collapsed ? label : undefined}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors w-full text-left
              ${active === id
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
          >
            <Icon size={18} className="shrink-0" />
            {!collapsed && <span className="truncate">{label}</span>}
          </button>
        ))}
      </nav>
    </aside>
  )
}