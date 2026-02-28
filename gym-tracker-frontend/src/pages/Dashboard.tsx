import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../features/auth/context/AuthContext'
import { apiFetch } from '../utils/api'

export default function Dashboard() {
  const { user, isAuthenticated, logout } = useAuth()
  const navigate = useNavigate()
  const [rawData, setRawData] = useState<any>(null)

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login')
    }
  }, [isAuthenticated, navigate])

  const handleFetchMe = async () => {
    const data = await apiFetch('/api/users/me')
    setRawData(data)
  }

  return (
    <div>
      <div>User email: {user?.email}</div>
      <div>
        <button onClick={logout}>Logout</button>
        <button onClick={handleFetchMe}>Fetch Profile</button>
      </div>
      {rawData && <pre>{JSON.stringify(rawData, null, 2)}</pre>}
    </div>
  )
}
