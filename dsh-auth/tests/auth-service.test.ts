import { describe, expect, it } from 'vitest'
import { loadConfig } from '../src/config.ts'
import { AuthService } from '../src/auth-service.ts'
import { hashPassword } from '../src/password.ts'

const config = loadConfig({ DSH_AUTH_USERNAME: 'admin', DSH_AUTH_PASSWORD: 'secret', DSH_AUTH_TOKEN_SECRET: 'test-secret', DSH_AUTH_ACCESS_TOKEN_TTL: '1h', DSH_AUTH_REFRESH_TOKEN_TTL: '2h' })

describe('AuthService', () => {
  it('logs in and rotates refresh tokens', () => {
    const service = new AuthService(config, hashPassword('secret'))
    const first = service.login('admin', 'secret')
    expect(service.tokens.authenticate(first.accessToken)).toBeTypeOf('string')
    const second = service.refresh(first.refreshToken)
    expect(second.refreshToken).not.toBe(first.refreshToken)
    expect(() => service.refresh(first.refreshToken)).toThrow('invalid')
  })
  it('rejects invalid credentials and revoked access tokens', () => {
    const service = new AuthService(config, hashPassword('secret'))
    expect(() => service.login('admin', 'wrong')).toThrow('invalid credentials')
    const pair = service.login('admin', 'secret'); service.logout(pair.accessToken)
    expect(() => service.tokens.authenticate(pair.accessToken)).toThrow('invalid')
  })
})
