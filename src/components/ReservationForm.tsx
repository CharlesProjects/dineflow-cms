import { useEffect, useState, type FormEvent } from 'react'
import { submitReservationRequest } from '../lib/cms-api'
import { getPublicBusinessId } from '../lib/tenant'

function localDateString() {
  const date = new Date()
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset())
  return date.toISOString().slice(0, 10)
}

export function ReservationForm() {
  const [minimumDate, setMinimumDate] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [status, setStatus] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const isConfigured = Boolean(getPublicBusinessId())

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setMinimumDate(localDateString()))
    return () => window.cancelAnimationFrame(frame)
  }, [])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setStatus('')
    setErrorMessage('')
    const form = event.currentTarget
    const formData = new FormData(form)
    const partySize = Number(formData.get('party_size'))

    if (!Number.isInteger(partySize) || partySize < 1 || partySize > 20) {
      setErrorMessage('Party size must be between 1 and 20 guests.')
      return
    }

    setIsSubmitting(true)
    try {
      await submitReservationRequest({
        name: String(formData.get('name') ?? ''),
        email: String(formData.get('email') ?? ''),
        phone: String(formData.get('phone') ?? ''),
        requested_date: String(formData.get('requested_date') ?? ''),
        requested_time: String(formData.get('requested_time') ?? ''),
        party_size: partySize,
        message: String(formData.get('message') ?? ''),
        honeypot: String(formData.get('website-confirmation') ?? ''),
      })
      form.reset()
      setStatus('Your request has been received. The restaurant will review it and contact you to confirm.')
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to submit your request. Please call the restaurant.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section id="reservations" className="scroll-mt-20 px-5 py-16 sm:px-8 lg:px-12 lg:py-20">
      <div className="mx-auto grid max-w-[1100px] gap-8 lg:grid-cols-[0.75fr_1.25fr] lg:gap-14">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#a84f35]">A place at our table</p>
          <h2 className="font-display mt-3 text-4xl sm:text-5xl">Request a reservation.</h2>
          <p className="mt-5 max-w-sm text-sm leading-6 text-[#74756c]">Send us your preferred date and party size. Your request is pending until our team confirms it.</p>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2" aria-busy={isSubmitting}>
          <div aria-hidden="true" className="absolute -left-[10000px] top-auto h-px w-px overflow-hidden">
            <label>Leave this field empty<input name="website-confirmation" tabIndex={-1} autoComplete="off" /></label>
          </div>
          <label className="text-sm font-medium text-[#53544d]">Your name
            <input name="name" type="text" autoComplete="name" required maxLength={120} className="cms-control mt-1.5" disabled={!isConfigured || isSubmitting} />
          </label>
          <label className="text-sm font-medium text-[#53544d]">Email
            <input name="email" type="email" autoComplete="email" required maxLength={254} className="cms-control mt-1.5" disabled={!isConfigured || isSubmitting} />
          </label>
          <label className="text-sm font-medium text-[#53544d]">Phone <span className="font-normal text-[#85857b]">(optional)</span>
            <input name="phone" type="tel" autoComplete="tel" maxLength={40} className="cms-control mt-1.5" disabled={!isConfigured || isSubmitting} />
          </label>
          <label className="text-sm font-medium text-[#53544d]">Party size
            <input name="party_size" type="number" min="1" max="20" step="1" defaultValue="2" required className="cms-control mt-1.5" disabled={!isConfigured || isSubmitting} />
          </label>
          <label className="text-sm font-medium text-[#53544d]">Preferred date
            <input name="requested_date" type="date" min={minimumDate || undefined} required className="cms-control mt-1.5" disabled={!isConfigured || isSubmitting} />
          </label>
          <label className="text-sm font-medium text-[#53544d]">Preferred time <span className="font-normal text-[#85857b]">(optional)</span>
            <input name="requested_time" type="time" className="cms-control mt-1.5" disabled={!isConfigured || isSubmitting} />
          </label>
          <label className="text-sm font-medium text-[#53544d] sm:col-span-2">Anything else? <span className="font-normal text-[#85857b]">(10–1000 characters)</span>
            <textarea name="message" minLength={10} maxLength={1000} required rows={3} className="cms-control mt-1.5" disabled={!isConfigured || isSubmitting} />
          </label>

          {!isConfigured && <p role="status" className="text-sm text-[#74756c] sm:col-span-2">Online requests are not configured for a public restaurant ID. Please call the restaurant.</p>}
          {errorMessage && <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700 sm:col-span-2">{errorMessage}</p>}
          {status && <p role="status" className="rounded-md border border-[#d8e0cd] bg-[#f1f4ec] px-3 py-2.5 text-sm text-[#526044] sm:col-span-2">{status}</p>}

          <div className="sm:col-span-2">
            <button type="submit" disabled={!isConfigured || isSubmitting} className="cms-button-primary disabled:cursor-not-allowed disabled:border-stone-300 disabled:bg-stone-300">
              {isSubmitting ? 'Sending request…' : 'Send reservation request'}
            </button>
          </div>
        </form>
      </div>
    </section>
  )
}
