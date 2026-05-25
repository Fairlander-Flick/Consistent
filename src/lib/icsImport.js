// Minimal ICS (RFC 5545) parser for Consistent's schedule import.
//
// Input  : raw .ics text (multi-VEVENT)
// Output : array of parsed events
//          { label, start: 'HH:MM', end: 'HH:MM',
//            recurring: bool,
//            weekday: 'Mon'..'Sun'    (when recurring)
//            date: 'YYYY-MM-DD'       (when one-off)
//            kind: 'work'|'class'|'oneoff' }
//
// Supports: VEVENT, DTSTART/DTEND (date-time + date), SUMMARY, RRULE FREQ=WEEKLY.
// Line unfolding per RFC 5545 (continuation lines start with space/tab).
// Timezone: parsed values are treated as local clock time. App is single-user;
// good enough for typical Google Calendar exports.

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const ICS_DAYS = { SU: 'Sun', MO: 'Mon', TU: 'Tue', WE: 'Wed', TH: 'Thu', FR: 'Fri', SA: 'Sat' }

function unfold(text) {
  // Replace CRLF + (space|tab) with nothing, joining continuation lines.
  return text.replace(/\r?\n[ \t]/g, '')
}

function parseDateTime(value) {
  // YYYYMMDDTHHMMSS[Z] or YYYYMMDD
  const m = value.match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})Z?)?$/)
  if (!m) return null
  const [, y, mo, d, h, mi] = m
  return {
    isoDate: `${y}-${mo}-${d}`,
    hhmm: h && mi ? `${h}:${mi}` : null,
    weekday: DAYS[new Date(`${y}-${mo}-${d}T00:00:00`).getDay()],
    allDay: !h,
  }
}

function parseRRule(value) {
  const parts = Object.fromEntries(
    value.split(';').map(p => p.split('=')).filter(p => p.length === 2)
  )
  return {
    freq: parts.FREQ,
    byday: parts.BYDAY ? parts.BYDAY.split(',').map(d => ICS_DAYS[d]).filter(Boolean) : null,
  }
}

function classifyKind(label) {
  const s = label.toLowerCase()
  if (/\b(work|shift|job)\b/.test(s)) return 'work'
  // Prefix match (no trailing boundary) so "math" hits "mathematics", etc.
  if (/\b(class|lecture|seminar|exercise|tutorial|deutsch|math|calculus|engineer|programming|biology|chemistry|physics|lab|molecular|applied)/i.test(s)) return 'class'
  return 'oneoff'
}

function parseEventBlock(lines) {
  const ev = {}
  for (const line of lines) {
    const colon = line.indexOf(':')
    if (colon < 0) continue
    const keyPart = line.slice(0, colon)
    const value = line.slice(colon + 1).trim()
    const key = keyPart.split(';')[0].toUpperCase()
    if (key === 'SUMMARY') ev.summary = value.replace(/\\,/g, ',').replace(/\\n/gi, ' ')
    else if (key === 'DTSTART') ev.start = parseDateTime(value)
    else if (key === 'DTEND') ev.end = parseDateTime(value)
    else if (key === 'RRULE') ev.rrule = parseRRule(value)
  }
  return ev
}

export function parseIcs(text) {
  const unfolded = unfold(text)
  const lines = unfolded.split(/\r?\n/)
  const events = []
  let current = null

  for (const line of lines) {
    if (line === 'BEGIN:VEVENT') current = []
    else if (line === 'END:VEVENT' && current) {
      events.push(parseEventBlock(current))
      current = null
    } else if (current) current.push(line)
  }

  const out = []
  for (const e of events) {
    if (!e.summary || !e.start || !e.end) continue
    if (e.start.allDay || e.end.allDay) continue // skip all-day events (don't fit time-block schedule)
    const isWeekly = e.rrule?.freq === 'WEEKLY'
    const label = e.summary.trim()
    const start = e.start.hhmm
    const end = e.end.hhmm
    const kind = classifyKind(label)
    if (isWeekly) {
      const weekdays = e.rrule.byday && e.rrule.byday.length ? e.rrule.byday : [e.start.weekday]
      for (const wd of weekdays) {
        out.push({ label, start, end, kind, recurring: true, weekday: wd })
      }
    } else {
      out.push({ label, start, end, kind, recurring: false, date: e.start.isoDate })
    }
  }
  return out
}

// Build a short human summary for the confirmation modal.
export function summarizeImport(events) {
  const recurring = events.filter(e => e.recurring).length
  const oneoff = events.filter(e => !e.recurring).length
  const byKind = {
    work: events.filter(e => e.kind === 'work').length,
    class: events.filter(e => e.kind === 'class').length,
    oneoff: events.filter(e => e.kind === 'oneoff').length,
  }
  return { total: events.length, recurring, oneoff, byKind }
}
