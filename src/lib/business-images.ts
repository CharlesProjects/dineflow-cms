import { supabase } from './supabase'

const bucketName = 'business-public'
const allowedImageTypes = new Set(['image/jpeg', 'image/png', 'image/webp'])
const maximumImageBytes = 5 * 1024 * 1024

export type BusinessImageFolder = 'branding' | 'menu'

export type UploadedBusinessImage = {
  path: string
  publicUrl: string
}

export function validateBusinessImage(file: File) {
  if (!allowedImageTypes.has(file.type)) {
    throw new Error('Choose a JPEG, PNG, or WebP image.')
  }
  if (file.size > maximumImageBytes) {
    throw new Error('Image files must be 5 MB or smaller.')
  }
}

export async function uploadBusinessImage(
  businessId: string,
  folder: BusinessImageFolder,
  file: File,
): Promise<UploadedBusinessImage> {
  validateBusinessImage(file)
  const extension = file.type === 'image/jpeg' ? 'jpg' : file.type.slice('image/'.length)
  const path = `business/${businessId}/public/${folder}/${crypto.randomUUID()}.${extension}`
  const { error } = await supabase.storage
    .from(bucketName)
    .upload(path, file, { contentType: file.type, upsert: false })

  if (error) throw error

  const { data } = supabase.storage.from(bucketName).getPublicUrl(path)
  return { path, publicUrl: data.publicUrl }
}

export function getBusinessImagePath(publicUrl: string, businessId: string, folder: BusinessImageFolder) {
  try {
    const path = new URL(publicUrl).pathname
    const marker = `/storage/v1/object/public/${bucketName}/`
    const markerIndex = path.indexOf(marker)
    if (markerIndex === -1) return null

    const objectPath = decodeURIComponent(path.slice(markerIndex + marker.length))
    return objectPath.startsWith(`business/${businessId}/public/${folder}/`) ? objectPath : null
  } catch {
    return null
  }
}

export async function deleteBusinessImage(path: string) {
  const { error } = await supabase.storage.from(bucketName).remove([path])
  if (error) throw error
}
