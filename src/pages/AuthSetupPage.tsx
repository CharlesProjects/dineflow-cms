import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { isSupabaseConfigured, supabase } from '../lib/supabase'

export function AuthSetupPage() {
  const navigate = useNavigate()
  const [isCheckingSession, setIsCheckingSession] = useState(isSupabaseConfigured)
  const [hasSession, setHasSession] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    if (!isSupabaseConfigured) {
      return
    }

    let isActive = true
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (isActive && session) {
        setHasSession(true)
        setIsCheckingSession(false)
      }
    })

    supabase.auth.getSession().then(({ data, error }) => {
      if (!isActive) return
      setHasSession(Boolean(data.session))
      setIsCheckingSession(false)
      if (error) setErrorMessage(error.message)
    })

    return () => {
      isActive = false
      authListener.subscription.unsubscribe()
    }
  }, [])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrorMessage('')

    if (password.length < 8) {
      setErrorMessage('Use a password with at least 8 characters.')
      return
    }
    if (password !== confirmPassword) {
      setErrorMessage('The passwords do not match.')
      return
    }
    if (!hasSession) {
      setErrorMessage('This invitation or recovery link is no longer active. Request a new link and try again.')
      return
    }

    setIsSubmitting(true)
    const { error } = await supabase.auth.updateUser({ password })
    setIsSubmitting(false)

    if (error) {
      setErrorMessage(error.message)
      return
    }

    navigate('/dashboard', { replace: true })
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f4f3ed] px-5 py-12">
      <section className="cms-panel w-full max-w-md p-6 sm:p-8">
        <Link to="/" className="inline-flex items-center gap-3 text-sm font-semibold text-[#252720]">
          <span className="flex h-9 w-9 items-center justify-center rounded-md bg-[#a84f35] font-display text-lg text-white">D</span>
          DineFlow
        </Link>

        <p className="mt-9 text-xs font-semibold uppercase tracking-[0.2em] text-[#a84f35]">Secure account setup</p>
        <h1 className="font-display mt-2 text-4xl text-[#252720]">Create your password</h1>
        <p className="mt-2 text-sm leading-6 text-[#74756c]">Set a password for your invited restaurant account. You’ll use it to sign in next time.</p>

        {isCheckingSession && <p role="status" className="mt-6 text-sm text-[#74756c]">Verifying your secure link…</p>}

        {!isCheckingSession && !isSupabaseConfigured && (
          <p role="alert" className="mt-6 rounded-md border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">Supabase is not configured for this site.</p>
        )}

        {!isCheckingSession && isSupabaseConfigured && !hasSession && (
          <div className="mt-6 rounded-md border border-[#e8c98f] bg-[#fbf4e7] px-3 py-3 text-sm leading-6 text-[#725529]">
            This invitation or recovery link is expired or has already been used. Ask your restaurant administrator to send a new invitation.
            <Link to="/login" className="mt-2 block font-semibold text-[#813a28] underline">Go to sign in</Link>
          </div>
        )}

        {!isCheckingSession && hasSession && (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <label className="block text-sm font-medium text-[#53544d]">New password
              <input type="password" autoComplete="new-password" minLength={8} required value={password} onChange={(event) => setPassword(event.target.value)} className="cms-control mt-1.5" disabled={isSubmitting} />
            </label>
            <label className="block text-sm font-medium text-[#53544d]">Confirm password
              <input type="password" autoComplete="new-password" minLength={8} required value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="cms-control mt-1.5" disabled={isSubmitting} />
            </label>

            {errorMessage && <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">{errorMessage}</p>}

            <button type="submit" disabled={isSubmitting} className="cms-button-primary w-full disabled:cursor-not-allowed disabled:bg-stone-300">
              {isSubmitting ? 'Saving password…' : 'Save password and continue'}
            </button>
          </form>
        )}
      </section>
    </main>
  )
}
