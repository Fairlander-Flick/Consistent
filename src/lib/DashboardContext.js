import { createContext, useContext } from 'react'
import { todayISO } from './dateUtils'

export const DashboardContext = createContext({
  viewDate: todayISO(),
  setViewDate: () => {},
})

export const useDashboard = () => useContext(DashboardContext)
