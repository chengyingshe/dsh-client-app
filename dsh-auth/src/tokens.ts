import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto'

export interface TokenSession { readonly id: string; readonly expiresAt: number; revoked: boolean }
export interface TokenPair { readonly accessToken: string; readonly refreshToken: string; readonly accessExpiresAt: number; readonly refreshExpiresAt: number }

export class TokenStore {
  private readonly sessions = new Map<string, TokenSession>()
  private readonly secret: string
  private readonly accessTtlMs: number
  private readonly refreshTtlMs: number
  private readonly now: () => number
  constructor(secret: string, accessTtlMs: number, refreshTtlMs: number, now = () => Date.now()) { this.secret = secret; this.accessTtlMs = accessTtlMs; this.refreshTtlMs = refreshTtlMs; this.now = now }
  issue(): TokenPair {
    const id = randomBytes(18).toString('hex'); const issuedAt = this.now(); const session = { id, expiresAt: issuedAt + this.refreshTtlMs, revoked: false }
    this.sessions.set(id, session)
    return { accessToken: this.sign(id, issuedAt + this.accessTtlMs, 'a'), refreshToken: this.sign(id, session.expiresAt, 'r'), accessExpiresAt: issuedAt + this.accessTtlMs, refreshExpiresAt: session.expiresAt }
  }
  refresh(refreshToken: string): TokenPair {
    const payload = this.verify(refreshToken, 'r'); const session = this.sessions.get(payload.id)
    if (!session || session.revoked || session.expiresAt <= this.now()) throw new Error('invalid refresh token')
    session.revoked = true
    return this.issue()
  }
  revoke(token: string): void { const payload = this.verify(token, 'a', false); this.sessions.get(payload.id)!.revoked = true }
  revokeRefresh(token: string): void { const payload = this.verify(token, 'r', false); this.sessions.get(payload.id)!.revoked = true }
  authenticate(accessToken: string): string { const payload = this.verify(accessToken, 'a'); const session = this.sessions.get(payload.id); if (!session || session.revoked) throw new Error('invalid access token'); return payload.id }
  private sign(id: string, exp: number, kind: string): string { const body = `${kind}.${id}.${exp}`; return `${body}.${createHmac('sha256', this.secret).update(body).digest('base64url')}` }
  private verify(token: string, kind: string, checkExpiry = true): { id: string; exp: number } { const [tokenKind, id, expText, signature] = token.split('.'); const body = `${tokenKind}.${id}.${expText}`; const expected = createHmac('sha256', this.secret).update(body).digest('base64url'); if (tokenKind !== kind || !id || !signature || !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) throw new Error('invalid token'); const exp = Number(expText); if (!Number.isSafeInteger(exp) || (checkExpiry && exp <= this.now())) throw new Error('expired token'); return { id, exp } }
}
