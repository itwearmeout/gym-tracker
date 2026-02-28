import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/context/useAuth'

const navItems = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/exercises', label: 'Training' },
  { to: '/progression', label: 'Progression' },
]

export function AppShell() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  async function handleLogout(): Promise<void> {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-black text-white [font-family:'Space_Grotesk',sans-serif]">
      <div className="mx-auto grid min-h-screen max-w-6xl grid-rows-[auto,1fr] px-4 pb-6 pt-4 md:grid-cols-[220px,1fr] md:grid-rows-1 md:gap-6 md:px-6 md:py-6">
        <header className="mb-6 border border-zinc-800 bg-zinc-950/70 p-4 md:mb-0 md:sticky md:top-6 md:h-fit">
          <p className="text-xs tracking-[0.28em] uppercase text-zinc-500">Gym Tracker</p>
          <p className="mt-3 text-sm text-zinc-300">{user?.email}</p>

          <nav className="mt-6 grid gap-2">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `border px-3 py-2 text-xs tracking-[0.2em] uppercase transition ${
                    isActive
                      ? 'border-white bg-white text-black'
                      : 'border-zinc-800 bg-black text-zinc-300 hover:border-zinc-500 hover:text-white'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <button
            type="button"
            className="mt-8 w-full border border-zinc-700 px-3 py-2 text-xs tracking-[0.2em] uppercase text-zinc-200 transition hover:border-white hover:bg-white hover:text-black"
            onClick={handleLogout}
          >
            Logout
          </button>
        </header>

        <main className="border border-zinc-900 bg-zinc-950/40 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
