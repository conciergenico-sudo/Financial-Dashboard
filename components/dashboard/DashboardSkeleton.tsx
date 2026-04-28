// components/dashboard/DashboardSkeleton.tsx

function Pulse({ className }: { className: string }) {
  return <div className={`animate-pulse rounded bg-gray-200 ${className}`} />
}

function CardSkeleton({ height = 'h-48' }: { height?: string }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <Pulse className="h-4 w-32 mb-4" />
      <Pulse className={height} />
    </div>
  )
}

export function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <Pulse className="h-7 w-48 mb-2" />
            <Pulse className="h-4 w-32" />
          </div>
          <Pulse className="h-8 w-32 rounded-full" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <Pulse className="h-4 w-32 mb-3" />
              <Pulse className="h-8 w-24 mb-2" />
              <Pulse className="h-3 w-28" />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          <CardSkeleton height="h-56" />
          <CardSkeleton height="h-56" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          <CardSkeleton height="h-56" />
          <CardSkeleton height="h-56" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          <CardSkeleton height="h-48" />
          <CardSkeleton height="h-48" />
        </div>

        <CardSkeleton height="h-48" />
      </div>
    </div>
  )
}
