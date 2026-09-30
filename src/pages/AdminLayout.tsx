import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../context/useAuth'

const navItems = [
  { label: 'Overview', to: '/dashboard' },
  { label: 'Settings', to: '/dashboard/settings' },
  { label: 'Menu', to: '/dashboard/menu' },
  { label: 'Hours', to: '/dashboard/hours' },
  { label: 'Reservations', to: '/dashboard/reservations' },
  { label: 'Gallery', to: '/dashboard/gallery' },
  { label: 'Users', to: '/dashboard/users' },
  { label: 'Audit Log', to: '/dashboard/audit' },
]

export function AdminLayout() {
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-stone-100 text-stone-900">
      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <aside className="hidden w-72 shrink-0 rounded-[2rem] border border-stone-200 bg-stone-900 p-5 text-stone-50 shadow-sm lg:block">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-400 text-sm font-bold text-stone-950">
              S
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.28em] text-stone-400">Demo</p>
              <h1 className="text-lg font-semibold">Savoria CMS</h1>
            </div>
          </div>

          <nav className="space-y-2">
            {navItems.map(({ label, to }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `block rounded-2xl px-3 py-2.5 text-sm font-medium transition ${
                    isActive
                      ? 'bg-amber-400 text-stone-950'
                      : 'text-stone-200 hover:bg-stone-800 hover:text-white'
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>
        </aside>

        <div className="flex-1">
          <header className="mb-6 rounded-[2rem] border border-stone-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-stone-500">Admin workspace</p>
                <h2 className="mt-2 text-2xl font-semibold text-stone-900">Restaurant management</h2>
              </div>

              <div className="flex items-center gap-3 rounded-full border border-stone-200 bg-stone-50 px-3 py-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-stone-900 text-sm font-semibold text-white">
                  {user?.email?.slice(0, 1).toUpperCase() ?? 'U'}
                </div>
                <div>
                  <p className="text-sm font-medium text-stone-800">{user?.email ?? 'Authenticated user'}</p>
                  <p className="text-xs text-stone-500">ADMIN</p>
                </div>
              </div>
            </div>
          </header>

          <Outlet />
        </div>
      </div>
    </div>
  )
}
