import { describe, it, expect, vi, afterEach } from 'vitest'
import { nextOccurrence, scheduleDailyReminder } from './reminders'

describe('nextOccurrence', () => {
  it('returns today when the time is still ahead', () => {
    const from = new Date('2026-05-16T08:00:00')
    const n = nextOccurrence('20:00', from)
    expect(n.getDate()).toBe(16)
    expect(n.getHours()).toBe(20)
  })

  it('rolls to tomorrow when the time has passed', () => {
    const from = new Date('2026-05-16T21:00:00')
    const n = nextOccurrence('20:00', from)
    expect(n.getDate()).toBe(17)
  })

  it('rolls over when exactly equal', () => {
    const from = new Date('2026-05-16T20:00:00')
    expect(nextOccurrence('20:00', from).getDate()).toBe(17)
  })
})

describe('scheduleDailyReminder', () => {
  afterEach(() => vi.useRealTimers())

  it('notifies at the scheduled time when shouldNotify is true', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-16T19:59:59'))
    const notify = vi.fn()
    const cancel = scheduleDailyReminder({
      time: '20:00',
      shouldNotify: () => true,
      notify,
      now: () => new Date(),
    })
    vi.advanceTimersByTime(2000)
    expect(notify).toHaveBeenCalledTimes(1)
    cancel()
  })

  it('skips notifying when shouldNotify is false but stays armed', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-16T19:59:59'))
    const notify = vi.fn()
    const cancel = scheduleDailyReminder({
      time: '20:00',
      shouldNotify: () => false,
      notify,
    })
    vi.advanceTimersByTime(2000)
    expect(notify).not.toHaveBeenCalled()
    cancel()
  })

  it('does not fire after cancel', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-16T19:00:00'))
    const notify = vi.fn()
    const cancel = scheduleDailyReminder({ time: '20:00', shouldNotify: () => true, notify })
    cancel()
    vi.advanceTimersByTime(3 * 60 * 60 * 1000)
    expect(notify).not.toHaveBeenCalled()
  })
})
