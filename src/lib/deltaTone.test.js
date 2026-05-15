import { describe, it, expect } from 'vitest'
import { deltaTone } from './deltaTone'

describe('deltaTone', () => {
  it('finance: >=0 is pos, <0 is neg', () => {
    expect(deltaTone(5, 'finance')).toBe('pos')
    expect(deltaTone(0, 'finance')).toBe('pos')
    expect(deltaTone(-1, 'finance')).toBe('neg')
  })

  it('weightLose: down is good', () => {
    expect(deltaTone(-1, 'weightLose')).toBe('pos')
    expect(deltaTone(1, 'weightLose')).toBe('neg')
    expect(deltaTone(0, 'weightLose')).toBe('')
  })

  it('weightGain: up is good', () => {
    expect(deltaTone(1, 'weightGain')).toBe('pos')
    expect(deltaTone(-1, 'weightGain')).toBe('neg')
    expect(deltaTone(0, 'weightGain')).toBe('')
  })

  it('neutral and unknown modes are always empty', () => {
    expect(deltaTone(5, 'neutral')).toBe('')
    expect(deltaTone(-5, 'neutral')).toBe('')
    expect(deltaTone(5, 'whatever')).toBe('')
  })
})
