export const QUOTES = [
  { text: "The struggle itself toward the heights is enough to fill a man's heart.", author: 'Camus', year: 1942 },
  { text: "One must imagine Sisyphus happy.", author: 'Camus', year: 1942 },
  { text: "You have power over your mind — not outside events. Realize this, and you will find strength.", author: 'Marcus Aurelius', year: 180 },
  { text: "Waste no more time arguing what a good man should be. Be one.", author: 'Marcus Aurelius', year: 180 },
  { text: "We suffer more often in imagination than in reality.", author: 'Seneca', year: 65 },
  { text: "Difficulties strengthen the mind, as labor does the body.", author: 'Seneca', year: 65 },
  { text: "It's not what happens to you, but how you react to it that matters.", author: 'Epictetus', year: 125 },
  { text: "First say to yourself what you would be; and then do what you have to do.", author: 'Epictetus', year: 125 },
  { text: "You do not rise to the level of your goals. You fall to the level of your systems.", author: 'James Clear', year: 2018 },
  { text: "We are what we repeatedly do. Excellence, then, is not an act, but a habit.", author: 'Will Durant', year: 1926 },
  { text: "The cave you fear to enter holds the treasure you seek.", author: 'Joseph Campbell', year: 1949 },
  { text: "Discipline equals freedom.", author: 'Jocko Willink', year: 2017 },
]

export function getQuoteOfDay(date = new Date()) {
  const iso = date.toISOString().slice(0, 10)
  let hash = 0
  for (let i = 0; i < iso.length; i++) {
    hash = ((hash << 5) - hash + iso.charCodeAt(i)) | 0
  }
  const idx = Math.abs(hash) % QUOTES.length
  return QUOTES[idx]
}
