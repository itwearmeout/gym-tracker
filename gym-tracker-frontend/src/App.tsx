import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './features/auth/context/AuthContext'
import Dashboard from './pages/Dashboard'
import Exercises from './pages/Exercises'
import Login from './pages/Login'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/exercises" element={<Exercises />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
