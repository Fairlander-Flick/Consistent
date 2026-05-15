// Maps a numeric delta to a semantic tone ('pos' | 'neg' | '')
// given the metric mode. '' = no color (plain/muted).
export function deltaTone(delta, mode) {
  if (mode === 'finance') return delta >= 0 ? 'pos' : 'neg'
  if (mode === 'weightLose') return delta < 0 ? 'pos' : delta > 0 ? 'neg' : ''
  if (mode === 'weightGain') return delta > 0 ? 'pos' : delta < 0 ? 'neg' : ''
  return ''
}
