import { useWallet } from '@solana/wallet-adapter-react'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import ConnectWallet from '../components/ConnectWallet'

export default function Landing() {
  const { connected } = useWallet()
  const navigate = useNavigate()

  function handleAuth(authData) {
    localStorage.setItem('cheetahfi_auth', JSON.stringify(authData))
    navigate('/dashboard')
  }

  useEffect(() => {
    if (connected && localStorage.getItem('cheetahfi_auth')) {
      navigate('/dashboard')
    }
  }, [connected])

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-6">
      <h1 className="text-5xl font-bold text-white">CheetahFi 🐆</h1>
      <p className="text-zinc-400 text-lg">Real-time Solana lending alerts</p>
      <ConnectWallet onAuth={handleAuth} />
    </div>
  )
}
