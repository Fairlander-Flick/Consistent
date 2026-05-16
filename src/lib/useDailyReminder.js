import { useEffect } from 'react'
import { useSettingsStore } from '../store/useSettingsStore'
import { useJournalStore } from '../store/useJournalStore'
import { scheduleDailyReminder } from './reminders'
import { todayISO } from './dateUtils'

// Arms the local daily journal reminder while the app is open. Re-arms
// whenever the enabled flag or time changes; tears down on unmount.
export function useDailyReminder() {
  const reminderEnabled = useSettingsStore(s => s.reminderEnabled)
  const reminderTime = useSettingsStore(s => s.reminderTime)

  useEffect(() => {
    if (!reminderEnabled) return
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return

    return scheduleDailyReminder({
      time: reminderTime,
      shouldNotify: () => {
        const entry = useJournalStore.getState().entries.find(e => e.date === todayISO())
        return !(entry && entry.submitted)
      },
      notify: () => {
        const n = new Notification('Consistent', {
          body: "You haven't logged today yet — take a minute for your journal.",
          tag: 'consistent-daily-journal',
        })
        n.onclick = () => { window.focus(); n.close() }
      },
    })
  }, [reminderEnabled, reminderTime])
}
