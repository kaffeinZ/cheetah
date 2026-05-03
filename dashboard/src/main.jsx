import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom'
import { SolflareWalletAdapter } from '@solana/wallet-adapter-solflare'
import { SolanaMobileWalletAdapter } from '@solana-mobile/wallet-adapter-mobile'
import '@solana/wallet-adapter-react-ui/styles.css'
import './index.css'
import App from './App.jsx'

const isMobile = typeof navigator !== 'undefined' && /Android|iPhone|iPad/i.test(navigator.userAgent)

const wallets = [
  ...(isMobile ? [new SolanaMobileWalletAdapter({
    appIdentity: { name: 'Vrynn', uri: 'https://vrynn.xyz', icon: '/favicon.ico' },
    cluster: 'mainnet-beta',
  })] : []),
  new PhantomWalletAdapter(),
  new SolflareWalletAdapter(),
]
const endpoint = 'https://api.mainnet-beta.solana.com'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  </StrictMode>
)
