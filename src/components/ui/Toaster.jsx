import { useToastStore } from '../../store/useToastStore'
import { IconCheck } from './Icons'

// Renders the toast queue at a fixed corner. Mounted once in AppShell.
export function Toaster() {
  const toasts = useToastStore(s => s.toasts)
  const dismiss = useToastStore(s => s.dismiss)
  if (toasts.length === 0) return null

  return (
    <div className="toaster" role="status" aria-live="polite">
      {toasts.map(t => (
        <div
          key={t.id}
          className={'toast' + (t.tone !== 'default' ? ' ' + t.tone : '') + (t.leaving ? ' leaving' : '')}
          onClick={() => dismiss(t.id)}
        >
          {t.tone === 'success' && (
            <span className="toast-i"><IconCheck size={12} /></span>
          )}
          <span className="toast-msg">{t.message}</span>
        </div>
      ))}
    </div>
  )
}
