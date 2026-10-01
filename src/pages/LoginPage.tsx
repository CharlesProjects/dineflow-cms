import { type FormEvent, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { isSupabaseConfigured } from '../lib/supabase'

export function LoginPage() {
  const { signIn, resetPassword, user } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [infoMessage, setInfoMessage] = useState('')

  if (user) {
    return <Navigate to="/dashboard" replace />
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setErrorMessage('')
    setInfoMessage('')

    if (!isSupabaseConfigured) {
      setErrorMessage('Add your Supabase credentials to .env before enabling sign in.')
      return
    }

    if (!email || !password) {
      setErrorMessage('Both email and password are required.')
      return
    }

    setIsSubmitting(true)

    const { error } = await signIn(email.trim(), password)

    if (error) {
      setErrorMessage(error.message)
      setIsSubmitting(false)
      return
    }

    setIsSubmitting(false)
    setInfoMessage('Signed in successfully.')
  }

  const handlePasswordReset = async () => {
    setErrorMessage('')
    setInfoMessage('')

    if (!email.trim()) {
      setErrorMessage('Enter your email address first to receive the reset email.')
      return
    }

    const { error } = await resetPassword(email.trim())

    if (error) {
      setErrorMessage(error.message)
      return
    }

    setInfoMessage('Password reset instructions have been sent if the account exists.')
  }

  return (
    <div className="min-h-screen bg-[#f4f3ed] lg:grid lg:grid-cols-[1.05fr_0.95fr]">
      <section className="relative flex min-h-[230px] items-end overflow-hidden bg-[#252720] px-6 py-8 sm:min-h-[300px] sm:px-10 lg:min-h-screen lg:px-14 lg:py-14">
        <img
          src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1800&q=85"
          alt="An intimate restaurant table set for dinner"
          className="absolute inset-0 h-full w-full object-cover opacity-70"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1c1e18]/90 via-[#1c1e18]/25 to-transparent" />
        <div className="relative z-10 max-w-xl text-white">
          <Link to="/" className="inline-flex items-center gap-3 text-sm font-medium text-white/80 hover:text-white"><span aria-hidden="true">←</span> Back to the restaurant</Link>
          <p className="mt-10 text-xs font-semibold uppercase tracking-[0.22em] text-[#edc9a7] lg:mt-16">DineFlow · Restaurant CMS</p>
          <h1 className="font-display mt-3 text-4xl leading-tight sm:text-5xl">A little care behind every detail.</h1>
          <p className="mt-4 max-w-md text-sm leading-6 text-white/75">Manage your restaurant's public presence from one considered workspace.</p>
        </div>
      </section>

      <section className="flex items-center justify-center px-5 py-12 sm:px-8 lg:px-12">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <Link to="/" className="inline-flex items-center gap-3 text-sm font-semibold text-[#252720]">
              <span className="flex h-9 w-9 items-center justify-center rounded-md bg-[#a84f35] font-display text-lg text-white">D</span>
              DineFlow
            </Link>
            <p className="mt-9 text-xs font-semibold uppercase tracking-[0.2em] text-[#a84f35]">Secure team access</p>
            <h2 className="font-display mt-2 text-4xl text-[#252720]">Welcome back</h2>
            <p className="mt-2 text-sm text-[#74756c]">Sign in to manage your restaurant content.</p>
          </div>

        {!isSupabaseConfigured && (
          <div role="status" className="mb-4 rounded-md border border-[#e8c98f] bg-[#fbf4e7] px-3 py-3 text-sm text-[#725529]">
            Supabase environment variables are missing. Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY before sign-in is enabled.
          </div>
        )}

        {errorMessage && (
          <div role="alert" className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
            {errorMessage}
          </div>
        )}

        {infoMessage && (
          <div role="status" className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-700">
            {infoMessage}
          </div>
        )}

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-medium text-stone-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="cms-control mt-1.5"
              placeholder="manager@savoria.demo"
              disabled={!isSupabaseConfigured}
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-2 block text-sm font-medium text-stone-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="cms-control mt-1.5"
              placeholder="••••••••"
              disabled={!isSupabaseConfigured}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !isSupabaseConfigured}
            className="cms-button-primary w-full disabled:cursor-not-allowed disabled:border-stone-300 disabled:bg-stone-300"
          >
            {isSubmitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-4 text-sm text-[#74756c]">
          <button type="button" onClick={handlePasswordReset} className="font-semibold text-[#813a28] hover:underline">
            Reset password
          </button>
          <span>Protected access</span>
        </div>
        <p className="mt-10 border-t border-[#e7e4db] pt-5 text-xs leading-5 text-[#85857b]">Authorized restaurant team members only. Access is secured through Supabase authentication.</p>
        </div>
      </section>
    </div>
  )
}
