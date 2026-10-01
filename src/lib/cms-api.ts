import { getPublicBusinessId } from './tenant'
import { publicSupabase, supabase } from './supabase'

export type BusinessSettingsRecord = {
  business_name: string
  tagline: string
  description: string
  phone: string
  email: string
  address: string
  map_url: string
  website_url: string
  social_links: Record<string, string>
  hero_title: string
  hero_description: string
  is_published: boolean
}

export type BusinessHourRecord = {
  day_of_week: number
  open_time: string | null
  close_time: string | null
  is_closed: boolean
  is_published: boolean
}

export type MenuCategoryRecord = {
  id: string
  name: string
  description: string | null
  display_order: number
  is_published: boolean
}

export type AdminMenuItem = {
  id: string
  category_id: string
  category_name: string
  name: string
  description: string | null
  price: number
  image_url: string | null
  display_order: number
  is_featured: boolean
  is_available: boolean
  is_published: boolean
}

export type ReservationRecord = {
  id: string
  name: string
  email: string
  phone: string | null
  requested_date: string
  requested_time: string | null
  party_size: number
  message: string
  notes: string | null
  status: 'pending' | 'confirmed' | 'declined' | 'cancelled'
  created_at: string
}

export type GalleryRecord = {
  id: string
  image_url: string
  title: string | null
  alt_text: string | null
  description: string | null
  display_order: number
  is_published: boolean
}

export type AuditRecord = {
  id: string
  actor_user_id: string | null
  action: string
  entity_table: string | null
  entity_id: string | null
  metadata: Record<string, unknown> | null
  created_at: string
}

export type ReservationSubmission = {
  name: string
  email: string
  phone: string
  requested_date: string
  requested_time: string
  party_size: number
  message: string
  honeypot: string
}

export async function submitReservationRequest(request: ReservationSubmission) {
  const businessId = getPublicBusinessId()
  if (!businessId) {
    throw new Error('Online reservation requests are not configured for this restaurant.')
  }

  const { error } = await publicSupabase.from('reservation_requests').insert({
    business_id: businessId,
    name: request.name.trim(),
    email: request.email.trim(),
    phone: request.phone.trim() || null,
    requested_date: request.requested_date,
    requested_time: request.requested_time || null,
    party_size: request.party_size,
    message: request.message.trim(),
    honeypot: request.honeypot,
  })

  if (error) throw error
}

export async function fetchBusinessSettingsRecord(businessId: string) {
  const { data, error } = await supabase
    .from('business_settings')
    .select('business_name, tagline, description, phone, email, address, map_url, website_url, social_links, hero_title, hero_description, is_published')
    .eq('business_id', businessId)
    .maybeSingle()

  if (error) throw error
  return data as BusinessSettingsRecord | null
}

export async function saveBusinessSettingsRecord(businessId: string, settings: BusinessSettingsRecord) {
  const { data, error } = await supabase
    .from('business_settings')
    .upsert({ business_id: businessId, ...settings }, { onConflict: 'business_id' })
    .select('business_name, tagline, description, phone, email, address, map_url, website_url, social_links, hero_title, hero_description, is_published')
    .single()

  if (error) throw error
  return data as BusinessSettingsRecord
}

export async function fetchBusinessHourRecords(businessId: string) {
  const { data, error } = await supabase
    .from('business_hours')
    .select('day_of_week, open_time, close_time, is_closed, is_published')
    .eq('business_id', businessId)
    .order('day_of_week', { ascending: true })

  if (error) throw error
  return (data ?? []) as BusinessHourRecord[]
}

export async function saveBusinessHourRecords(businessId: string, entries: BusinessHourRecord[]) {
  const rows = entries.map((entry) => ({ business_id: businessId, ...entry }))
  const { error } = await supabase
    .from('business_hours')
    .upsert(rows, { onConflict: 'business_id,day_of_week' })

  if (error) throw error
}

export async function fetchMenuCategories(businessId: string) {
  const { data, error } = await supabase
    .from('menu_categories')
    .select('id, name, description, display_order, is_published')
    .eq('business_id', businessId)
    .order('display_order', { ascending: true })

  if (error) throw error
  return (data ?? []) as MenuCategoryRecord[]
}

export async function createMenuCategory(businessId: string, name: string) {
  const { data, error } = await supabase
    .from('menu_categories')
    .insert({ business_id: businessId, name, is_published: false })
    .select('id, name, description, display_order, is_published')
    .single()

  if (error) throw error
  return data as MenuCategoryRecord
}

export async function updateMenuCategory(
  businessId: string,
  categoryId: string,
  changes: Partial<Pick<MenuCategoryRecord, 'name' | 'description' | 'display_order' | 'is_published'>>,
) {
  const { error } = await supabase
    .from('menu_categories')
    .update(changes)
    .eq('business_id', businessId)
    .eq('id', categoryId)

  if (error) throw error
}

export async function fetchAdminMenuItems(businessId: string) {
  const { data, error } = await supabase
    .from('menu_items')
    .select('id, category_id, name, description, price, image_url, display_order, is_featured, is_available, is_published, menu_categories!category_id(name)')
    .eq('business_id', businessId)
    .order('display_order', { ascending: true })

  if (error) throw error

  return (data ?? []).map((row) => {
    const relation = row.menu_categories as unknown as { name: string } | null
    return {
      ...row,
      price: Number(row.price),
      category_name: relation?.name ?? 'Uncategorized',
    } as AdminMenuItem
  })
}

export async function createAdminMenuItem(businessId: string, item: Omit<AdminMenuItem, 'id' | 'category_name'>) {
  const { data, error } = await supabase
    .from('menu_items')
    .insert({ business_id: businessId, ...item })
    .select('id, category_id, name, description, price, image_url, display_order, is_featured, is_available, is_published')
    .single()

  if (error) throw error
  return data
}

export async function updateAdminMenuItem(
  businessId: string,
  itemId: string,
  changes: Partial<Omit<AdminMenuItem, 'id' | 'category_name'>>,
) {
  const { error } = await supabase
    .from('menu_items')
    .update(changes)
    .eq('business_id', businessId)
    .eq('id', itemId)

  if (error) throw error
}

export async function deleteAdminMenuItem(businessId: string, itemId: string) {
  const { error } = await supabase
    .from('menu_items')
    .delete()
    .eq('business_id', businessId)
    .eq('id', itemId)

  if (error) throw error
}

export async function fetchReservationRecords(businessId: string) {
  const { data, error } = await supabase
    .from('reservation_requests')
    .select('id, name, email, phone, requested_date, requested_time, party_size, message, notes, status, created_at')
    .eq('business_id', businessId)
    .order('requested_date', { ascending: true })

  if (error) throw error
  return (data ?? []) as ReservationRecord[]
}

export async function updateReservationStatus(
  businessId: string,
  reservationId: string,
  status: ReservationRecord['status'],
) {
  const { error } = await supabase
    .from('reservation_requests')
    .update({ status })
    .eq('business_id', businessId)
    .eq('id', reservationId)

  if (error) throw error
}

export async function fetchGalleryRecords(businessId: string) {
  const { data, error } = await supabase
    .from('gallery_items')
    .select('id, image_url, title, alt_text, description, display_order, is_published')
    .eq('business_id', businessId)
    .order('display_order', { ascending: true })

  if (error) throw error
  return (data ?? []) as GalleryRecord[]
}

export async function createGalleryRecord(
  businessId: string,
  item: Omit<GalleryRecord, 'id'>,
) {
  const { data, error } = await supabase
    .from('gallery_items')
    .insert({ business_id: businessId, ...item })
    .select('id, image_url, title, alt_text, description, display_order, is_published')
    .single()

  if (error) throw error
  return data as GalleryRecord
}

export async function updateGalleryRecord(
  businessId: string,
  itemId: string,
  changes: Partial<Omit<GalleryRecord, 'id'>>,
) {
  const { error } = await supabase
    .from('gallery_items')
    .update(changes)
    .eq('business_id', businessId)
    .eq('id', itemId)

  if (error) throw error
}

export async function deleteGalleryRecord(businessId: string, itemId: string) {
  const { error } = await supabase
    .from('gallery_items')
    .delete()
    .eq('business_id', businessId)
    .eq('id', itemId)

  if (error) throw error
}

export async function fetchAuditRecords(businessId: string) {
  const { data, error } = await supabase
    .from('audit_logs')
    .select('id, actor_user_id, action, entity_table, entity_id, metadata, created_at')
    .eq('business_id', businessId)
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) throw error
  return (data ?? []) as AuditRecord[]
}

export async function fetchTeamProfiles(businessId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, email, role, created_at')
    .eq('business_id', businessId)
    .order('full_name', { ascending: true })

  if (error) throw error
  return data ?? []
}
