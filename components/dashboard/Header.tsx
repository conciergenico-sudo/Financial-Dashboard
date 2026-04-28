// components/dashboard/Header.tsx

interface HeaderProps {
  companyName: string
  weekLabel: string
  lastUpdated: string
}

export function Header({ companyName, weekLabel, lastUpdated }: HeaderProps) {
  const updated = new Date(lastUpdated)
  const timeStr = updated.toLocaleTimeString('en-US', {
    hour: 'numeric', minute: '2-digit', hour12: true,
  })
  const dateStr = updated.toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{companyName}</h1>
        <p className="text-gray-500 mt-0.5">{weekLabel}</p>
      </div>
      <div className="flex items-center gap-3">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm font-medium">
          <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
          Connected
        </span>
        <span className="text-xs text-gray-400">
          Last updated {dateStr} at {timeStr}
        </span>
      </div>
    </div>
  )
}
