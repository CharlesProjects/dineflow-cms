import { useState } from 'react'
import { getBusinessSettings, saveBusinessSettings, type BusinessSettings } from '../lib/cms-data'

const emptySettings: BusinessSettings = {
  businessName: '',
  tagline: '',
  phone: '',
  email: '',
  address: '',
  heroTitle: '',
  heroDescription: '',
}

export function SettingsPage() {
  const [settings, setSettings] = useState<BusinessSettings>(() => getBusinessSettings() ?? emptySettings)
  const [status, setStatus] = useState('')

  const handleChange = (field: keyof BusinessSettings, value: string) => {
    setSettings((current) => ({
      ...current,
      [field]: value,
    }))
  }

  const handleSave = () => {
    saveBusinessSettings(settings)
    setStatus('Business settings saved to local CMS storage.')
  }

  return (
    <div className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm">
      <p className="text-xs uppercase tracking-[0.2em] text-stone-500">Settings</p>
      <h3 className="mt-2 text-2xl font-semibold text-stone-900">Business settings</h3>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <label className="block text-sm font-medium text-stone-700">
          Business name
          <input
            value={settings.businessName}
            onChange={(event) => handleChange('businessName', event.target.value)}
            className="mt-1 w-full rounded-2xl border border-stone-300 bg-stone-50 px-3 py-2.5 text-stone-900 outline-none transition focus:border-stone-500"
          />
        </label>

        <label className="block text-sm font-medium text-stone-700">
          Tagline
          <input
            value={settings.tagline}
            onChange={(event) => handleChange('tagline', event.target.value)}
            className="mt-1 w-full rounded-2xl border border-stone-300 bg-stone-50 px-3 py-2.5 text-stone-900 outline-none transition focus:border-stone-500"
          />
        </label>

        <label className="block text-sm font-medium text-stone-700">
          Phone
          <input
            value={settings.phone}
            onChange={(event) => handleChange('phone', event.target.value)}
            className="mt-1 w-full rounded-2xl border border-stone-300 bg-stone-50 px-3 py-2.5 text-stone-900 outline-none transition focus:border-stone-500"
          />
        </label>

        <label className="block text-sm font-medium text-stone-700">
          Email
          <input
            value={settings.email}
            onChange={(event) => handleChange('email', event.target.value)}
            className="mt-1 w-full rounded-2xl border border-stone-300 bg-stone-50 px-3 py-2.5 text-stone-900 outline-none transition focus:border-stone-500"
          />
        </label>

        <label className="block text-sm font-medium text-stone-700 md:col-span-2">
          Address
          <input
            value={settings.address}
            onChange={(event) => handleChange('address', event.target.value)}
            className="mt-1 w-full rounded-2xl border border-stone-300 bg-stone-50 px-3 py-2.5 text-stone-900 outline-none transition focus:border-stone-500"
          />
        </label>

        <label className="block text-sm font-medium text-stone-700 md:col-span-2">
          Hero title
          <input
            value={settings.heroTitle}
            onChange={(event) => handleChange('heroTitle', event.target.value)}
            className="mt-1 w-full rounded-2xl border border-stone-300 bg-stone-50 px-3 py-2.5 text-stone-900 outline-none transition focus:border-stone-500"
          />
        </label>

        <label className="block text-sm font-medium text-stone-700 md:col-span-2">
          Hero description
          <textarea
            rows={4}
            value={settings.heroDescription}
            onChange={(event) => handleChange('heroDescription', event.target.value)}
            className="mt-1 w-full rounded-2xl border border-stone-300 bg-stone-50 px-3 py-2.5 text-stone-900 outline-none transition focus:border-stone-500"
          />
        </label>
      </div>

      <div className="mt-6 flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          className="rounded-full bg-stone-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-stone-700"
        >
          Save settings
        </button>
        {status && <span className="text-sm text-stone-600">{status}</span>}
      </div>
    </div>
  )
}
