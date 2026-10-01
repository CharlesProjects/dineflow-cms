import { useEffect, useState, type FormEvent } from 'react'
import { useBusinessProfile } from '../context/useBusinessProfile'
import { fetchTeamProfiles } from '../lib/cms-api'
import { supabase } from '../lib/supabase'

type TeamMember = {
  id: string
  full_name: string
  email: string | null
  role: 'ADMIN' | 'EDITOR' | 'VIEWER'
  created_at: string
}

function getFunctionError(data: unknown) {
  if (data && typeof data === 'object' && 'error' in data && typeof data.error === 'string') {
    return data.error
  }
  return null
}

export function TeamPage() {
  const { profile, loading: profileLoading, error: profileError } = useBusinessProfile()
  const [members, setMembers] = useState<TeamMember[]>([])
  const [loadedBusinessId, setLoadedBusinessId] = useState<string | null>(null)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'EDITOR' | 'VIEWER'>('EDITOR')
  const [busyId, setBusyId] = useState<string | null>(null)
  const [isInviting, setIsInviting] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const isAdmin = profile?.role === 'ADMIN'
  const isLoading = profileLoading || Boolean(profile?.business_id && loadedBusinessId !== profile.business_id)

  useEffect(() => {
    if (!profile?.business_id) return

    let isActive = true
    fetchTeamProfiles(profile.business_id)
      .then((data) => {
        if (!isActive) return
        setMembers(data as TeamMember[])
        setErrorMessage('')
      })
      .catch((error: unknown) => {
        if (!isActive) return
        setErrorMessage(error instanceof Error ? error.message : 'Unable to load team members.')
      })
      .finally(() => {
        if (isActive) setLoadedBusinessId(profile.business_id)
      })

    return () => {
      isActive = false
    }
  }, [profile?.business_id])

  const refreshMembers = async (businessId: string) => {
    setMembers(await fetchTeamProfiles(businessId) as TeamMember[])
  }

  const invokeManageTeam = async (body: Record<string, string>) => {
    const { data, error } = await supabase.functions.invoke('manage-team', { body })
    if (error) throw error
    const functionError = getFunctionError(data)
    if (functionError) throw new Error(functionError)
    return data as { auditLogged?: boolean }
  }

  const handleInvite = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = event.currentTarget
    if (!isAdmin || !profile?.business_id) return

    setIsInviting(true)
    setErrorMessage('')
    setStatusMessage('')
    try {
      const result = await invokeManageTeam({
        action: 'invite',
        email: email.trim(),
        full_name: fullName.trim(),
        role: inviteRole,
      })
      form.reset()
      setFullName('')
      setEmail('')
      setInviteRole('EDITOR')
      await refreshMembers(profile.business_id)
      setStatusMessage(result.auditLogged === false ? 'Invitation sent, but the audit event could not be recorded.' : 'Invitation sent and team access recorded.')
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to invite this team member. Deploy the manage-team function and verify its secrets.')
    } finally {
      setIsInviting(false)
    }
  }

  const handleRoleChange = async (member: TeamMember, role: 'EDITOR' | 'VIEWER') => {
    if (!isAdmin || !profile?.business_id || role === member.role) return
    setBusyId(member.id)
    setErrorMessage('')
    setStatusMessage('')
    try {
      const result = await invokeManageTeam({ action: 'change_role', user_id: member.id, role })
      await refreshMembers(profile.business_id)
      setStatusMessage(result.auditLogged === false ? 'Role updated, but the audit event could not be recorded.' : 'Team role updated.')
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to update this team role.')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="space-y-6">
      <section>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#a84f35]">People and permissions</p>
        <h2 className="font-display mt-2 text-4xl">Team access</h2>
        <p className="mt-2 text-sm text-[#74756c]">Team identities are managed through Supabase Auth and linked to this restaurant profile.</p>
      </section>

      {profileError && <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">{profileError}</p>}
      {errorMessage && <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">{errorMessage}</p>}
      {statusMessage && <p role="status" className="text-sm font-medium text-[#526044]">{statusMessage}</p>}
      {profile && !isAdmin && <p role="status" className="rounded-md border border-[#e7e4db] bg-[#fbfaf6] px-3 py-2.5 text-sm text-[#62635c]">Only a restaurant ADMIN can invite team members or change roles.</p>}

      {isAdmin && (
        <form onSubmit={handleInvite} className="cms-panel grid gap-4 p-5 sm:p-7 md:grid-cols-[1fr_1fr_auto_auto] md:items-end">
          <label className="text-sm font-medium text-[#53544d]">Full name
            <input value={fullName} onChange={(event) => setFullName(event.target.value)} required maxLength={120} className="cms-control mt-1.5" disabled={isInviting} />
          </label>
          <label className="text-sm font-medium text-[#53544d]">Email address
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required maxLength={254} className="cms-control mt-1.5" disabled={isInviting} />
          </label>
          <label className="text-sm font-medium text-[#53544d]">Role
            <select value={inviteRole} onChange={(event) => setInviteRole(event.target.value as 'EDITOR' | 'VIEWER')} className="cms-control mt-1.5" disabled={isInviting}>
              <option value="EDITOR">Editor</option>
              <option value="VIEWER">Viewer</option>
            </select>
          </label>
          <button type="submit" disabled={isInviting || profileLoading} className="cms-button-primary disabled:cursor-not-allowed disabled:bg-stone-300">{isInviting ? 'Sending…' : 'Invite member'}</button>
        </form>
      )}

      <section className="cms-panel p-5 sm:p-7">
        <div className="flex items-center justify-between gap-4">
          <h3 className="text-sm font-semibold">Restaurant members</h3>
          <span className="text-xs text-[#85857b]">{members.length} profiles</span>
        </div>
        {isLoading ? <p role="status" className="mt-5 text-sm text-[#74756c]">Loading team…</p> : members.length === 0 ? (
          <div className="mt-5 rounded-md border border-dashed border-[#d9d7ce] px-5 py-10 text-center text-sm text-[#74756c]">No team profiles are associated with this restaurant.</div>
        ) : (
          <div className="mt-4 divide-y divide-[#e7e4db]">
            {members.map((member) => (
              <div key={member.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{member.full_name}</p>
                  <p className="truncate text-sm text-[#74756c]">{member.email ?? 'No email recorded'}</p>
                </div>
                {member.role === 'ADMIN' ? <span className="w-fit rounded-sm bg-[#252720] px-2.5 py-1 text-xs font-semibold text-white">ADMIN</span> : (
                  <label className="text-xs font-semibold text-[#62635c]">Access role
                    <select value={member.role} disabled={!isAdmin || busyId === member.id} onChange={(event) => void handleRoleChange(member, event.target.value as 'EDITOR' | 'VIEWER')} className="cms-control mt-1.5 min-w-36">
                      <option value="EDITOR">Editor</option>
                      <option value="VIEWER">Viewer</option>
                    </select>
                  </label>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
