import { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'

function App() {
  const [url, setUrl] = useState(() => localStorage.getItem('dsh.server.url') ?? '')
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState('')

  function openServer(): void {
    try {
      const parsed = new URL(url)
      if (!/^https?:$/.test(parsed.protocol)) throw new Error()
      const normalized = parsed.href.replace(/\/$/, '')
      localStorage.setItem('dsh.server.url', normalized)
      setUrl(normalized)
      setConnected(true)
    } catch {
      setError('Enter a valid http(s) address')
    }
  }

  if (connected) return <div className="app-shell"><header><strong>dsh client</strong><span>{url}</span><button onClick={() => setConnected(false)}>Change server</button><button onClick={async () => { await fetch(`${url}/auth/logout`, { method: 'POST', credentials: 'include' }); setConnected(false) }}>Sign out</button></header><iframe title="dsh web" src={`${url}/auth/login`} /></div>
  return <main><h1>dsh client</h1><label>Server address<input value={url} onChange={event => setUrl(event.target.value)} placeholder="https://dsh.example.com" /></label><button onClick={openServer}>Connect</button><p role="alert">{error}</p></main>
}

createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>)
