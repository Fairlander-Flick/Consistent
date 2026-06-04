import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import { pullAll, pushAll, setupAutoSync, teardownAutoSync } from '../lib/cloudSync'
import { setReadOnly, isDemoUser } from '../lib/demoMode'

const USERNAME_DOMAIN = 'consistent.local'
const toEmail = (username) => `${username.toLowerCase().trim()}@${USERNAME_DOMAIN}`
const fromEmail = (email) => (email || '').split('@')[0]

function friendlyError(message) {
  if (!message) return 'Something went wrong.'
  const m = message.toLowerCase()
  if (m.includes('invalid login credentials')) return 'Wrong username or password.'
  if (m.includes('user already registered')) return 'That username is taken.'
  if (m.includes('password should be')) return 'Password must be at least 8 characters.'
  if (m.includes('rate limit')) return 'Too many attempts. Wait a minute.'
  return message
}

export const useAuthStore = create((set, get) => ({
  user: null,
  status: 'loading',
  error: null,
  busy: false,

  init: async () => {
    const { data } = await supabase.auth.getSession()
    if (data.session) {
      const userId   = data.session.user.id
      const username = fromEmail(data.session.user.email)
      setReadOnly(isDemoUser(username))
      const hasLocalData = localStorage.getItem('consistent:weight') !== null

      if (!hasLocalData) {
        const hadData = await pullAll(userId)
        if (hadData) {
          window.location.reload()
          return
        }
      }

      set({ user: { id: userId, username }, status: 'authed' })
      setupAutoSync(userId)
    } else {
      set({ status: 'guest' })
    }

    supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        const userId   = session.user.id
        const username = fromEmail(session.user.email)
        setReadOnly(isDemoUser(username))
        set({ user: { id: userId, username }, status: 'authed', error: null })
        setupAutoSync(userId)
      } else if (get().status !== 'loading') {
        teardownAutoSync()
        set({ user: null, status: 'guest' })
      }
    })
  },

  signUp: async (username, password) => {
    set({ error: null })
    if (!/^[a-zA-Z0-9_]{3,32}$/.test(username)) {
      set({ error: 'Username: 3–32 characters, letters/numbers/underscore only.' })
      return false
    }
    if (password.length < 8) {
      set({ error: 'Password must be at least 8 characters.' })
      return false
    }
    set({ busy: true })
    const { error } = await supabase.auth.signUp({
      email: toEmail(username),
      password,
    })
    set({ busy: false })
    if (error) {
      set({ error: friendlyError(error.message) })
      return false
    }
    return true
  },

  signIn: async (username, password) => {
    set({ error: null, busy: true })
    const { error } = await supabase.auth.signInWithPassword({
      email: toEmail(username),
      password,
    })
    set({ busy: false })
    if (error) {
      set({ error: friendlyError(error.message) })
      return false
    }

    const { data: sessionData } = await supabase.auth.getSession()
    if (sessionData.session) {
      const hadCloudData = await pullAll(sessionData.session.user.id)
      if (hadCloudData) {
        window.location.reload()
        return true
      }
      setupAutoSync(sessionData.session.user.id)
    }
    return true
  },

  signOut: async () => {
    const { user } = get()
    if (user?.id) await pushAll(user.id)
    teardownAutoSync()
    await supabase.auth.signOut()
    window.location.reload()
  },

  clearError: () => set({ error: null }),
}))
