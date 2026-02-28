import { useState, useEffect, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { login, register, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard')
    }
  }, [isAuthenticated, navigate])

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault()
    await login({ email, password })
  }

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault()
    await register({ email, password })
  }

  return (
    <div>
      <form>
        <div>
          <label>Email: <input type="email" value={email} onChange={e => setEmail(e.target.value)} /></label>
        </div>
        <div>
          <label>Password: <input type="password" value={password} onChange={e => setPassword(e.target.value)} /></label>
        </div>
        <div>
          <button onClick={handleLogin}>Login</button>
          <button type="button" onClick={handleRegister}>Register</button>
        </div>
      </form>
    </div>
  )
}
