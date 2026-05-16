// Per-exercise progression derived from the training log.
//
// A log entry is { date, exercises: [{ name, sets: [{ reps, weight }] }] }.
// Exercises are matched across sessions by name (ids change when the program
// is edited; the name is the stable identity a user cares about).

// Epley estimated one-rep max.
export function epley1RM(weight, reps) {
  if (!weight || reps <= 0) return 0
  return weight * (1 + reps / 30)
}

function validSets(sets) {
  return (sets || []).filter(s => Number(s.weight) > 0 && Number(s.reps) > 0)
}

// Distinct exercise names that have at least one weighted set, most-used first.
export function listExercises(log) {
  const counts = new Map()
  for (const session of log) {
    for (const ex of session.exercises || []) {
      if (validSets(ex.sets).length === 0) continue
      counts.set(ex.name, (counts.get(ex.name) || 0) + 1)
    }
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([name]) => name)
}

// Chronological per-session summary for one exercise.
export function exerciseProgression(log, name) {
  return log
    .filter(s => (s.exercises || []).some(e => e.name === name && validSets(e.sets).length))
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(session => {
      const ex = session.exercises.find(e => e.name === name)
      const sets = validSets(ex.sets)
      const volume = sets.reduce((sum, s) => sum + s.reps * s.weight, 0)
      const topWeight = Math.max(...sets.map(s => s.weight))
      const best1RM = Math.max(...sets.map(s => epley1RM(s.weight, s.reps)))
      return {
        date: session.date,
        volume,
        topWeight,
        best1RM: Math.round(best1RM * 10) / 10,
        setCount: sets.length,
      }
    })
}

// All-time bests for an exercise (and which session set them).
export function personalRecords(log, name) {
  const prog = exerciseProgression(log, name)
  if (prog.length === 0) return null
  const by = (key) => prog.reduce((best, p) => (p[key] > best[key] ? p : best), prog[0])
  return {
    topWeight: by('topWeight').topWeight,
    topWeightDate: by('topWeight').date,
    best1RM: by('best1RM').best1RM,
    best1RMDate: by('best1RM').date,
    bestVolume: by('volume').volume,
    bestVolumeDate: by('volume').date,
    sessions: prog.length,
  }
}
