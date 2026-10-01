import { useEffect, useState } from 'react'
import { useBusinessProfile } from '../context/useBusinessProfile'
import { fetchReservationRecords, updateReservationStatus, type ReservationRecord } from '../lib/cms-api'
import { tryRecordAuditEvent } from '../lib/audit'

const statuses: ReservationRecord['status'][] = ['pending', 'confirmed', 'declined', 'cancelled']

export function ReservationsPage() {
  const { profile, loading: profileLoading, error: profileError } = useBusinessProfile()
  const [reservations, setReservations] = useState<ReservationRecord[]>([])
  const [loadedBusinessId, setLoadedBusinessId] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [statusMessage, setStatusMessage] = useState('')
  const [savingId, setSavingId] = useState<string | null>(null)
  const canManage = profile?.role === 'ADMIN' || profile?.role === 'EDITOR'
  const isLoading = profileLoading || Boolean(profile?.business_id && loadedBusinessId !== profile.business_id)

  useEffect(() => {
    if (!profile?.business_id) return

    let isActive = true
    fetchReservationRecords(profile.business_id)
      .then((data) => {
        if (!isActive) return
        setReservations(data)
        setErrorMessage('')
      })
      .catch((error: unknown) => {
        if (!isActive) return
        setErrorMessage(error instanceof Error ? error.message : 'Unable to load reservation requests.')
      })
      .finally(() => {
        if (isActive) setLoadedBusinessId(profile.business_id)
      })

    return () => {
      isActive = false
    }
  }, [profile?.business_id])

  const handleStatusChange = async (reservation: ReservationRecord, status: ReservationRecord['status']) => {
    if (!profile?.business_id || !canManage || status === reservation.status) return

    setSavingId(reservation.id)
    setErrorMessage('')
    setStatusMessage('')
    try {
      await updateReservationStatus(profile.business_id, reservation.id, status)
      setReservations((current) => current.map((item) => item.id === reservation.id ? { ...item, status } : item))
      const audited = await tryRecordAuditEvent({
        business_id: profile.business_id,
        action: 'reservation_status',
        entity_table: 'reservation_requests',
        entity_id: reservation.id,
        metadata: { previous_status: reservation.status, status },
      })
      setStatusMessage(audited ? 'Reservation status updated and recorded.' : 'Reservation status updated. The audit function could not record this change.')
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to update reservation status.')
    } finally {
      setSavingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#a84f35]">Guest requests</p>
          <h2 className="font-display mt-2 text-4xl">Reservations</h2>
          <p className="mt-2 text-sm text-[#74756c]">Requests remain pending until your team confirms them.</p>
        </div>
        <span className="inline-flex w-fit items-center gap-2 rounded-md border border-[#d9d7ce] bg-[#fbfaf6] px-3 py-2 text-xs font-medium text-[#62635c]">{reservations.length} requests</span>
      </section>

      {profileError && <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">{profileError}</p>}
      {errorMessage && <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">{errorMessage}</p>}
      {statusMessage && <p role="status" className="text-sm font-medium text-[#526044]">{statusMessage}</p>}
      {profile && !canManage && <p role="status" className="rounded-md border border-[#e7e4db] bg-[#fbfaf6] px-3 py-2.5 text-sm text-[#62635c]">Your VIEWER role can review reservation details but cannot change their status.</p>}

      {isLoading ? (
        <p role="status" className="cms-panel p-6 text-sm text-[#74756c]">Loading reservation requests…</p>
      ) : reservations.length === 0 ? (
        <div className="cms-panel px-5 py-14 text-center">
          <h3 className="font-display text-2xl">No reservation requests yet</h3>
          <p className="mt-2 text-sm text-[#74756c]">New guest requests submitted on the public website will appear here.</p>
        </div>
      ) : (
        <section aria-label="Reservation requests" className="space-y-3">
          {reservations.map((reservation) => (
            <article key={reservation.id} className="cms-panel p-4 sm:p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <h3 className="text-lg font-semibold">{reservation.name}</h3>
                    <span className={`rounded-sm px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ${reservation.status === 'confirmed' ? 'bg-[#e8ecdf] text-[#526044]' : reservation.status === 'pending' ? 'bg-[#f5ead6] text-[#785e31]' : 'bg-[#ebe9e1] text-[#65665e]'}`}>{reservation.status}</span>
                  </div>
                  <p className="mt-1 break-all text-sm text-[#813a28]">{reservation.email}{reservation.phone && <span className="text-[#74756c]"> · {reservation.phone}</span>}</p>
                  <p className="mt-3 text-sm font-medium">{reservation.requested_date}{reservation.requested_time && ` · ${reservation.requested_time.slice(0, 5)}`} · {reservation.party_size} {reservation.party_size === 1 ? 'guest' : 'guests'}</p>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#62635c]">{reservation.message}</p>
                  {reservation.notes && <p className="mt-2 text-xs text-[#85857b]">Staff notes: {reservation.notes}</p>}
                </div>
                <label className="shrink-0 text-xs font-semibold text-[#62635c]">Request status
                  <select value={reservation.status} disabled={!canManage || savingId === reservation.id} onChange={(event) => void handleStatusChange(reservation, event.target.value as ReservationRecord['status'])} className="cms-control mt-1.5 min-w-40">
                    {statuses.map((status) => <option key={status} value={status}>{status[0].toUpperCase() + status.slice(1)}</option>)}
                  </select>
                </label>
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  )
}
