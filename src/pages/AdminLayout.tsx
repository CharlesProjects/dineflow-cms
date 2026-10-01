import { Link, NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../context/useAuth'

const navItems = [
  { label: 'Overview', to: '/dashboard', index: true },
  { label: 'Business settings', to: '/dashboard/settings' },
  { label: 'Menu', to: '/dashboard/menu' },
  { label: 'Opening hours', to: '/dashboard/hours' },
  { label: 'Reservations', to: '/dashboard/reservations' },
  { label: 'Gallery', to: '/dashboard/gallery' },
  { label: 'Team', to: '/dashboard/users' },
  { label: 'Audit log', to: '/dashboard/audit' },
]

export function AdminLayout() {
  const { user } = useAuth()
  const navigation = (mobile = false) => navItems.map(({ label, to, index }) => (
    <NavLink
      key={to}
      to={to}
      end={index}
      className={({ isActive }) =>
        `${mobile ? 'shrink-0 whitespace-nowrap px-3.5 py-2.5' : 'px-3 py-2.5'} block rounded-md text-sm font-medium transition ${
          isActive
            ? mobile
              ? 'bg-[#252720] text-white'
              : 'bg-[#414438] text-white'
            : mobile
              ? 'text-[#62635c] hover:bg-[#eeece3] hover:text-[#252720]'
              : 'text-white/70 hover:bg-white/10 hover:text-white'
        }`
      }
    >
      {label}
    </NavLink>
  ))

  return (
    <div className="min-h-screen bg-[#f4f3ed] text-[#252720] lg:flex">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col bg-[#252720] px-4 py-6 text-white lg:flex">
        <Link to="/dashboard" className="mb-9 flex items-center gap-3 px-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-md bg-[#b75d3e] font-display text-lg text-white">D</span>
          <span>
            <span className="block text-[10px] font-semibold uppercase tracking-[0.2em] text-white/50">Restaurant workspace</span>
            <span className="font-display text-xl">DineFlow</span>
          </span>
        </Link>

        <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">Manage</p>
        <nav aria-label="Admin navigation" className="space-y-1">{navigation()}</nav>

        <div className="mt-auto border-t border-white/10 pt-4">
          <a href="/" className="flex items-center justify-between rounded-md px-3 py-2.5 text-sm text-white/70 transition hover:bg-white/10 hover:text-white">
            View public website <span aria-hidden="true">↗</span>
          </a>
          <p className="mt-4 px-3 text-xs text-white/35">Restaurant content management</p>
        </div>
      </aside>

      <div className="min-w-0 flex-1 lg:pl-64">
        <header className="sticky top-0 z-30 border-b border-[#e7e4db] bg-[#fbfaf6]/95 backdrop-blur-sm">
          <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-4 px-4 py-3.5 sm:px-7 lg:px-10">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#85857b]">Restaurant workspace</p>
              <h1 className="mt-0.5 truncate text-lg font-semibold sm:text-xl">Content management</h1>
            </div>
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#d9d8cc] text-sm font-semibold text-[#414438]">
                {user?.email?.slice(0, 1).toUpperCase() ?? 'U'}
              </div>
              <div className="hidden min-w-0 sm:block">
                <p className="max-w-56 truncate text-sm font-medium">{user?.email ?? 'Authenticated user'}</p>
                <p className="text-xs text-[#85857b]">Signed in</p>
              </div>
            </div>
          </div>
          <nav aria-label="Mobile admin navigation" className="flex gap-1 overflow-x-auto border-t border-[#e7e4db] px-4 py-2.5 lg:hidden">
            {navigation(true)}
          </nav>
        </header>

        <main className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-7 sm:py-8 lg:px-10 lg:py-10">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
