import { Routes, Route, Navigate } from 'react-router-dom'
import { useWallet } from '@solana/wallet-adapter-react'
import Landing from './pages/Landing'
import Dashboard from './pages/Dashboard'

function ProtectedRoute({ children }) {
  const { connected } = useWallet()
  return connected ? children : <Navigate to="/" replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      } />
    </Routes>
  )
}
