import { useState } from 'react'
import { getHours, getMenuItems } from '../lib/cms-data'

export function OverviewPage() {
  const menuItems = getMenuItems()
  const schedule = getHours()
  const [menuCount] = useState(menuItems.length)
  const [openDays] = useState(schedule.filter((entry) => !entry.isClosed).length)

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          ['Published menu items', String(menuCount)],
          ['Open days', String(openDays)],
          ['Hours entries', '7'],
          ['Status', 'Healthy'],
        ].map(([label, value]) => (
          <div key={label} className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
            <p className="text-xs uppercase tracking-[0.2em] text-stone-500">{label}</p>
            <p className="mt-3 text-3xl font-semibold text-stone-900">{value}</p>
          </div>
        ))}
      </section>

      <section className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-stone-500">Overview</p>
            <h3 className="mt-2 text-2xl font-semibold text-stone-900">This week at a glance</h3>
          </div>
          <button type="button" className="rounded-full border border-stone-300 bg-stone-50 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-100">
            Export report
          </button>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <div className="rounded-2xl bg-stone-50 p-4">
            <p className="text-sm text-stone-600">Menu performance</p>
            <p className="mt-2 text-2xl font-semibold text-stone-900">82%</p>
            <p className="mt-1 text-sm text-emerald-600">Up from last week</p>
          </div>
          <div className="rounded-2xl bg-stone-50 p-4">
            <p className="text-sm text-stone-600">Reservation rate</p>
            <p className="mt-2 text-2xl font-semibold text-stone-900">67%</p>
            <p className="mt-1 text-sm text-amber-600">Strong weekend demand</p>
          </div>
          <div className="rounded-2xl bg-stone-50 p-4">
            <p className="text-sm text-stone-600">Content health</p>
            <p className="mt-2 text-2xl font-semibold text-stone-900">Good</p>
            <p className="mt-1 text-sm text-stone-600">No critical issues</p>
          </div>
        </div>
      </section>
    </div>
  )
}
