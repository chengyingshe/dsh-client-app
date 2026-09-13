import { describe, expect, it } from 'vitest'
import { AuthService } from '../src/auth-service.ts'
import { loadConfig } from '../src/config.ts'
import { hashPassword } from '../src/password.ts'
import { guardUpgrade, authenticateRequest, createAuthRoute } from '../src/web-guard.ts'

const service = new AuthService(loadConfig({ DSH_AUTH_USERNAME: 'admin', DSH_AUTH_PASSWORD: 'secret', DSH_AUTH_TOKEN_SECRET: 'secret' }), hashPassword('secret'))
const pair = service.login('admin', 'secret')

describe('web guard', () => {
  it('authenticates bearer and cookie requests', () => {
    expect(authenticateRequest({ headers: { authorization: `Bearer ${pair.accessToken}` } } as any, service)).toBeTypeOf('string')
    expect(authenticateRequest({ headers: { cookie: `dsh_access=${pair.accessToken}` } } as any, service)).toBeTypeOf('string')
  })
  it('rejects unauthenticated websocket upgrades', () => {
    expect(guardUpgrade({ headers: {} } as any, service)).toBe(false)
  })
  it('allows Tauri CORS preflight and credentials', async () => {
    const headers: Record<string, unknown> = {}
    let status = 0
    const response = { writeHead(code: number, values: Record<string, unknown>) { status = code; Object.assign(headers, values) }, end() {} }
    await createAuthRoute('/auth/login', service)({ method: 'OPTIONS', headers: { origin: 'tauri://localhost' } } as any, response as any)
    expect(status).toBe(204)
    expect(headers['access-control-allow-origin']).toBe('tauri://localhost')
    expect(headers['access-control-allow-credentials']).toBe('true')
  })
})
