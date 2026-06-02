import { useEffect } from 'react'
import { useSettingsStore } from '../store/useSettingsStore'
import { useLifelongStore } from '../store/useLifelongStore'
import { useScheduleDoneStore } from '../store/useScheduleDoneStore'
import { useDayPlanStore } from '../store/useDayPlanStore'
import { lifelongTodosForDate } from './lifelongTodos'
import { scheduleDailyReminder } from './reminders'
import { todayISO } from './dateUtils'

// Arms the local daily reminder while the app is open. Nudges only if today
// still has unfinished planned work. Re-arms on enabled/time change.
export function useDailyReminder() {
  const reminderEnabled = useSettingsStore(s => s.reminderEnabled)
  const reminderTime = useSettingsStore(s => s.reminderTime)

  useEffect(() => {
    if (!reminderEnabled) return
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return

    return scheduleDailyReminder({
      time: reminderTime,
      shouldNotify: () => {
        const today = todayISO()
        const nodes = useLifelongStore.getState().nodes
        const doneMap = useScheduleDoneStore.getState().done[today] || {}
        const pendingScheduled = lifelongTodosForDate(today, nodes).some(it => !doneMap[it.key])
        const todos = useDayPlanStore.getState().byDate[today]?.todos || []
        const pendingOneoff = todos.some(t => !t.done)
        return pendingScheduled || pendingOneoff
      },
      notify: () => {
        const n = new Notification('Consistent', {
          body: 'You still have tasks planned for today.',
          tag: 'consistent-daily-reminder',
        })
        n.onclick = () => { window.focus(); n.close() }
      },
    })
  }, [reminderEnabled, reminderTime])
}
