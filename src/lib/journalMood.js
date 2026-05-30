// A 5-level mood replaces the old 1-10 day score in the UI. Each mood still
// maps to a numeric score so the existing wellbeing trends, recap and
// consistency heatmap (which read `score`) keep working unchanged.

export const MOODS = [
  { key: 'rough', label: 'Rough', score: 2,  color: '#f87171' },
  { key: 'low',   label: 'Low',   score: 4,  color: '#fb923c' },
  { key: 'okay',  label: 'Okay',  score: 6,  color: '#facc15' },
  { key: 'good',  label: 'Good',  score: 8,  color: '#a3e635' },
  { key: 'great', label: 'Great', score: 10, color: '#4ade80' },
]

// Nearest mood for a stored numeric score (handles legacy 1-10 values too).
export function moodForScore(score) {
  if (score == null) return null
  let best = MOODS[0]
  let bestDist = Infinity
  for (const m of MOODS) {
    const d = Math.abs(m.score - score)
    if (d < bestDist) { bestDist = d; best = m }
  }
  return best
}
