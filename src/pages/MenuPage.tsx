import { useEffect, useRef, useState } from 'react'
import { useBusinessProfile } from '../context/useBusinessProfile'
import { tryRecordAuditEvent } from '../lib/audit'
import { deleteBusinessImage, getBusinessImagePath, uploadBusinessImage, validateBusinessImage } from '../lib/business-images'
import {
  createAdminMenuItem,
  createMenuCategory,
  deleteMenuCategory,
  deleteAdminMenuItem,
  fetchAdminMenuItems,
  fetchMenuCategories,
  updateAdminMenuItem,
  updateMenuCategory,
  type AdminMenuItem,
  type MenuCategoryRecord,
} from '../lib/cms-api'

type MenuDraft = {
  category_id: string
  name: string
  description: string
  price: string
  image_url: string
  is_featured: boolean
  is_available: boolean
  is_published: boolean
}

const emptyDraft: MenuDraft = {
  category_id: '',
  name: '',
  description: '',
  price: '',
  image_url: '',
  is_featured: false,
  is_available: true,
  is_published: false,
}

export function MenuPage() {
  const { profile, loading: profileLoading, error: profileError } = useBusinessProfile()
  const [categories, setCategories] = useState<MenuCategoryRecord[]>([])
  const [items, setItems] = useState<AdminMenuItem[]>([])
  const [loadedBusinessId, setLoadedBusinessId] = useState<string | null>(null)
  const [draft, setDraft] = useState<MenuDraft>(emptyDraft)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const [categoryName, setCategoryName] = useState('')
  const [status, setStatus] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const canEdit = profile?.role === 'ADMIN' || profile?.role === 'EDITOR'
  const isLoading = profileLoading || Boolean(profile?.business_id && loadedBusinessId !== profile.business_id)

  useEffect(() => {
    if (!profile?.business_id) return

    let isActive = true
    Promise.all([fetchMenuCategories(profile.business_id), fetchAdminMenuItems(profile.business_id)])
      .then(([nextCategories, nextItems]) => {
        if (!isActive) return
        setCategories(nextCategories)
        setItems(nextItems)
        setDraft((current) => ({ ...current, category_id: current.category_id || nextCategories[0]?.id || '' }))
        setErrorMessage('')
      })
      .catch((error: unknown) => {
        if (!isActive) return
        setErrorMessage(error instanceof Error ? error.message : 'Unable to load menu data.')
      })
      .finally(() => {
        if (isActive) setLoadedBusinessId(profile.business_id)
      })

    return () => {
      isActive = false
    }
  }, [profile?.business_id])

  const handleChange = (field: keyof MenuDraft, value: string | boolean | number) => {
    if (field === 'price' && typeof value === 'string') {
      const input = value.replace(/[^\d.]/g, '')
      const decimalIndex = input.indexOf('.')
      const integer = (decimalIndex < 0 ? input : input.slice(0, decimalIndex)).replace(/^0+(?=\d)/, '')
      const fraction = decimalIndex < 0 ? '' : `.${input.slice(decimalIndex + 1).replace(/\./g, '').slice(0, 2)}`
      setDraft((current) => ({ ...current, price: `${integer || (fraction ? '0' : '')}${fraction}` }))
      return
    }

    setDraft((current) => ({
      ...current,
      [field]: value,
    }))
  }

  const handleImageSelection = (file: File | undefined) => {
    setErrorMessage('')
    if (!file) {
      setImageFile(null)
      return
    }

    try {
      validateBusinessImage(file)
      setImageFile(file)
    } catch (error) {
      setImageFile(null)
      if (imageInputRef.current) imageInputRef.current.value = ''
      setErrorMessage(error instanceof Error ? error.message : 'Unable to use this image.')
    }
  }

  const handleCreateCategory = async () => {
    if (!profile?.business_id || !canEdit || !categoryName.trim()) return

    setIsSaving(true)
    setErrorMessage('')
    setStatus('')
    try {
      const category = await createMenuCategory(profile.business_id, categoryName.trim())
      setCategoryName('')
      setDraft((current) => ({ ...current, category_id: category.id }))
      setCategories((current) => [...current, category])
      const audited = await tryRecordAuditEvent({
        business_id: profile.business_id,
        action: 'create',
        entity_table: 'menu_categories',
        entity_id: category.id,
        metadata: { name: category.name },
      })
      setStatus(audited ? 'Category created and recorded. Publish it when it is ready for guests.' : 'Category created. Audit logging is unavailable; publish it when it is ready for guests.')
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to create category.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSave = async () => {
    const normalizedPrice = draft.price.trim()
    if (!profile?.business_id || !canEdit || !draft.category_id || !draft.name.trim() || !/^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/.test(normalizedPrice)) {
      setErrorMessage('Choose a category, enter a dish name, and enter a price such as 20 or 20.50.')
      return
    }

    setIsSaving(true)
    setErrorMessage('')
    setStatus('')
    let uploadedPath: string | null = null
    try {
      let imageUrl = draft.image_url.trim() || null
      if (imageFile) {
        const uploaded = await uploadBusinessImage(profile.business_id, 'menu', imageFile)
        uploadedPath = uploaded.path
        imageUrl = uploaded.publicUrl
      }

      const item = await createAdminMenuItem(profile.business_id, {
        ...draft,
        name: draft.name.trim(),
        description: draft.description.trim() || null,
        price: Number(normalizedPrice),
        image_url: imageUrl,
        display_order: items.length,
      })
      uploadedPath = null
      const categoryName = categories.find((category) => category.id === item.category_id)?.name ?? 'Uncategorized'
      setItems((current) => [...current, { ...item, price: Number(item.price), category_name: categoryName } as AdminMenuItem])
      setDraft({ ...emptyDraft, category_id: categories[0]?.id ?? '' })
      setImageFile(null)
      if (imageInputRef.current) imageInputRef.current.value = ''
      const audited = await tryRecordAuditEvent({
        business_id: profile.business_id,
        action: 'create',
        entity_table: 'menu_items',
        entity_id: item.id,
        metadata: { category_id: item.category_id },
      })
      setStatus(audited ? 'Menu item saved and recorded.' : 'Menu item saved. The audit function could not record this change.')
    } catch (error) {
      if (uploadedPath) {
        try {
          await deleteBusinessImage(uploadedPath)
        } catch {
          setErrorMessage('The menu item was not saved and the uploaded image could not be cleaned up.')
          return
        }
      }
      setErrorMessage(error instanceof Error ? error.message : 'Unable to save menu item.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteCategory = async (category: MenuCategoryRecord) => {
    if (!profile?.business_id || !canEdit) return
    const dishCount = items.filter((item) => item.category_id === category.id).length
    if (dishCount > 0) {
      setErrorMessage(`Remove the ${dishCount} dish${dishCount === 1 ? '' : 'es'} in ${category.name} before deleting this category.`)
      return
    }
    if (!window.confirm(`Delete the empty category "${category.name}"?`)) return

    setIsSaving(true)
    setErrorMessage('')
    setStatus('')
    try {
      await deleteMenuCategory(profile.business_id, category.id)
      const remainingCategories = categories.filter((entry) => entry.id !== category.id)
      setCategories(remainingCategories)
      setDraft((current) => ({
        ...current,
        category_id: current.category_id === category.id ? remainingCategories[0]?.id ?? '' : current.category_id,
      }))
      const audited = await tryRecordAuditEvent({
        business_id: profile.business_id,
        action: 'delete',
        entity_table: 'menu_categories',
        entity_id: category.id,
      })
      setStatus(audited ? 'Category deleted and recorded.' : 'Category deleted. The audit function could not record this change.')
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to delete this category.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCategoryPublish = async (category: MenuCategoryRecord) => {
    if (!profile?.business_id || !canEdit) return
    setErrorMessage('')
    try {
      await updateMenuCategory(profile.business_id, category.id, { is_published: !category.is_published })
      const nextPublished = !category.is_published
      setCategories((current) => current.map((entry) => entry.id === category.id ? { ...entry, is_published: nextPublished } : entry))
      const audited = await tryRecordAuditEvent({
        business_id: profile.business_id,
        action: nextPublished ? 'publish' : 'unpublish',
        entity_table: 'menu_categories',
        entity_id: category.id,
      })
      setStatus(`Category ${nextPublished ? 'published' : 'unpublished'}${audited ? ' and recorded.' : '. Audit logging is unavailable.'}`)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to update category.')
    }
  }

  const handleItemUpdate = async (item: AdminMenuItem, changes: Partial<AdminMenuItem>) => {
    if (!profile?.business_id || !canEdit) return
    setErrorMessage('')
    try {
      await updateAdminMenuItem(profile.business_id, item.id, changes)
      setItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, ...changes } : entry))
      const isPublishing = Object.hasOwn(changes, 'is_published')
      const published = changes.is_published
      const audited = await tryRecordAuditEvent({
        business_id: profile.business_id,
        action: isPublishing ? (published ? 'publish' : 'unpublish') : 'update',
        entity_table: 'menu_items',
        entity_id: item.id,
        metadata: Object.hasOwn(changes, 'is_available') ? { is_available: Boolean(changes.is_available) } : undefined,
      })
      setStatus(`Menu item updated${audited ? ' and recorded.' : '. Audit logging is unavailable.'}`)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to update menu item.')
    }
  }

  const handleRemove = async (itemId: string) => {
    if (!profile?.business_id || !canEdit) return
    setErrorMessage('')
    try {
      const item = items.find((entry) => entry.id === itemId)
      await deleteAdminMenuItem(profile.business_id, itemId)
      setItems((current) => current.filter((item) => item.id !== itemId))
      const imagePath = item?.image_url
        ? getBusinessImagePath(item.image_url, profile.business_id, 'menu')
        : null
      let imageCleanupFailed = false
      if (imagePath) {
        try {
          await deleteBusinessImage(imagePath)
        } catch {
          imageCleanupFailed = true
        }
      }
      const audited = await tryRecordAuditEvent({
        business_id: profile.business_id,
        action: 'delete',
        entity_table: 'menu_items',
        entity_id: itemId,
      })
      setStatus(imageCleanupFailed
        ? 'Menu item removed, but its stored image could not be removed.'
        : audited
          ? 'Menu item removed and recorded.'
          : 'Menu item removed. The audit function could not record this change.')
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to remove menu item.')
    }
  }

  return (
    <div className="space-y-6">
      <section className="cms-panel p-5 sm:p-7">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#a84f35]">Supabase menu</p>
        <h2 className="font-display mt-2 text-3xl">Categories and dishes</h2>
        <p className="mt-2 text-sm text-[#74756c]">Changes are saved to this restaurant's database and protected by its current RLS policies.</p>

        {(profileLoading || isLoading) && <p role="status" className="mt-5 text-sm text-[#74756c]">Loading menu…</p>}
        {(profileError || errorMessage) && <p role="alert" className="mt-5 rounded-md border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">{errorMessage || profileError}</p>}
        {profile && !canEdit && <p role="status" className="mt-5 text-sm text-[#74756c]">Your VIEWER role can review the menu but cannot make changes.</p>}
        {status && <p role="status" className="mt-3 text-sm font-medium text-[#526044]">{status}</p>}

        <div className="mt-6 border-y border-[#e7e4db] py-5">
          <h3 className="text-sm font-semibold">Add a category</h3>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row">
            <label className="flex-1 text-sm font-medium text-[#53544d]">Category name
              <input value={categoryName} onChange={(event) => setCategoryName(event.target.value)} className="cms-control mt-1.5" disabled={!canEdit || isSaving} />
            </label>
            <button type="button" onClick={handleCreateCategory} disabled={!canEdit || isSaving || !categoryName.trim()} className="cms-button-primary self-end disabled:cursor-not-allowed disabled:bg-stone-300">Create category</button>
          </div>
          {categories.length > 0 && (
            <div className="mt-4 divide-y divide-[#e7e4db] rounded-md border border-[#e7e4db] px-3">
              {categories.map((category) => {
                const dishCount = items.filter((item) => item.category_id === category.id).length
                return (
                  <div key={category.id} className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-medium">{category.name}</p>
                      <p className="mt-1 text-xs text-[#85857b]">{dishCount} {dishCount === 1 ? 'dish' : 'dishes'} · {category.is_published ? 'Published' : 'Draft'}</p>
                    </div>
                    <div className="flex gap-2">
                      <button type="button" disabled={!canEdit || isSaving} onClick={() => void handleCategoryPublish(category)} className="rounded-md border border-[#d9d7ce] px-3 py-2 text-xs font-semibold disabled:opacity-50">{category.is_published ? 'Unpublish' : 'Publish'}</button>
                      <button type="button" disabled={!canEdit || isSaving} onClick={() => void handleDeleteCategory(category)} className="rounded-md border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 disabled:opacity-50">Delete category</button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <label className="block text-sm font-medium text-stone-700">
            Category
            <select value={draft.category_id} onChange={(event) => handleChange('category_id', event.target.value)} className="cms-control mt-1.5" disabled={!canEdit || isLoading || categories.length === 0} required>
              <option value="">Choose a category</option>
              {categories.map((category) => <option key={category.id} value={category.id}>{category.name}{category.is_published ? '' : ' (draft)'}</option>)}
            </select>
          </label>

          <label className="block text-sm font-medium text-stone-700">
            Dish name
            <input
              value={draft.name}
              onChange={(event) => handleChange('name', event.target.value)}
              className="cms-control mt-1.5"
              disabled={!canEdit || isLoading}
            />
          </label>

          <label className="block text-sm font-medium text-stone-700">
            Price
            <input
              type="text"
              inputMode="decimal"
              placeholder="20"
              value={draft.price}
              onChange={(event) => handleChange('price', event.target.value)}
              className="cms-control mt-1.5"
              disabled={!canEdit || isLoading}
              required
            />
          </label>

          <label className="block text-sm font-medium text-stone-700 md:col-span-2">
            Dish image <span className="font-normal text-[#85857b]">(JPEG, PNG, WebP; up to 5 MB)</span>
            <input ref={imageInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => handleImageSelection(event.target.files?.[0])} className="cms-control mt-1.5 file:mr-4 file:rounded file:border-0 file:bg-[#eeece3] file:px-3 file:py-2 file:text-xs file:font-semibold" disabled={!canEdit || isSaving || isLoading} />
            {imageFile && <span className="mt-1 block text-xs text-[#526044]">Selected: {imageFile.name}</span>}
          </label>

          <label className="block text-sm font-medium text-stone-700 md:col-span-2">
            Or use an image URL <span className="font-normal text-[#85857b]">(optional; uploaded file takes priority)</span>
            <input type="url" value={draft.image_url} onChange={(event) => handleChange('image_url', event.target.value)} className="cms-control mt-1.5" disabled={!canEdit || isLoading} />
          </label>

          <label className="block text-sm font-medium text-stone-700 md:col-span-2">
            Description
            <textarea
              rows={4}
              value={draft.description}
              onChange={(event) => handleChange('description', event.target.value)}
              className="cms-control mt-1.5"
              disabled={!canEdit || isLoading}
            />
          </label>

          <label className="flex min-h-12 items-center gap-3 rounded-md border border-[#e7e4db] bg-[#fbfaf6] px-3 py-3 text-sm font-medium text-[#53544d]">
            <input
              type="checkbox"
              checked={draft.is_featured}
              onChange={(event) => handleChange('is_featured', event.target.checked)}
              disabled={!canEdit || isLoading}
            />
            Feature this item on the homepage
          </label>

          <label className="flex min-h-12 items-center gap-3 rounded-md border border-[#e7e4db] bg-[#fbfaf6] px-3 py-3 text-sm font-medium text-[#53544d]">
            <input
              type="checkbox"
              checked={draft.is_available}
              onChange={(event) => handleChange('is_available', event.target.checked)}
              disabled={!canEdit || isLoading}
            />
            Available for ordering
          </label>

          <label className="flex min-h-12 items-center gap-3 rounded-md border border-[#e7e4db] bg-[#fbfaf6] px-3 py-3 text-sm font-medium text-[#53544d]">
            <input type="checkbox" checked={draft.is_published} disabled={!canEdit || isLoading} onChange={(event) => handleChange('is_published', event.target.checked)} />
            Publish this item
          </label>
        </div>

        <div className="mt-6 flex items-center gap-3">
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={!canEdit || isSaving || isLoading || categories.length === 0}
            className="cms-button-primary disabled:cursor-not-allowed disabled:bg-stone-300"
          >
            {isSaving ? 'Saving…' : 'Save dish'}
          </button>
        </div>
      </section>

      <section className="cms-panel p-5 sm:p-7">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#a84f35]">Database menu · {items.length} dishes</p>
        <div className="mt-6 space-y-3">
          {!isLoading && items.length === 0 ? (
            <div className="rounded-md border border-dashed border-[#d9d7ce] px-5 py-9 text-center text-sm text-[#74756c]">No dishes have been added to this restaurant's menu.</div>
          ) : (
            items.map((item) => (
              <div key={item.id} className="flex flex-col gap-3 border-b border-[#e7e4db] py-4 last:border-0 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-lg font-semibold text-stone-900">{item.name}</p>
                    {item.is_featured && <span className="rounded-sm bg-[#efe3d9] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#813a28]">Featured</span>}
                  </div>
                  <p className="mt-1 text-xs font-medium uppercase tracking-wide text-[#85857b]">{item.category_name}</p>
                  <p className="mt-1 text-sm text-stone-600">{item.description}</p>
                  <p className="mt-1 text-sm font-medium text-stone-900">${item.price}</p>
                  {item.image_url && <img src={item.image_url} alt={item.name} className="mt-3 h-20 w-28 rounded-md object-cover" loading="lazy" />}
                </div>

                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-2 text-xs text-[#53544d]">Available<input type="checkbox" checked={item.is_available} disabled={!canEdit} onChange={() => void handleItemUpdate(item, { is_available: !item.is_available })} /></label>
                  <label className="flex items-center gap-2 text-xs text-[#53544d]">Published<input type="checkbox" checked={item.is_published} disabled={!canEdit} onChange={() => void handleItemUpdate(item, { is_published: !item.is_published })} /></label>
                  <button
                    type="button"
                    onClick={() => void handleRemove(item.id)}
                    disabled={!canEdit}
                    className="rounded-md border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
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
