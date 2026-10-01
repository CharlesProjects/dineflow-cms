import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useBusinessProfile } from '../context/useBusinessProfile'
import { fetchAdminMenuItems, fetchBusinessHourRecords } from '../lib/cms-api'

export function OverviewPage() {
  const { profile, loading: profileLoading, error: profileError } = useBusinessProfile()
  const [counts, setCounts] = useState({ menuItems: 0, hours: 0, openDays: 0 })
  const [loadedBusinessId, setLoadedBusinessId] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState('')
  const isLoading = profileLoading || Boolean(profile?.business_id && loadedBusinessId !== profile.business_id)

  useEffect(() => {
    if (!profile?.business_id) return

    let isActive = true
    Promise.all([fetchAdminMenuItems(profile.business_id), fetchBusinessHourRecords(profile.business_id)])
      .then(([items, hours]) => {
        if (!isActive) return
        setCounts({
          menuItems: items.length,
          hours: hours.length,
          openDays: hours.filter((entry) => !entry.is_closed).length,
        })
        setErrorMessage('')
      })
      .catch((error: unknown) => {
        if (isActive) setErrorMessage(error instanceof Error ? error.message : 'Unable to load the overview.')
      })
      .finally(() => {
        if (isActive) setLoadedBusinessId(profile.business_id)
      })

    return () => {
      isActive = false
    }
  }, [profile?.business_id])

  return (
    <div className="space-y-7">
      <section className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#a84f35]">Overview</p>
          <h2 className="font-display mt-2 text-4xl leading-tight sm:text-5xl">Your restaurant, at a glance.</h2>
          <p className="mt-2 text-sm text-[#74756c]">A quick view of this restaurant's published CMS data.</p>
        </div>
        <span className="inline-flex w-fit items-center gap-2 rounded-md border border-[#d9d7ce] bg-[#fbfaf6] px-3 py-2 text-xs font-medium text-[#62635c]"><span className="h-2 w-2 rounded-full bg-[#707653]" />Supabase data</span>
      </section>

      {(profileError || errorMessage) && <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">{errorMessage || profileError}</p>}

      <section aria-label="Content summary" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ['Menu items', isLoading ? '—' : String(counts.menuItems), 'Database records'],
          ['Service days', isLoading ? '—' : String(counts.openDays), 'Weekly schedule'],
          ['Hours entries', isLoading ? '—' : String(counts.hours), 'Database records'],
          ['Restaurant profile', profile?.business_id ? 'Linked' : '—', 'Authenticated tenant'],
        ].map(([label, value, detail]) => (
          <div key={label} className="cms-panel p-5">
            <p className="text-xs font-medium text-[#74756c]">{label}</p>
            <p className="mt-3 text-3xl font-semibold tracking-tight text-[#252720]">{value}</p>
            <p className="mt-1 text-xs text-[#99988e]">{detail}</p>
          </div>
        ))}
      </section>

      <section className="cms-panel p-5 sm:p-7">
        <div className="max-w-xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#a84f35]">Keep things current</p>
          <h3 className="font-display mt-2 text-3xl">Your next update</h3>
          <p className="mt-2 text-sm leading-6 text-[#74756c]">Review the menu, check your weekly schedule, or update the details guests see on your public site.</p>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {[
            { label: 'Review menu', to: '/dashboard/menu', description: `${counts.menuItems} menu items` },
            { label: 'Update hours', to: '/dashboard/hours', description: `${counts.openDays} days open` },
            { label: 'Edit profile', to: '/dashboard/settings', description: 'Contact and welcome copy' },
          ].map((action) => (
            <Link key={action.to} to={action.to} className="group rounded-md border border-[#e7e4db] bg-[#fbfaf6] p-4 transition hover:border-[#c98a73] hover:bg-white">
              <span className="flex items-center justify-between text-sm font-semibold">{action.label}<span aria-hidden="true" className="text-[#a84f35] transition group-hover:translate-x-0.5">↗</span></span>
              <span className="mt-1 block text-xs text-[#85857b]">{action.description}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
