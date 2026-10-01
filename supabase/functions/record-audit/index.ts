import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('SITE_URL') ?? '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const allowedTables = new Set([
  'business_settings',
  'business_hours',
  'menu_categories',
  'menu_items',
  'gallery_items',
  'reservation_requests',
])
const allowedActions = new Set(['create', 'update', 'delete', 'publish', 'unpublish', 'reservation_status'])
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed.' }, 405)
  }

  const authorization = request.headers.get('Authorization')
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

  if (!authorization || !supabaseUrl || !anonKey || !serviceRoleKey) {
    return jsonResponse({ error: 'The audit function is not configured for authenticated use.' }, 500)
  }

  const authClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const serviceClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { data: userData, error: authError } = await authClient.auth.getUser()
  if (authError || !userData.user) {
    return jsonResponse({ error: 'A valid signed-in user is required.' }, 401)
  }

  let body: {
    business_id?: unknown
    action?: unknown
    entity_table?: unknown
    entity_id?: unknown
    metadata?: unknown
  }
  try {
    body = await request.json()
  } catch {
    return jsonResponse({ error: 'A valid JSON request body is required.' }, 400)
  }

  if (
    typeof body.business_id !== 'string' || !uuidPattern.test(body.business_id) ||
    typeof body.action !== 'string' || !allowedActions.has(body.action) ||
    typeof body.entity_table !== 'string' || !allowedTables.has(body.entity_table) ||
    (body.entity_id !== undefined && body.entity_id !== null && (typeof body.entity_id !== 'string' || !uuidPattern.test(body.entity_id)))
  ) {
    return jsonResponse({ error: 'The audit event does not match the supported event format.' }, 400)
  }

  const actor = userData.user
  const { data: profile, error: profileError } = await serviceClient
    .from('profiles')
    .select('business_id, role')
    .eq('id', actor.id)
    .single()

  if (profileError || !profile || profile.business_id !== body.business_id || !['ADMIN', 'EDITOR'].includes(profile.role)) {
    return jsonResponse({ error: 'You are not authorized to record events for this restaurant.' }, 403)
  }

  const metadata: Record<string, string | number | boolean | null> = {}
  if (body.metadata && typeof body.metadata === 'object' && !Array.isArray(body.metadata)) {
    for (const [key, value] of Object.entries(body.metadata)) {
      if (Object.keys(metadata).length >= 12) break
      if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' || value === null) {
        metadata[key.slice(0, 64)] = typeof value === 'string' ? value.slice(0, 160) : value
      }
    }
  }

  const { error: insertError } = await serviceClient.from('audit_logs').insert({
    business_id: profile.business_id,
    actor_user_id: actor.id,
    action: body.action,
    entity_table: body.entity_table,
    entity_id: body.entity_id ?? null,
    metadata,
  })

  if (insertError) {
    return jsonResponse({ error: 'The change was saved, but its audit event could not be recorded.' }, 500)
  }

  return jsonResponse({ ok: true })
})
