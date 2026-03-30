import { cn } from '@/lib/utils'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'waiting' | 'in_progress' | 'done' | 'cancelled' | 'default'
  className?: string
}

const variants = {
  waiting: 'bg-yellow-100 text-yellow-800',
  in_progress: 'bg-blue-100 text-blue-800',
  done: 'bg-green-100 text-green-800',
  cancelled: 'bg-gray-100 text-gray-600',
  default: 'bg-indigo-100 text-indigo-800',
}

const labels: Record<string, string> = {
  waiting: 'En espera',
  in_progress: 'En atención',
  done: 'Atendido',
  cancelled: 'Cancelado',
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', variants[variant], className)}>
      {typeof children === 'string' && labels[children] ? labels[children] : children}
    </span>
  )
}
