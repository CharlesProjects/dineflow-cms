import { type FormEvent, useState } from 'react'
import { Navigate } from 'react-router-dom'
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
    <div className="flex min-h-screen items-center justify-center bg-stone-100 px-4 py-12">
      <div className="w-full max-w-md rounded-[2rem] border border-stone-200 bg-white p-6 shadow-lg sm:p-8">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-400 text-lg font-bold text-stone-950">
            S
          </div>
          <p className="text-xs uppercase tracking-[0.27em] text-stone-500">Savoria CMS</p>
          <h1 className="mt-3 text-3xl font-semibold text-stone-900">Welcome back</h1>
        </div>

        {!isSupabaseConfigured && (
          <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            Supabase environment variables are missing. Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY before sign-in is enabled.
          </div>
        )}

        {errorMessage && (
          <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {errorMessage}
          </div>
        )}

        {infoMessage && (
          <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {infoMessage}
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
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
              className="w-full rounded-2xl border border-stone-300 bg-stone-50 px-3 py-2.5 text-stone-900 outline-none transition focus:border-stone-500 focus:ring-2 focus:ring-amber-200"
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
              className="w-full rounded-2xl border border-stone-300 bg-stone-50 px-3 py-2.5 text-stone-900 outline-none transition focus:border-stone-500 focus:ring-2 focus:ring-amber-200"
              placeholder="••••••••"
              disabled={!isSupabaseConfigured}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !isSupabaseConfigured}
            className="w-full rounded-2xl bg-stone-900 px-4 py-3 font-medium text-white transition hover:bg-stone-700 disabled:cursor-not-allowed disabled:bg-stone-300"
          >
            {isSubmitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <div className="mt-5 flex items-center justify-between gap-4 text-sm text-stone-600">
          <button type="button" onClick={handlePasswordReset} className="font-medium text-amber-700 hover:text-amber-800">
            Reset password
          </button>
          <span>Protected CMS access</span>
        </div>
      </div>
    </div>
  )
}
