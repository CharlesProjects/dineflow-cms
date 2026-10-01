import { useEffect, useState } from 'react'
import { useBusinessProfile } from '../context/useBusinessProfile'
import { fetchBusinessHourRecords, saveBusinessHourRecords, type BusinessHourRecord } from '../lib/cms-api'
import { tryRecordAuditEvent } from '../lib/audit'

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export function HoursPage() {
  const { profile, loading: profileLoading, error: profileError } = useBusinessProfile()
  const [hours, setHours] = useState<BusinessHourRecord[]>([])
  const [loadedBusinessId, setLoadedBusinessId] = useState<string | null>(null)
  const [status, setStatus] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const isLoading = profileLoading || Boolean(profile?.business_id && loadedBusinessId !== profile.business_id)
  const canEdit = profile?.role === 'ADMIN' || profile?.role === 'EDITOR'

  useEffect(() => {
    if (!profile?.business_id) return

    let isActive = true
    fetchBusinessHourRecords(profile.business_id)
      .then((data) => {
        if (!isActive) return
        setHours(data)
        setErrorMessage('')
      })
      .catch((error: unknown) => {
        if (!isActive) return
        setErrorMessage(error instanceof Error ? error.message : 'Unable to load opening hours.')
      })
      .finally(() => {
        if (isActive) setLoadedBusinessId(profile.business_id)
      })

    return () => {
      isActive = false
    }
  }, [profile?.business_id])

  const updateEntry = (dayOfWeek: number, field: keyof BusinessHourRecord, value: string | boolean | null) => {
    const nextHours = hours.map((entry) => (entry.day_of_week === dayOfWeek ? { ...entry, [field]: value } : entry))
    setHours(nextHours)
  }

  const initializeSchedule = () => {
    setHours(dayNames.map((_, day_of_week) => ({
      day_of_week,
      open_time: null,
      close_time: null,
      is_closed: true,
      is_published: false,
    })))
    setStatus('Set the open days and times, then save to create the weekly schedule.')
    setErrorMessage('')
  }

  const handleSave = async () => {
    if (!profile?.business_id || !canEdit) return

    if (hours.some((entry) => !entry.is_closed && (!entry.open_time || !entry.close_time || entry.open_time >= entry.close_time))) {
      setErrorMessage('For each open day, choose an opening time earlier than its closing time.')
      return
    }

    setErrorMessage('')
    setStatus('')
    setIsSaving(true)
    try {
      await saveBusinessHourRecords(profile.business_id, hours)
      const audited = await tryRecordAuditEvent({
        business_id: profile.business_id,
        action: 'update',
        entity_table: 'business_hours',
        metadata: { days_updated: hours.length },
      })
      setStatus(audited ? 'Opening hours saved and recorded.' : 'Opening hours saved. The audit function could not record this change.')
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to save opening hours.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <section className="cms-panel p-5 sm:p-7">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#a84f35]">Supabase schedule</p>
            <h2 className="font-display mt-2 text-3xl">Opening hours</h2>
          </div>
          {hours.length > 0 && <button type="button" onClick={handleSave} disabled={!canEdit || isSaving || isLoading} className="cms-button-primary disabled:cursor-not-allowed disabled:bg-stone-300">{isSaving ? 'Saving…' : 'Save hours'}</button>}
        </div>

        {profileError && <p role="alert" className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">{profileError}</p>}
        {errorMessage && <p role="alert" className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">{errorMessage}</p>}
        {status && <p role="status" className="mt-4 text-sm font-medium text-[#526044]">{status}</p>}
        {profile && !canEdit && <p role="status" className="mt-4 text-sm text-[#74756c]">Your VIEWER role allows you to review, but not change, the schedule.</p>}

        {isLoading && <p role="status" className="mt-6 text-sm text-[#74756c]">Loading schedule…</p>}
        {!isLoading && hours.length === 0 && (
          <div className="mt-6 rounded-md border border-dashed border-[#d9d7ce] px-5 py-10 text-center">
            <h3 className="font-display text-2xl">No hours have been added</h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#74756c]">Create a weekly schedule to start setting the days and hours guests can visit.</p>
            {canEdit && <button type="button" onClick={initializeSchedule} className="cms-button-primary mt-5">Create weekly schedule</button>}
          </div>
        )}

        {!isLoading && hours.length > 0 && <div className="mt-6 divide-y divide-[#e7e4db] border-y border-[#e7e4db]">
          {hours.map((entry) => (
            <div key={entry.day_of_week} className="grid gap-4 py-4 lg:grid-cols-[1fr_auto_auto] lg:items-center">
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                <span className="w-24 text-sm font-semibold text-[#252720]">{dayNames[entry.day_of_week]}</span>
                <label className="inline-flex min-h-10 items-center gap-2 text-sm text-[#53544d]">
                  <input type="checkbox" checked={entry.is_closed} disabled={!canEdit} onChange={(event) => updateEntry(entry.day_of_week, 'is_closed', event.target.checked)} />
                  Closed
                </label>
              </div>

              {!entry.is_closed ? (
                <div className="flex flex-wrap gap-3">
                  <label className="text-xs font-medium text-[#74756c]">Opens
                    <input type="time" value={entry.open_time ?? ''} disabled={!canEdit} onChange={(event) => updateEntry(entry.day_of_week, 'open_time', event.target.value)} className="cms-control mt-1 min-w-36" />
                  </label>
                  <label className="text-xs font-medium text-[#74756c]">Closes
                    <input type="time" value={entry.close_time ?? ''} disabled={!canEdit} onChange={(event) => updateEntry(entry.day_of_week, 'close_time', event.target.value)} className="cms-control mt-1 min-w-36" />
                  </label>
                </div>
              ) : <span className="text-sm text-[#85857b]">Closed</span>}

              <label className="inline-flex min-h-10 items-center gap-2 text-sm text-[#53544d]">
                <input type="checkbox" checked={entry.is_published} disabled={!canEdit} onChange={(event) => updateEntry(entry.day_of_week, 'is_published', event.target.checked)} />
                Show publicly
              </label>
            </div>
          ))}
        </div>}
      </section>
    </div>
  )
}
