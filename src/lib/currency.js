// Currency symbol + formatting. Amounts are stored as plain numbers; only
// presentation changes with the selected currency.

export const CURRENCIES = [
  { code: 'EUR', symbol: '€' },
  { code: 'USD', symbol: '$' },
  { code: 'GBP', symbol: '£' },
  { code: 'TRY', symbol: '₺' },
  { code: 'JPY', symbol: '¥' },
  { code: 'CHF', symbol: 'Fr' },
]

const BY_CODE = Object.fromEntries(CURRENCIES.map(c => [c.code, c]))

export function symbolFor(code) {
  return BY_CODE[code]?.symbol ?? '€'
}

// formatMoney(1234.5, 'EUR')                 -> "€1,235"
// formatMoney(-50, 'USD', { signed: true })  -> "−$50"
// formatMoney(50, 'USD', { signed: true })   -> "+$50"
export function formatMoney(amount, code, { signed = false, round = true } = {}) {
  const sym = symbolFor(code)
  const n = round ? Math.round(amount) : amount
  // Pin the locale so grouping is deterministic regardless of the device's
  // regional settings (e.g. "1,235" not "1.235" on a German machine).
  const abs = Math.abs(n).toLocaleString('en-US')
  if (signed) {
    const sign = n < 0 ? '−' : '+'
    return `${sign}${sym}${abs}`
  }
  return `${n < 0 ? '−' : ''}${sym}${abs}`
}
