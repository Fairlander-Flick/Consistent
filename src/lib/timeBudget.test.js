import { describe, it, expect } from 'vitest'
import {
  dailyAvailableHours, sessionsForDate, dayUsedHours, dayBreakdown, buildWeekFree,
  untimedScheduledLeaves,
} from './timeBudget'

// 2026-05-25 is Monday → week Mon 05-25 … Sun 05-31.
const MON = '2026-05-25'
const TUE = '2026-05-26'

const nodes = [
  {
    id: 'math', title: 'Math', children: [
      { id: 'rog', title: 'Rogawski', kind: 'book', days: ['Mon', 'Wed'], sessionHours: 2, children: [] },
      { id: 'la',  title: 'Linear',   kind: 'book', days: ['Mon'],        sessionHours: 1, children: [] },
    ],
  },
  { id: 'gym', title: 'Gym', kind: 'habit', days: ['Mon', 'Tue'], sessionHours: 1.5, children: [] },
]

describe('dailyAvailableHours', () => {
  it('is 24 minus sleep minus weekly factors averaged over 7 days', () => {
    expect(dailyAvailableHours({})).toBe(24)
    expect(dailyAvailableHours({ sleepPerDay: 8 })).toBe(16)
    // 24 - 8 - (10+7+5)/7 = 16 - 3.142857 = 12.857 → 12.9
    expect(dailyAvailableHours({
      sleepPerDay: 8,
      factors: [{ hoursPerWeek: 10 }, { hoursPerWeek: 7 }, { hoursPerWeek: 5 }],
    })).toBe(12.9)
  })
  it('never goes negative', () => {
    expect(dailyAvailableHours({ sleepPerDay: 30 })).toBe(0)
  })
})

describe('sessions + used hours', () => {
  it('collects scheduled leaves (done or not) for the weekday', () => {
    const mon = sessionsForDate(MON, nodes).map(s => s.id).sort()
    expect(mon).toEqual(['gym', 'la', 'rog'])
    expect(sessionsForDate(TUE, nodes).map(s => s.id)).toEqual(['gym'])
  })
  it('sums session hours per day', () => {
    expect(dayUsedHours(MON, nodes)).toBe(4.5) // 2 + 1 + 1.5
    expect(dayUsedHours(TUE, nodes)).toBe(1.5)
  })
})

describe('dayBreakdown', () => {
  it('groups by root pursuit, sorted desc', () => {
    const b = dayBreakdown(MON, nodes)
    expect(b).toEqual([
      { pursuitId: 'math', title: 'Math', hours: 3 },
      { pursuitId: 'gym',  title: 'Gym',  hours: 1.5 },
    ])
  })
})

describe('untimedScheduledLeaves', () => {
  it('lists scheduled leaves missing sessionHours, with ancestor path', () => {
    const tree = [
      {
        id: 'math', title: 'Math', children: [
          { id: 'rog', title: 'Rogawski', kind: 'book', days: ['Mon'], sessionHours: 2, children: [] },
          { id: 'la',  title: 'Linear',   kind: 'book', days: ['Mon'], sessionHours: null, children: [] },
        ],
      },
      { id: 'gym',  title: 'Gym',  kind: 'habit', days: ['Mon', 'Tue'], sessionHours: 0, children: [] },
      { id: 'read', title: 'Read', kind: 'task',  days: [],             sessionHours: null, children: [] },
    ]
    const res = untimedScheduledLeaves(tree)
    // 'la' (no time), 'gym' (0 still counts as set? no — 0 is a real value).
    expect(res.map(x => x.id)).toEqual(['la'])
    expect(res[0]).toMatchObject({ title: 'Linear', path: ['Math'], days: ['Mon'] })
  })

  it('ignores unscheduled leaves even when untimed', () => {
    const tree = [{ id: 'x', title: 'X', kind: 'task', days: [], sessionHours: null, children: [] }]
    expect(untimedScheduledLeaves(tree)).toEqual([])
  })
})

describe('buildWeekFree', () => {
  it('produces 7 days with free + over flag', () => {
    const week = buildWeekFree(MON, nodes, { sleepPerDay: 8 }, MON) // available 16
    expect(week).toHaveLength(7)
    const mon = week[0]
    expect(mon).toMatchObject({ weekday: 'Mon', used: 4.5, free: 11.5, over: false, isToday: true })
  })
  it('flags an over-budget day', () => {
    const week = buildWeekFree(MON, nodes, { sleepPerDay: 23 }, MON) // available 1
    expect(week[0]).toMatchObject({ over: true })
    expect(week[0].free).toBeLessThan(0)
  })
})
