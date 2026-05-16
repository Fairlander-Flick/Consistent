import { describe, it, expect } from 'vitest'
import { symbolFor, formatMoney, CURRENCIES } from './currency'

describe('symbolFor', () => {
  it('maps known codes', () => {
    expect(symbolFor('USD')).toBe('$')
    expect(symbolFor('TRY')).toBe('₺')
  })
  it('falls back to € for unknown codes', () => {
    expect(symbolFor('XXX')).toBe('€')
    expect(symbolFor(undefined)).toBe('€')
  })
})

describe('formatMoney', () => {
  it('prefixes the symbol and rounds by default', () => {
    expect(formatMoney(1234.5, 'EUR')).toBe('€1,235')
  })
  it('shows a leading minus for negatives', () => {
    expect(formatMoney(-50, 'USD')).toBe('−$50')
  })
  it('signed mode always shows + or −', () => {
    expect(formatMoney(50, 'USD', { signed: true })).toBe('+$50')
    expect(formatMoney(-50, 'USD', { signed: true })).toBe('−$50')
  })
  it('can skip rounding', () => {
    expect(formatMoney(12.34, 'EUR', { round: false })).toBe('€12.34')
  })
})

describe('CURRENCIES', () => {
  it('includes EUR first as the default', () => {
    expect(CURRENCIES[0].code).toBe('EUR')
  })
})
