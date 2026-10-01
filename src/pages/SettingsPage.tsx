import { useEffect, useState } from 'react'
import { useBusinessProfile } from '../context/useBusinessProfile'
import { fetchBusinessSettingsRecord, saveBusinessSettingsRecord, type BusinessSettingsRecord } from '../lib/cms-api'
import { tryRecordAuditEvent } from '../lib/audit'

const emptySettings: BusinessSettingsRecord = {
  business_name: '',
  tagline: '',
  description: '',
  phone: '',
  email: '',
  address: '',
  map_url: '',
  website_url: '',
  social_links: {},
  hero_title: '',
  hero_description: '',
  is_published: false,
}

export function SettingsPage() {
  const { profile, loading: profileLoading, error: profileError } = useBusinessProfile()
  const [settings, setSettings] = useState<BusinessSettingsRecord>(emptySettings)
  const [loadedBusinessId, setLoadedBusinessId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [status, setStatus] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    if (!profile?.business_id) return

    let isActive = true
    fetchBusinessSettingsRecord(profile.business_id)
      .then((data) => {
        if (!isActive) return
        setSettings(data ?? emptySettings)
        setErrorMessage('')
      })
      .catch((error: unknown) => {
        if (!isActive) return
        setErrorMessage(error instanceof Error ? error.message : 'Unable to load business settings.')
      })
      .finally(() => {
        if (isActive) setLoadedBusinessId(profile.business_id)
      })

    return () => {
      isActive = false
    }
  }, [profile?.business_id])

  const isLoading = profileLoading || Boolean(profile?.business_id && loadedBusinessId !== profile.business_id)

  const handleChange = (field: keyof BusinessSettingsRecord, value: string | boolean) => {
    setSettings((current) => ({
      ...current,
      [field]: value,
    }))
  }

  const handleSave = async () => {
    if (!profile?.business_id || !settings.business_name.trim()) {
      setErrorMessage('Business name is required.')
      return
    }

    setErrorMessage('')
    setStatus('')
    setIsSaving(true)
    try {
      const saved = await saveBusinessSettingsRecord(profile.business_id, {
        ...settings,
        business_name: settings.business_name.trim(),
      })
      setSettings(saved)
      const audited = await tryRecordAuditEvent({
        business_id: profile.business_id,
        action: 'update',
        entity_table: 'business_settings',
        metadata: { fields_updated: Object.keys(settings).length },
      })
      setStatus(audited ? 'Business settings saved and recorded.' : 'Business settings saved. The audit function could not record this change.')
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to save business settings.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="cms-panel p-5 sm:p-7">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#a84f35]">Restaurant profile</p>
      <h2 className="font-display mt-2 text-3xl">Business settings</h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-[#74756c]">These details are stored in your restaurant's Supabase business profile.</p>

      {(profileLoading || isLoading) && <p role="status" className="mt-5 text-sm text-[#74756c]">Loading business settings…</p>}
      {(profileError || errorMessage) && <p role="alert" className="mt-5 rounded-md border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">{errorMessage || profileError}</p>}
      {profile && profile.role !== 'ADMIN' && <p role="status" className="mt-5 rounded-md border border-[#e7e4db] bg-[#f6f5f0] px-3 py-2.5 text-sm text-[#62635c]">Only an ADMIN can change these settings.</p>}

      <div className="mt-6 grid gap-4 md:grid-cols-2" aria-busy={profileLoading || isLoading}>
        <label className="block text-sm font-medium text-stone-700">
          Business name
          <input
            required
            value={settings.business_name}
            onChange={(event) => handleChange('business_name', event.target.value)}
            className="cms-control mt-1.5"
            disabled={profile?.role !== 'ADMIN' || isLoading}
          />
        </label>

        <label className="block text-sm font-medium text-stone-700">
          Tagline
          <input
            value={settings.tagline ?? ''}
            onChange={(event) => handleChange('tagline', event.target.value)}
            className="cms-control mt-1.5"
            disabled={profile?.role !== 'ADMIN' || isLoading}
          />
        </label>

        <label className="block text-sm font-medium text-stone-700">
          Phone
          <input
            value={settings.phone ?? ''}
            onChange={(event) => handleChange('phone', event.target.value)}
            className="cms-control mt-1.5"
            disabled={profile?.role !== 'ADMIN' || isLoading}
          />
        </label>

        <label className="block text-sm font-medium text-stone-700">
          Email
          <input
            value={settings.email ?? ''}
            onChange={(event) => handleChange('email', event.target.value)}
            className="cms-control mt-1.5"
            disabled={profile?.role !== 'ADMIN' || isLoading}
          />
        </label>

        <label className="block text-sm font-medium text-stone-700 md:col-span-2">
          Address
          <input
            value={settings.address ?? ''}
            onChange={(event) => handleChange('address', event.target.value)}
            className="cms-control mt-1.5"
            disabled={profile?.role !== 'ADMIN' || isLoading}
          />
        </label>

        <label className="block text-sm font-medium text-stone-700 md:col-span-2">
          About the restaurant
          <textarea
            rows={3}
            value={settings.description ?? ''}
            onChange={(event) => handleChange('description', event.target.value)}
            className="cms-control mt-1.5"
            disabled={profile?.role !== 'ADMIN' || isLoading}
          />
        </label>

        <label className="block text-sm font-medium text-stone-700 md:col-span-2">
          Hero title
          <input
            value={settings.hero_title ?? ''}
            onChange={(event) => handleChange('hero_title', event.target.value)}
            className="cms-control mt-1.5"
            disabled={profile?.role !== 'ADMIN' || isLoading}
          />
        </label>

        <label className="block text-sm font-medium text-stone-700 md:col-span-2">
          Hero description
          <textarea
            rows={4}
            value={settings.hero_description ?? ''}
            onChange={(event) => handleChange('hero_description', event.target.value)}
            className="cms-control mt-1.5"
            disabled={profile?.role !== 'ADMIN' || isLoading}
          />
        </label>

        <label className="flex min-h-12 items-center gap-3 rounded-md border border-[#e7e4db] bg-[#fbfaf6] px-3 py-3 text-sm font-medium text-[#53544d] md:col-span-2">
          <input
            type="checkbox"
            checked={settings.is_published}
            onChange={(event) => handleChange('is_published', event.target.checked)}
            disabled={profile?.role !== 'ADMIN' || isLoading}
          />
          Publish this business profile on the public website
        </label>
      </div>

      <div className="mt-6 flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving || isLoading || profileLoading || profile?.role !== 'ADMIN'}
          className="cms-button-primary"
        >
          {isSaving ? 'Saving…' : 'Save settings'}
        </button>
        {status && <span role="status" className="text-sm font-medium text-[#526044]">{status}</span>}
      </div>
    </div>
  )
}
