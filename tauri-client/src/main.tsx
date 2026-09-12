import { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'

function App() {
  const [url, setUrl] = useState('')
  const [error, setError] = useState('')

  function openServer(): void {
    try {
      const parsed = new URL(url)
      if (!/^https?:$/.test(parsed.protocol)) throw new Error()
      window.location.assign(`${parsed.href.replace(/\/$/, '')}/auth/login`)
    } catch {
      setError('Enter a valid http(s) address')
    }
  }

  return <main>
    <h1>dsh client</h1>
    <label>Server address<input value={url} onChange={event => setUrl(event.target.value)} placeholder="https://dsh.example.com" /></label>
    <button onClick={openServer}>Continue</button>
    <p role="alert">{error}</p>
  </main>
}

createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>)
