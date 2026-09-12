import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Duplex } from 'node:stream'
import type { AuthService } from './auth-service.ts'

function cookies(request: IncomingMessage): Record<string, string> {
  return Object.fromEntries((request.headers.cookie ?? '').split(';').map((part) => part.trim().split('=' as string, 2)).filter(([key, value]) => key && value))
}

function corsHeaders(request: IncomingMessage): Record<string, string> {
  const origin = request.headers.origin
  if (origin === 'tauri://localhost' || origin === 'http://tauri.localhost' || origin === 'http://localhost:1420') {
    return {
      'access-control-allow-origin': origin,
      'access-control-allow-credentials': 'true',
      'access-control-allow-headers': 'content-type, authorization',
      'access-control-allow-methods': 'GET, POST, OPTIONS',
      vary: 'Origin',
    }
  }
  return {}
}

export function authenticateRequest(request: IncomingMessage, service: AuthService): string {
  const bearer = request.headers.authorization?.match(/^Bearer\s+(.+)$/i)?.[1]
  const token = bearer ?? cookies(request).dsh_access
  if (!token) throw new Error('missing credentials')
  return service.tokens.authenticate(token)
}

export function handleAuthRequest(request: IncomingMessage, response: ServerResponse, service: AuthService): boolean {
  if (request.url === '/auth/status' && request.method === 'GET') {
    let authenticated = false
    try { authenticateRequest(request, service); authenticated = true } catch { /* anonymous status is valid */ }
    response.writeHead(200, { 'content-type': 'application/json' })
    response.end(JSON.stringify({ authenticated }))
    return true
  }
  return false
}

async function readJson(request: IncomingMessage): Promise<Record<string, unknown>> {
  const chunks: Buffer[] = []
  let size = 0
  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk))
    size += buffer.length
    if (size > 16 * 1024) throw new Error('request body too large')
    chunks.push(buffer)
  }
  const value: unknown = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')
  if (typeof value !== 'object' || value === null) throw new Error('invalid JSON body')
  return value as Record<string, unknown>
}

function json(response: ServerResponse, status: number, value: unknown, headers: Record<string, string | string[]> = {}): void {
  response.writeHead(status, { 'content-type': 'application/json; charset=utf-8', ...headers })
  response.end(JSON.stringify(value))
}

export function createAuthRoute(path: '/auth/login' | '/auth/refresh' | '/auth/logout', service: AuthService) {
  return async (request: IncomingMessage, response: ServerResponse): Promise<void> => {
    try {
      const cors = corsHeaders(request)
      if (request.method === 'OPTIONS') { response.writeHead(204, cors); response.end(); return }
      if (path === '/auth/login' && request.method === 'GET') {
        response.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store', ...cors })
        response.end(`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>dsh sign in</title><style>body{font:16px system-ui;display:grid;place-items:center;min-height:100vh;margin:0;background:#f5f5f5}form{display:grid;gap:14px;width:min(360px,calc(100vw - 48px));padding:28px;background:white;border-radius:16px;box-shadow:0 12px 40px #0002}input,button{font:inherit;padding:12px;border-radius:8px;border:1px solid #ccc}button{cursor:pointer;background:#111;color:white}p{color:#b42318;min-height:1.4em}</style></head><body><form><h1>Sign in to dsh</h1><input name="username" autocomplete="username" placeholder="Username" required><input name="password" type="password" autocomplete="current-password" placeholder="Password" required><button>Sign in</button><p role="alert"></p></form><script>document.querySelector('form').addEventListener('submit',async(e)=>{e.preventDefault();const f=new FormData(e.currentTarget);const r=await fetch('/auth/login',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({username:f.get('username'),password:f.get('password')})});if(r.ok)location.replace('/');else document.querySelector('[role=alert]').textContent='Invalid username or password';});</script></body></html>`)
        return
      }
      if (request.method !== 'POST') { json(response, 405, { error: 'method_not_allowed' }); return }
      const body = await readJson(request)
      if (path === '/auth/login') {
        const pair = service.login(String(body.username ?? ''), String(body.password ?? ''))
        json(response, 200, pair, { ...cors, 'set-cookie': [`dsh_access=${pair.accessToken}; HttpOnly; SameSite=Lax; Path=/`, `dsh_refresh=${pair.refreshToken}; HttpOnly; SameSite=Lax; Path=/auth`] })
        return
      }
      const refresh = String(body.refreshToken ?? request.headers.cookie?.match(/(?:^|;\s*)dsh_refresh=([^;]+)/)?.[1] ?? '')
      if (!refresh) { json(response, 401, { error: 'unauthorized' }, cors); return }
      if (path === '/auth/refresh') {
        const pair = service.refresh(refresh)
        json(response, 200, pair, { ...cors, 'set-cookie': [`dsh_access=${pair.accessToken}; HttpOnly; SameSite=Lax; Path=/`, `dsh_refresh=${pair.refreshToken}; HttpOnly; SameSite=Lax; Path=/auth`] })
      } else {
        service.logout(refresh)
        json(response, 200, { ok: true }, { ...cors, 'set-cookie': ['dsh_access=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0', 'dsh_refresh=; HttpOnly; SameSite=Lax; Path=/auth; Max-Age=0'] })
      }
    } catch {
      json(response, 401, { error: 'invalid_credentials' }, corsHeaders(request))
    }
  }
}

export function guardUpgrade(request: IncomingMessage, service: AuthService): boolean {
  try { authenticateRequest(request, service); return true } catch { return false }
}

export function writeUnauthorized(response: ServerResponse, redirect = false): void {
  if (redirect) { response.writeHead(302, { location: '/auth/login' }); response.end(); return }
  response.writeHead(401, { 'content-type': 'application/json' }); response.end(JSON.stringify({ error: 'unauthorized' }))
}

export function createHttpGuard(service: AuthService): (request: IncomingMessage, response: ServerResponse, next: () => void | Promise<void>) => void | Promise<void> {
  return (request, response, next) => {
    if (request.url?.startsWith('/auth/')) return next()
    if (handleAuthRequest(request, response, service)) return
    try { authenticateRequest(request, service); return next() } catch {
      const acceptsHtml = request.headers.accept?.includes('text/html') === true
      writeUnauthorized(response, acceptsHtml && request.method === 'GET')
    }
  }
}

export function createUpgradeGuard(service: AuthService): (request: IncomingMessage, socket: Duplex, head: Buffer, next: () => void | Promise<void>) => void | Promise<void> {
  return (request, socket, head, next) => {
    try { authenticateRequest(request, service); return next() } catch {
      socket.write('HTTP/1.1 401 Unauthorized\r\nConnection: close\r\n\r\n')
      socket.destroy()
    }
  }
}
