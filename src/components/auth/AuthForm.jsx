import { useState } from 'react'
import { useAuthStore } from '../../store/useAuthStore'

function IconEye() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  )
}

function IconEyeOff() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  )
}

export function AuthForm({ onAuthSuccess }) {
  const [mode, setMode] = useState('signin')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
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
          autoComplete="username"
          autoFocus
          required
        />
      </label>

      <label className="af-field">
        <span className="af-label">Password</span>
        <div className="af-pw-wrap">
          <input
            className="input"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={e => setPassword(e.target.value)}
            autoComplete={isSignup ? 'new-password' : 'current-password'}
            required
          />
          {password.length > 0 && (
            <button
              type="button"
              className="af-pw-toggle"
              onClick={() => setShowPassword(v => !v)}
              tabIndex={-1}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <IconEye /> : <IconEyeOff />}
            </button>
          )}
        </div>
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
