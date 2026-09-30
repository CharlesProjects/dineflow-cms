import { useState } from 'react'
import { useAuth } from '../context/useAuth'

export function DashboardPage() {
  const { user, signOut } = useAuth()
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const handleSignOut = async () => {
    setErrorMessage('')
    setIsSigningOut(true)

    const { error } = await signOut()

    if (error) {
      setErrorMessage(error.message)
      setIsSigningOut(false)
      return
    }

    setIsSigningOut(false)
  }

  return (
    <div className="min-h-screen bg-stone-100 px-4 py-10 text-stone-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-col gap-4 rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-stone-500">CMS dashboard</p>
            <h1 className="mt-3 text-3xl font-semibold">Restaurant operations</h1>
          </div>

          <button
            type="button"
            onClick={handleSignOut}
            disabled={isSigningOut}
            className="rounded-full bg-stone-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-stone-700 disabled:cursor-not-allowed disabled:bg-stone-300"
          >
            {isSigningOut ? 'Signing out…' : 'Sign out'}
          </button>
        </div>

        {errorMessage && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </div>
        )}

        <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
            <p className="text-sm uppercase tracking-[0.2em] text-stone-500">Session</p>
            <p className="mt-3 text-2xl font-semibold">Active</p>
            <p className="mt-2 text-sm text-stone-600">Authenticated session is available.</p>
          </div>

          <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
            <p className="text-sm uppercase tracking-[0.2em] text-stone-500">User</p>
            <p className="mt-3 text-lg font-semibold">{user?.email ?? 'Authenticated user'}</p>
            <p className="mt-2 text-sm text-stone-600">Supabase Auth identity is ready for dashboard access.</p>
          </div>

          <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm md:col-span-2 xl:col-span-1">
            <p className="text-sm uppercase tracking-[0.2em] text-stone-500">Status</p>
            <p className="mt-3 text-2xl font-semibold">Protected</p>
            <p className="mt-2 text-sm text-stone-600">This route is guarded by the auth session.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
