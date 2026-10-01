import { supabase } from './supabase'

export type AuditEventInput = {
  business_id: string
  action: string
  entity_table: string
  entity_id?: string | null
  metadata?: Record<string, string | number | boolean | null>
}

export async function recordAuditEvent(event: AuditEventInput) {
  const { data, error } = await supabase.functions.invoke('record-audit', { body: event })
  if (error) throw error
  if (data?.error) throw new Error(String(data.error))
  return data as { ok: true }
}

export async function tryRecordAuditEvent(event: AuditEventInput) {
  try {
    await recordAuditEvent(event)
    return true
  } catch {
    return false
  }
}
