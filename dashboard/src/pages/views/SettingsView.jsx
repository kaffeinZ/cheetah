import Settings from '../../components/Settings'
import TelegramLink from '../../components/TelegramLink'

export default function SettingsView({ settings, onSaved }) {
  return (
    <div className="flex flex-col gap-4 max-w-lg">
      <div>
        <h2 className="text-lg font-black">Settings</h2>
        <p className="text-muted-foreground text-sm">Alert thresholds and Telegram notifications.</p>
      </div>
      <Settings settings={settings} onSaved={onSaved} />
      <TelegramLink />
    </div>
  )
}