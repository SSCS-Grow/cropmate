import Filters from './components/Filters'
import TimeseriesChart from './components/TimeseriesChart'
import TopList from './components/TopList'
import KPI from './components/KPI'
import ExportMenu from './components/ExportMenu' // <— NY

export default function AnalyticsPage() {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Observation Analytics</h1>

      <div className="flex items-end justify-between gap-4 flex-wrap">
        <Filters />
        <ExportMenu /> {/* <— NY */}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <KPI label="Total (periode)" id="kpi-total" field="total" />
        <KPI label="Unikke typer" id="kpi-types" field="unique_types" />
        <KPI label="Unikke afgrøder" id="kpi-crops" field="unique_crops" />
        <KPI label="Seneste 24 timer" id="kpi-last24" field="last24h" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <TimeseriesChart />
        </div>
        <div className="lg:col-span-1 space-y-6">
          <TopList title="Top typer" dim="type" />
        </div>
      </div>
    </div>
  )
}
