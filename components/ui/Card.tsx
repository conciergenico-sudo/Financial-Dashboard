// components/ui/Card.tsx
import { clsx } from 'clsx'

interface CardProps {
  children: React.ReactNode
  className?: string
}

export function Card({ children, className }: CardProps) {
  return (
    <div className={clsx('bg-white rounded-xl shadow-sm border border-gray-100 p-6', className)}>
      {children}
    </div>
  )
}
