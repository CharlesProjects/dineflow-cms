import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('SITE_URL') ?? '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

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
    return jsonResponse({ error: 'The function is not configured for authenticated team management.' }, 500)
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

  const actor = userData.user
  const { data: actorProfile, error: actorError } = await serviceClient
    .from('profiles')
    .select('business_id, role')
    .eq('id', actor.id)
    .single()

  if (actorError || !actorProfile || actorProfile.role !== 'ADMIN') {
    return jsonResponse({ error: 'Only a restaurant ADMIN can manage team access.' }, 403)
  }

  let body: { action?: unknown; email?: unknown; full_name?: unknown; role?: unknown; user_id?: unknown }
  try {
    body = await request.json()
  } catch {
    return jsonResponse({ error: 'A valid JSON request body is required.' }, 400)
  }

  if (body.action === 'invite') {
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
    const fullName = typeof body.full_name === 'string' ? body.full_name.trim() : ''
    const role = body.role

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !fullName || fullName.length > 120) {
      return jsonResponse({ error: 'Provide a valid email address and a name of 120 characters or fewer.' }, 400)
    }
    if (role !== 'EDITOR' && role !== 'VIEWER') {
      return jsonResponse({ error: 'Invited team members can be assigned EDITOR or VIEWER.' }, 400)
    }

    const siteUrl = Deno.env.get('SITE_URL')
    const { data: inviteData, error: inviteError } = await serviceClient.auth.admin.inviteUserByEmail(email, {
      data: { full_name: fullName },
      ...(siteUrl ? { redirectTo: `${siteUrl.replace(/\/$/, '')}/auth/setup` } : {}),
    })

    if (inviteError || !inviteData.user) {
      return jsonResponse({ error: inviteError?.message ?? 'Unable to invite this account.' }, 400)
    }

    const invitedUser = inviteData.user
    const { error: profileError } = await serviceClient.from('profiles').insert({
      id: invitedUser.id,
      business_id: actorProfile.business_id,
      role,
      full_name: fullName,
      email,
    })

    if (profileError) {
      await serviceClient.auth.admin.deleteUser(invitedUser.id)
      return jsonResponse({ error: `The invitation could not be linked to this restaurant: ${profileError.message}` }, 500)
    }

    const { error: auditError } = await serviceClient.from('audit_logs').insert({
      business_id: actorProfile.business_id,
      actor_user_id: actor.id,
      action: 'team.invite',
      entity_table: 'profiles',
      entity_id: invitedUser.id,
      metadata: { email, role },
    })

    return jsonResponse({ ok: true, auditLogged: !auditError })
  }

  if (body.action === 'change_role') {
    const targetUserId = typeof body.user_id === 'string' ? body.user_id : ''
    const role = body.role
    if (!targetUserId || targetUserId === actor.id || (role !== 'EDITOR' && role !== 'VIEWER')) {
      return jsonResponse({ error: 'Choose another team member and assign EDITOR or VIEWER.' }, 400)
    }

    const { data: target, error: targetError } = await serviceClient
      .from('profiles')
      .select('id, role')
      .eq('id', targetUserId)
      .eq('business_id', actorProfile.business_id)
      .single()

    if (targetError || !target || target.role === 'ADMIN') {
      return jsonResponse({ error: 'That team member cannot be changed from this screen.' }, 404)
    }

    const { error: updateError } = await serviceClient
      .from('profiles')
      .update({ role })
      .eq('id', targetUserId)
      .eq('business_id', actorProfile.business_id)

    if (updateError) {
      return jsonResponse({ error: updateError.message }, 500)
    }

    const { error: auditError } = await serviceClient.from('audit_logs').insert({
      business_id: actorProfile.business_id,
      actor_user_id: actor.id,
      action: 'team.role_changed',
      entity_table: 'profiles',
      entity_id: targetUserId,
      metadata: { previous_role: target.role, role },
    })

    return jsonResponse({ ok: true, auditLogged: !auditError })
  }

  return jsonResponse({ error: 'Unknown team management action.' }, 400)
})
