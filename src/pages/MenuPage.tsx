import { useState } from 'react'
import { createMenuItem, getMenuItems, saveMenuItems, type MenuItem } from '../lib/cms-data'

export function MenuPage() {
  const [items, setItems] = useState<MenuItem[]>(() => getMenuItems())
  const [draft, setDraft] = useState<MenuItem>(() => createMenuItem())
  const [status, setStatus] = useState('')

  const handleChange = (field: keyof MenuItem, value: string | boolean | number) => {
    setDraft((current) => ({
      ...current,
      [field]: value,
    }))
  }

  const handleSave = () => {
    const nextItems = [...items, { ...draft, id: draft.id || createMenuItem().id }]
    setItems(nextItems)
    saveMenuItems(nextItems)
    setDraft(createMenuItem())
    setStatus('Menu saved to the local CMS state.')
  }

  const handleRemove = (itemId: string) => {
    const nextItems = items.filter((item) => item.id !== itemId)
    setItems(nextItems)
    saveMenuItems(nextItems)
    setStatus('Menu item removed.')
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm">
        <p className="text-xs uppercase tracking-[0.2em] text-stone-500">Menu</p>
        <h3 className="mt-2 text-2xl font-semibold text-stone-900">Dish management</h3>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <label className="block text-sm font-medium text-stone-700">
            Dish name
            <input
              value={draft.name}
              onChange={(event) => handleChange('name', event.target.value)}
              className="mt-1 w-full rounded-2xl border border-stone-300 bg-stone-50 px-3 py-2.5 text-stone-900 outline-none ring-0 transition focus:border-stone-500"
            />
          </label>

          <label className="block text-sm font-medium text-stone-700">
            Price
            <input
              type="number"
              min="0"
              value={draft.price}
              onChange={(event) => handleChange('price', Number(event.target.value))}
              className="mt-1 w-full rounded-2xl border border-stone-300 bg-stone-50 px-3 py-2.5 text-stone-900 outline-none ring-0 transition focus:border-stone-500"
            />
          </label>

          <label className="block text-sm font-medium text-stone-700 md:col-span-2">
            Description
            <textarea
              rows={4}
              value={draft.description}
              onChange={(event) => handleChange('description', event.target.value)}
              className="mt-1 w-full rounded-2xl border border-stone-300 bg-stone-50 px-3 py-2.5 text-stone-900 outline-none ring-0 transition focus:border-stone-500"
            />
          </label>

          <label className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-stone-50 px-3 py-3 text-sm font-medium text-stone-700">
            <input
              type="checkbox"
              checked={draft.isFeatured}
              onChange={(event) => handleChange('isFeatured', event.target.checked)}
            />
            Feature this item on the homepage
          </label>

          <label className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-stone-50 px-3 py-3 text-sm font-medium text-stone-700">
            <input
              type="checkbox"
              checked={draft.isAvailable}
              onChange={(event) => handleChange('isAvailable', event.target.checked)}
            />
            Available for ordering
          </label>
        </div>

        <div className="mt-6 flex items-center gap-3">
          <button
            type="button"
            onClick={handleSave}
            className="rounded-full bg-stone-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-stone-700"
          >
            Save dish
          </button>
          {status && <span className="text-sm text-stone-600">{status}</span>}
        </div>
      </section>

      <section className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm">
        <p className="text-xs uppercase tracking-[0.2em] text-stone-500">Current menu</p>
        <div className="mt-6 space-y-3">
          {items.length === 0 ? (
            <p className="text-sm text-stone-500">No menu items added yet.</p>
          ) : (
            items.map((item) => (
              <div key={item.id} className="flex flex-col gap-3 rounded-2xl border border-stone-200 bg-stone-50 p-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-lg font-semibold text-stone-900">{item.name}</p>
                    {item.isFeatured && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-700">Featured</span>}
                  </div>
                  <p className="mt-1 text-sm text-stone-600">{item.description}</p>
                  <p className="mt-1 text-sm font-medium text-stone-900">${item.price}</p>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${item.isAvailable ? 'bg-emerald-100 text-emerald-700' : 'bg-stone-200 text-stone-600'}`}>
                    {item.isAvailable ? 'Available' : 'Hidden'}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemove(item.id)}
                    className="rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-100"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  )
}
