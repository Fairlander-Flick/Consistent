import { useState } from 'react'
import { useAuthStore } from '../../store/useAuthStore'

export function AuthForm({ onAuthSuccess }) {
  const [mode, setMode] = useState('signin')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const { signIn, signUp, error, busy, clearError } = useAuthStore()

  async function onSubmit(e) {
    e.preventDefault()
    let ok = false
    if (mode === 'signin') {
      ok = await signIn(username, password)
    } else {
      const created = await signUp(username, password)
      if (created) ok = await signIn(username, password)
    }
    if (ok) onAuthSuccess?.()
  }

  function switchMode(next) {
    setMode(next)
    clearError()
  }

  const isSignup = mode === 'signup'

  return (
    <form className="af" onSubmit={onSubmit}>
      <h1 className="af-title">{isSignup ? 'Create Account' : 'Sign In'}</h1>

      <label className="af-field">
        <span className="af-label">Username</span>
        <input
          className="input"
          value={username}
          onChange={e => setUsername(e.target.value)}
          placeholder="your_handle"
          autoComplete="username"
          autoFocus
          required
        />
      </label>

      <label className="af-field">
        <span className="af-label">Password</span>
        <input
          className="input"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder={isSignup ? '8+ characters' : '••••••••'}
          autoComplete={isSignup ? 'new-password' : 'current-password'}
          required
        />
      </label>

      {error && <div className="af-error">{error}</div>}

      <button type="submit" className="af-submit" disabled={busy}>
        {busy ? '…' : (isSignup ? 'Create Account' : 'Sign In')}
      </button>

      <div className="af-toggle">
        {isSignup ? 'Have an account?' : 'No account?'}{' '}
        <button
          type="button"
          className="af-toggle-link"
          onClick={() => switchMode(isSignup ? 'signin' : 'signup')}
        >
          {isSignup ? 'Sign In' : 'Sign Up'}
        </button>
      </div>

      <p className="af-hint">Save your password — there's no recovery.</p>
    </form>
  )
}
