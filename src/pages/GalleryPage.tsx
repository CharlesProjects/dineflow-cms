import { useEffect, useState, type FormEvent } from 'react'
import { useBusinessProfile } from '../context/useBusinessProfile'
import { tryRecordAuditEvent } from '../lib/audit'
import { createGalleryRecord, deleteGalleryRecord, fetchGalleryRecords, updateGalleryRecord, type GalleryRecord } from '../lib/cms-api'
import { supabase } from '../lib/supabase'

const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp'])
const maximumFileSize = 5 * 1024 * 1024
const storageBucket = 'business-public'

function getObjectPath(imageUrl: string) {
  try {
    const path = new URL(imageUrl).pathname
    const marker = `/storage/v1/object/public/${storageBucket}/`
    const markerIndex = path.indexOf(marker)
    return markerIndex === -1 ? null : decodeURIComponent(path.slice(markerIndex + marker.length))
  } catch {
    return null
  }
}

export function GalleryPage() {
  const { profile, loading: profileLoading, error: profileError } = useBusinessProfile()
  const [items, setItems] = useState<GalleryRecord[]>([])
  const [loadedBusinessId, setLoadedBusinessId] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [isPublished, setIsPublished] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const canEdit = profile?.role === 'ADMIN' || profile?.role === 'EDITOR'
  const isLoading = profileLoading || Boolean(profile?.business_id && loadedBusinessId !== profile.business_id)

  useEffect(() => {
    if (!profile?.business_id) return

    let isActive = true
    fetchGalleryRecords(profile.business_id)
      .then((data) => {
        if (!isActive) return
        setItems(data)
        setErrorMessage('')
      })
      .catch((error: unknown) => {
        if (!isActive) return
        setErrorMessage(error instanceof Error ? error.message : 'Unable to load gallery items.')
      })
      .finally(() => {
        if (isActive) setLoadedBusinessId(profile.business_id)
      })

    return () => {
      isActive = false
    }
  }, [profile?.business_id])

  const handleUpload = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = event.currentTarget
    if (!profile?.business_id || !canEdit || !file) return

    if (!allowedTypes.has(file.type)) {
      setErrorMessage('Choose a JPEG, PNG, or WebP image.')
      return
    }
    if (file.size > maximumFileSize) {
      setErrorMessage('Image files must be 5 MB or smaller.')
      return
    }

    setIsSaving(true)
    setErrorMessage('')
    setStatusMessage('')
    const extension = file.type === 'image/jpeg' ? 'jpg' : file.type.split('/')[1]
    const objectPath = `business/${profile.business_id}/public/gallery/${crypto.randomUUID()}.${extension}`
    let createdItemId = ''

    try {
      const { error: uploadError } = await supabase.storage
        .from(storageBucket)
        .upload(objectPath, file, { contentType: file.type, upsert: false })
      if (uploadError) throw uploadError

      const { data } = supabase.storage.from(storageBucket).getPublicUrl(objectPath)
      try {
        const created = await createGalleryRecord(profile.business_id, {
          image_url: data.publicUrl,
          title: title.trim() || file.name,
          alt_text: title.trim() || file.name,
          description: description.trim() || null,
          display_order: items.length,
          is_published: isPublished,
        })
        createdItemId = created.id
      } catch (error) {
        await supabase.storage.from(storageBucket).remove([objectPath])
        throw error
      }

      setTitle('')
      setDescription('')
      setFile(null)
      setIsPublished(false)
      form.reset()
      setItems((current) => [...current, {
        id: createdItemId,
        image_url: data.publicUrl,
        title: title.trim() || file.name,
        alt_text: title.trim() || file.name,
        description: description.trim() || null,
        display_order: items.length,
        is_published: isPublished,
      }])
      const audited = await tryRecordAuditEvent({
        business_id: profile.business_id,
        action: isPublished ? 'publish' : 'create',
        entity_table: 'gallery_items',
        entity_id: createdItemId,
        metadata: { is_published: isPublished },
      })
      setStatusMessage(audited ? 'Image uploaded, saved, and recorded.' : 'Image uploaded and saved. The audit function could not record this change.')
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to upload this image. Verify that the storage bucket exists and your role has access.')
    } finally {
      setIsSaving(false)
    }
  }

  const handlePublish = async (item: GalleryRecord) => {
    if (!profile?.business_id || !canEdit) return
    setActiveId(item.id)
    setErrorMessage('')
    setStatusMessage('')
    try {
      await updateGalleryRecord(profile.business_id, item.id, { is_published: !item.is_published })
      const nextPublished = !item.is_published
      setItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, is_published: nextPublished } : entry))
      const audited = await tryRecordAuditEvent({
        business_id: profile.business_id,
        action: nextPublished ? 'publish' : 'unpublish',
        entity_table: 'gallery_items',
        entity_id: item.id,
      })
      setStatusMessage(`Gallery image ${nextPublished ? 'published' : 'unpublished'}${audited ? ' and recorded.' : '. Audit logging is unavailable.'}`)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to update this gallery item.')
    } finally {
      setActiveId(null)
    }
  }

  const handleDelete = async (item: GalleryRecord) => {
    if (!profile?.business_id || !canEdit) return
    setActiveId(item.id)
    setErrorMessage('')
    setStatusMessage('')
    try {
      const objectPath = getObjectPath(item.image_url)
      if (objectPath) {
        const { error } = await supabase.storage.from(storageBucket).remove([objectPath])
        if (error) throw error
      }
      await deleteGalleryRecord(profile.business_id, item.id)
      setItems((current) => current.filter((entry) => entry.id !== item.id))
      const audited = await tryRecordAuditEvent({
        business_id: profile.business_id,
        action: 'delete',
        entity_table: 'gallery_items',
        entity_id: item.id,
      })
      setStatusMessage(audited ? 'Gallery item removed and recorded.' : 'Gallery item removed. The audit function could not record this change.')
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to remove this gallery item.')
    } finally {
      setActiveId(null)
    }
  }

  return (
    <div className="space-y-6">
      <section>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#a84f35]">Restaurant photography</p>
        <h2 className="font-display mt-2 text-4xl">Gallery</h2>
        <p className="mt-2 text-sm text-[#74756c]">Images are stored in the restaurant's public-assets path; publish them to show them on the website.</p>
      </section>

      {(profileError || errorMessage) && <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">{errorMessage || profileError}</p>}
      {statusMessage && <p role="status" className="text-sm font-medium text-[#526044]">{statusMessage}</p>}
      {profile && !canEdit && <p role="status" className="rounded-md border border-[#e7e4db] bg-[#fbfaf6] px-3 py-2.5 text-sm text-[#62635c]">Your VIEWER role can review the gallery but cannot upload or change items.</p>}

      <form onSubmit={handleUpload} className="cms-panel grid gap-4 p-5 sm:p-7 md:grid-cols-2">
        <div className="md:col-span-2">
          <p className="text-sm font-semibold">Add an image</p>
          <p className="mt-1 text-xs text-[#85857b]">JPEG, PNG, or WebP · maximum 5 MB</p>
        </div>
        <label className="text-sm font-medium text-[#53544d] md:col-span-2">Image file
          <input type="file" accept="image/jpeg,image/png,image/webp" required disabled={!canEdit || isSaving} onChange={(event) => setFile(event.target.files?.[0] ?? null)} className="cms-control mt-1.5 file:mr-4 file:rounded file:border-0 file:bg-[#eeece3] file:px-3 file:py-2 file:text-xs file:font-semibold" />
        </label>
        <label className="text-sm font-medium text-[#53544d]">Title
          <input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={160} disabled={!canEdit || isSaving} className="cms-control mt-1.5" />
        </label>
        <label className="text-sm font-medium text-[#53544d]">Description <span className="font-normal text-[#85857b]">(optional)</span>
          <input value={description} onChange={(event) => setDescription(event.target.value)} maxLength={500} disabled={!canEdit || isSaving} className="cms-control mt-1.5" />
        </label>
        <label className="flex min-h-12 items-center gap-3 rounded-md border border-[#e7e4db] bg-[#fbfaf6] px-3 py-3 text-sm font-medium text-[#53544d] md:col-span-2">
          <input type="checkbox" checked={isPublished} disabled={!canEdit || isSaving} onChange={(event) => setIsPublished(event.target.checked)} />
          Publish immediately on the public website
        </label>
        <button type="submit" disabled={!canEdit || isSaving || isLoading || !file} className="cms-button-primary w-fit disabled:cursor-not-allowed disabled:bg-stone-300">{isSaving ? 'Uploading…' : 'Upload image'}</button>
      </form>

      <section className="cms-panel p-5 sm:p-7">
        <div className="flex items-center justify-between gap-4">
          <h3 className="text-sm font-semibold">Stored gallery items</h3>
          <span className="text-xs text-[#85857b]">{items.length} images</span>
        </div>
        {isLoading ? <p role="status" className="mt-5 text-sm text-[#74756c]">Loading gallery…</p> : items.length === 0 ? (
          <div className="mt-5 rounded-md border border-dashed border-[#d9d7ce] px-5 py-10 text-center text-sm text-[#74756c]">No gallery images have been uploaded for this restaurant.</div>
        ) : (
          <div className="mt-5 grid gap-x-5 gap-y-7 sm:grid-cols-2 xl:grid-cols-3">
            {items.map((item) => (
              <article key={item.id}>
                <div className="aspect-[4/3] overflow-hidden rounded-md bg-[#eeece3]">
                  <img src={item.image_url} alt={item.alt_text ?? item.title ?? 'Restaurant gallery image'} loading="lazy" className="h-full w-full object-cover" />
                </div>
                <div className="mt-3 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h4 className="truncate text-sm font-semibold">{item.title || 'Untitled image'}</h4>
                    {item.description && <p className="mt-1 line-clamp-2 text-xs leading-5 text-[#74756c]">{item.description}</p>}
                  </div>
                  <span className={`shrink-0 rounded-sm px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ${item.is_published ? 'bg-[#e8ecdf] text-[#526044]' : 'bg-[#ebe9e1] text-[#65665e]'}`}>{item.is_published ? 'Published' : 'Draft'}</span>
                </div>
                <div className="mt-3 flex gap-2">
                  <button type="button" disabled={!canEdit || activeId === item.id} onClick={() => void handlePublish(item)} className="rounded-md border border-[#d9d7ce] px-3 py-2 text-xs font-semibold disabled:opacity-50">{item.is_published ? 'Unpublish' : 'Publish'}</button>
                  <button type="button" disabled={!canEdit || activeId === item.id} onClick={() => void handleDelete(item)} className="rounded-md border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 disabled:opacity-50">Remove</button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
