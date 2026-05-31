import { useToastStore } from '../../store/useToastStore'

// Bottom-center toasts. Click anywhere to dismiss. An optional action button
// (e.g. Undo) runs onAction then dismisses.
export function Toaster() {
  const toasts = useToastStore(s => s.toasts)
  const dismiss = useToastStore(s => s.dismiss)

  if (!toasts.length) return null

  return (
    <div style={{
      position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)',
      display: 'flex', flexDirection: 'column', gap: 8, zIndex: 1000,
    }}>
      {toasts.map(t => (
        <div
          key={t.id}
          onClick={() => dismiss(t.id)}
          style={{
            display: 'flex', alignItems: 'center', gap: 14,
            background: 'var(--text)', color: 'var(--bg)', padding: '10px 16px',
            borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(0,0,0,0.2)', maxWidth: 360,
          }}
        >
          <span>{t.message}</span>
          {t.actionLabel && (
            <button
              onClick={e => { e.stopPropagation(); t.onAction?.(); dismiss(t.id) }}
              style={{
                background: 'none', border: 'none', color: 'var(--bg)',
                font: 'inherit', fontWeight: 700, textDecoration: 'underline',
                cursor: 'pointer', padding: 0, flexShrink: 0,
              }}
            >
              {t.actionLabel}
            </button>
          )}
        </div>
      ))}
    </div>
  )
}
