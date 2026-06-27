import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const brlFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const brlNumberFormatter = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export function formatBRL(value: number | string | null | undefined): string {
  const n = Number(value ?? 0)
  return brlFormatter.format(isNaN(n) ? 0 : n)
}

export function formatBRLNumber(value: number | string | null | undefined): string {
  const n = Number(value ?? 0)
  return brlNumberFormatter.format(isNaN(n) ? 0 : n)
}

export function parseBRL(value: string): number {
  if (!value) return 0
  const cleaned = value
    .replace(/R\$\s?/g, '')
    .replace(/\./g, '')
    .replace(',', '.')
    .trim()
  const n = parseFloat(cleaned)
  return isNaN(n) ? 0 : n
}
