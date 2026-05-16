import { useSettingsStore } from '../store/useSettingsStore'
import { symbolFor, formatMoney } from './currency'

// Currency-aware money formatting bound to the user's setting.
//   sym                 -> active currency symbol
//   fmt(n, opts)        -> formatMoney(n, code, opts)
export function useMoney() {
  const code = useSettingsStore(s => s.currency)
  return {
    code,
    sym: symbolFor(code),
    fmt: (n, opts) => formatMoney(n, code, opts),
  }
}
