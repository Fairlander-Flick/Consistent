import { GraphCard } from '../components/dashboard/GraphCard'
import { ThisWeekCard } from '../components/dashboard/ThisWeekCard'
import { JournalCard } from '../components/dashboard/JournalCard'
import { GoalsCard } from '../components/dashboard/GoalsCard'
import { ConsistencyCard } from '../components/dashboard/ConsistencyCard'

const FULL_DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
const FULL_MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

export function Dashboard() {
  const today = new Date()
  return (
    <>
      <div className="page-head">
        <div>
          <h1>Dashboard</h1>
          <div className="sub" style={{ marginTop: 4 }}>
            {FULL_DAYS[today.getDay()]} · {FULL_MONTHS[today.getMonth()]} {today.getDate()}, {today.getFullYear()}
          </div>
        </div>
      </div>

      <div className="bento">
        <GraphCard />
        <ThisWeekCard />
        <JournalCard />
        <GoalsCard />
        <ConsistencyCard />
      </div>
    </>
  )
}
