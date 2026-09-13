import type { ServerConfig, TokenPair } from './models'
export class AuthClient {
  private accessToken: string | undefined
  constructor(private readonly server: ServerConfig, private readonly fetcher: typeof fetch = fetch) {}
  async login(username: string, password: string): Promise<TokenPair> { const response = await this.fetcher(`${this.server.url}/auth/login`, { method: 'POST', credentials: 'include', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ username, password }) }); if (!response.ok) throw new Error('invalid credentials'); const pair = await response.json() as TokenPair; this.accessToken = pair.accessToken; return pair }
  async logout(): Promise<void> { try { await this.request('/auth/logout', { method: 'POST' }) } finally { this.accessToken = undefined } }
  restoreAccessToken(token: string): void { this.accessToken = token }
  async request(path: string, init: RequestInit = {}): Promise<Response> { const headers = new Headers(init.headers); if (this.accessToken) headers.set('authorization', `Bearer ${this.accessToken}`); return this.fetcher(`${this.server.url}${path}`, { ...init, credentials: 'include', headers }) }
  setAccessToken(token: string): void { this.accessToken = token }
}
