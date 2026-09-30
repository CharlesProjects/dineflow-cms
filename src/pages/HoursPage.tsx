import { useState } from 'react'
import { getHours, saveHours, type HoursEntry } from '../lib/cms-data'

export function HoursPage() {
  const [hours, setHours] = useState<HoursEntry[]>(() => getHours())
  const [status, setStatus] = useState('')

  const updateEntry = (day: string, field: 'openTime' | 'closeTime' | 'isClosed', value: string | boolean) => {
    const nextHours = hours.map((entry) => (entry.day === day ? { ...entry, [field]: value } : entry))
    setHours(nextHours)
  }

  const handleSave = () => {
    saveHours(hours)
    setStatus('Hours saved to local admin state.')
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-stone-500">Hours</p>
            <h3 className="mt-2 text-2xl font-semibold text-stone-900">Opening schedule</h3>
          </div>
          <button
            type="button"
            onClick={handleSave}
            className="rounded-full bg-stone-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-stone-700"
          >
            Save hours
          </button>
        </div>

        {status && <p className="mt-4 text-sm text-stone-600">{status}</p>}

        <div className="mt-6 space-y-3">
          {hours.map((entry) => (
            <div key={entry.day} className="flex flex-col gap-3 rounded-2xl border border-stone-200 bg-stone-50 p-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-3">
                <span className="w-24 text-sm font-semibold text-stone-900">{entry.day}</span>
                <label className="inline-flex items-center gap-2 text-sm text-stone-700">
                  <input
                    type="checkbox"
                    checked={entry.isClosed}
                    onChange={(event) => updateEntry(entry.day, 'isClosed', event.target.checked)}
                  />
                  Closed
                </label>
              </div>

              {!entry.isClosed && (
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <label className="text-sm text-stone-600">
                    Open
                    <input
                      type="time"
                      value={entry.openTime}
                      onChange={(event) => updateEntry(entry.day, 'openTime', event.target.value)}
                      className="ml-2 rounded-xl border border-stone-300 bg-white px-2 py-1.5 text-stone-900 outline-none focus:border-stone-500"
                    />
                  </label>
                  <label className="text-sm text-stone-600">
                    Close
                    <input
                      type="time"
                      value={entry.closeTime}
                      onChange={(event) => updateEntry(entry.day, 'closeTime', event.target.value)}
                      className="ml-2 rounded-xl border border-stone-300 bg-white px-2 py-1.5 text-stone-900 outline-none focus:border-stone-500"
                    />
                  </label>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
