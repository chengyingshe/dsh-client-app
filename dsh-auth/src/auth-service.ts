import type { AuthConfig } from './config.ts'
import { verifyPassword } from './password.ts'
import { TokenStore } from './tokens.ts'

export class AuthService {
  readonly tokens: TokenStore
  private readonly config: AuthConfig
  private readonly passwordHash: string
  constructor(config: AuthConfig, passwordHash: string, now?: () => number) { this.config = config; this.passwordHash = passwordHash; this.tokens = new TokenStore(config.tokenSecret, config.accessTokenTtlMs, config.refreshTokenTtlMs, now) }
  login(username: string, password: string) { if (username !== this.config.username || !verifyPassword(password, this.passwordHash)) throw new Error('invalid credentials'); return this.tokens.issue() }
  refresh(token: string) { return this.tokens.refresh(token) }
  logout(token: string) {
    try {
      this.tokens.revokeRefresh(token)
    } catch {
      this.tokens.revoke(token)
    }
  }
}
