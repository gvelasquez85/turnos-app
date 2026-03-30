import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatTime(date: string | Date) {
  return new Date(date).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })
}

export function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString('es', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export function generateQueueNumber(count: number) {
  return String(count + 1).padStart(3, '0')
}
