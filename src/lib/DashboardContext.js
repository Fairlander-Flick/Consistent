import { createContext, use } from 'react'
import { todayISO } from './dateUtils'

export const DashboardContext = createContext({
  viewDate: todayISO(),
  setViewDate: () => {},
})

export const useDashboard = () => use(DashboardContext)
