// Read-only / showcase mode. When signed in as a demo account the app must not
// mutate its data: local writes are skipped and nothing is pushed to the cloud,
// so the seeded row stays pristine no matter what happens in the UI.

let _readOnly = false

export function setReadOnly(v) { _readOnly = !!v }
export function isReadOnly() { return _readOnly }

// Usernames that run locked / read-only. Match is case-insensitive.
const DEMO_USERS = new Set(['demo'])

export function isDemoUser(username) {
  return !!username && DEMO_USERS.has(username.toLowerCase().trim())
}
