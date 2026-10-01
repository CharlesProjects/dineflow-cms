import { useEffect, useState } from 'react'
import { useBusinessProfile } from '../context/useBusinessProfile'
import { fetchAuditRecords, type AuditRecord } from '../lib/cms-api'

export function AuditPage() {
  const { profile, loading: profileLoading, error: profileError } = useBusinessProfile()
  const [events, setEvents] = useState<AuditRecord[]>([])
  const [loadedBusinessId, setLoadedBusinessId] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState('')
  const isAdmin = profile?.role === 'ADMIN'
  const isLoading = profileLoading || Boolean(profile?.business_id && isAdmin && loadedBusinessId !== profile.business_id)

  useEffect(() => {
    if (!profile?.business_id || profile.role !== 'ADMIN') return

    let isActive = true
    fetchAuditRecords(profile.business_id)
      .then((data) => {
        if (!isActive) return
        setEvents(data)
        setErrorMessage('')
      })
      .catch((error: unknown) => {
        if (!isActive) return
        setErrorMessage(error instanceof Error ? error.message : 'Unable to load audit events.')
      })
      .finally(() => {
        if (isActive) setLoadedBusinessId(profile.business_id)
      })

    return () => {
      isActive = false
    }
  }, [profile?.business_id, profile?.role])

  return (
    <div className="space-y-6">
      <section>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#a84f35]">Security and changes</p>
        <h2 className="font-display mt-2 text-4xl">Audit log</h2>
        <p className="mt-2 text-sm text-[#74756c]">Recent events recorded for this restaurant. The view is limited to ADMIN accounts by RLS.</p>
      </section>

      {profileError && <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">{profileError}</p>}
      {errorMessage && <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">{errorMessage}</p>}
      {profile && !isAdmin && <p role="status" className="rounded-md border border-[#e7e4db] bg-[#fbfaf6] px-3 py-2.5 text-sm text-[#62635c]">Only a restaurant ADMIN can read audit events.</p>}

      {isLoading ? <p role="status" className="cms-panel p-6 text-sm text-[#74756c]">Loading audit events…</p> : isAdmin && events.length === 0 ? (
        <div className="cms-panel px-5 py-14 text-center">
          <h3 className="font-display text-2xl">No recorded events yet</h3>
          <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-[#74756c]">Successful CMS updates and team access changes will appear here after the audit Edge Functions are deployed.</p>
        </div>
      ) : isAdmin ? (
        <section aria-label="Recent audit events" className="cms-panel divide-y divide-[#e7e4db] px-5 sm:px-7">
          {events.map((event) => (
            <article key={event.id} className="py-4">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-sm bg-[#eeece3] px-2 py-1 text-xs font-semibold text-[#414438]">{event.action}</span>
                  <span className="text-sm font-medium">{event.entity_table ?? 'Record'}</span>
                  {event.entity_id && <span className="font-mono text-[11px] text-[#85857b]">{event.entity_id}</span>}
                </div>
                <time className="text-xs text-[#85857b]">{event.created_at}</time>
              </div>
              <p className="mt-2 break-all text-xs text-[#74756c]">Actor: {event.actor_user_id ?? 'System'}</p>
              {event.metadata && Object.keys(event.metadata).length > 0 && (
                <details className="mt-2 text-xs text-[#62635c]">
                  <summary className="w-fit cursor-pointer font-medium">Event details</summary>
                  <pre className="mt-2 overflow-x-auto rounded-md bg-[#f6f5f0] p-3 text-[11px] leading-5">{JSON.stringify(event.metadata, null, 2)}</pre>
                </details>
              )}
            </article>
          ))}
        </section>
      ) : null}
    </div>
  )
}
