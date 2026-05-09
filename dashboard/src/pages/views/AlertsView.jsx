import AlertHistory from '../../components/AlertHistory'

export default function AlertsView({ alerts }) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-black">Alert History</h2>
        <p className="text-muted-foreground text-sm">Health factor warnings and liquidation alerts for your wallet.</p>
      </div>
      <AlertHistory alerts={alerts} fullPage />
    </div>
  )
}