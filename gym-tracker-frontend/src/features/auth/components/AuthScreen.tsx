import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { ApiError } from '../../../utils/api'

type AuthMode = 'login' | 'register'

export function AuthScreen() {
  const { login, register, isAuthenticated, isBootstrapping } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState<AuthMode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isBootstrapping && isAuthenticated) {
      navigate('/dashboard', { replace: true })
    }
  }, [isAuthenticated, isBootstrapping, navigate])

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      if (mode === 'login') {
        await login({ email, password })
      } else {
        await register({ email, password })
      }
      navigate('/dashboard', { replace: true })
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError('Unexpected error. Please try again.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-black px-6 py-12 text-white [font-family:'Space_Grotesk',sans-serif]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.14),transparent_55%)]" />

      <main className="relative z-10 w-full max-w-md border border-zinc-800 bg-zinc-950/80 p-8 backdrop-blur-sm">
        <p className="mb-2 text-xs tracking-[0.3em] uppercase text-zinc-500">Gym Tracker</p>
        <h1 className="mb-8 text-3xl tracking-tight">Train with intent</h1>

        <div className="mb-8 grid grid-cols-2 gap-2 border border-zinc-800 p-1">
          <button
            type="button"
            className={`px-4 py-2 text-xs tracking-[0.2em] uppercase transition ${
              mode === 'login' ? 'bg-white text-black' : 'bg-transparent text-zinc-400'
            }`}
            onClick={() => setMode('login')}
          >
            Login
          </button>
          <button
            type="button"
            className={`px-4 py-2 text-xs tracking-[0.2em] uppercase transition ${
              mode === 'register' ? 'bg-white text-black' : 'bg-transparent text-zinc-400'
            }`}
            onClick={() => setMode('register')}
          >
            Register
          </button>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="block space-y-2 text-sm text-zinc-300">
            <span>Email</span>
            <input
              required
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full border border-zinc-700 bg-black px-3 py-2 text-sm text-white outline-none transition focus:border-white"
            />
          </label>

          <label className="block space-y-2 text-sm text-zinc-300">
            <span>Password</span>
            <input
              required
              minLength={mode === 'register' ? 8 : 1}
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full border border-zinc-700 bg-black px-3 py-2 text-sm text-white outline-none transition focus:border-white"
            />
          </label>

          {error && <p className="text-sm text-zinc-200">{error}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full border border-white bg-white px-4 py-3 text-xs tracking-[0.24em] uppercase text-black transition hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? 'Please wait...' : mode === 'login' ? 'Login' : 'Create account'}
          </button>
        </form>
      </main>
    </div>
  )
}
