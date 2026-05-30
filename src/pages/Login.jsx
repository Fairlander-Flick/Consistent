import { BrandPanel } from '../components/auth/BrandPanel'
import { AuthForm } from '../components/auth/AuthForm'
import { captureBrandRect } from '../lib/brandTransition'

// Measure the cream-panel logo just before React re-renders the app shell. The
// Sidebar's useEffect on mount will consume this rect and FLIP-animate its own
// logo from here to there.
function onAuthSuccess() {
  const node = document.querySelector('.login-root .brand-mark')
  if (node) {
    captureBrandRect(node.getBoundingClientRect())
  }
}

export function Login() {
  return (
    <div className="login-root">
      <BrandPanel />
      <div className="login-form-col">
        <AuthForm onAuthSuccess={onAuthSuccess} />
      </div>
    </div>
  )
}
