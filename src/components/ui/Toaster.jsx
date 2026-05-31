import { useToastStore } from '../../store/useToastStore'
import { IconCheck } from './Icons'

// Bottom-corner toasts. They slide+fade in on mount and play the exit
// animation (via the store's two-phase `leaving` flag) before unmounting.
// Click or press a toast to dismiss; an optional action button (e.g. Undo)
// runs onAction then dismisses.
export function Toaster() {
  const toasts = useToastStore(s => s.toasts)
  const dismiss = useToastStore(s => s.dismiss)

  if (!toasts.length) return null

  return (
    <div className="toaster">
      {toasts.map(t => (
        <div
          key={t.id}
          className={'toast' + (t.leaving ? ' leaving' : '') + (t.tone ? ' tone-' + t.tone : '')}
          role="button"
          tabIndex={0}
          aria-label="Dismiss notification"
          onClick={() => dismiss(t.id)}
          onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') dismiss(t.id) }}
        >
          {t.tone === 'success' && (
            <span className="toast-i"><IconCheck size={12} /></span>
          )}
          <span className="toast-msg">{t.message}</span>
          {t.actionLabel && (
            <button
              type="button"
              className="toast-action"
              onClick={e => { e.stopPropagation(); t.onAction?.(); dismiss(t.id) }}
            >
              {t.actionLabel}
            </button>
          )}
        </div>
      ))}
    </div>
  )
}
