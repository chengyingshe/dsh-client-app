import { describe, expect, it } from 'vitest'
import { loadConfig } from '../src/config.ts'

const complete = {
  DSH_AUTH_USERNAME: 'admin',
  DSH_AUTH_PASSWORD: 'password',
  DSH_AUTH_TOKEN_SECRET: 'secret',
}

describe('loadConfig', () => {
  for (const variable of ['DSH_AUTH_USERNAME', 'DSH_AUTH_PASSWORD', 'DSH_AUTH_TOKEN_SECRET']) {
    it(`rejects missing ${variable}`, () => {
      const env = { ...complete }
      delete env[variable as keyof typeof env]
      expect(() => loadConfig(env)).toThrow(variable)
    })
  }

  it('returns normalized authentication configuration', () => {
    expect(loadConfig({ ...complete, DSH_PUBLIC_URL: ' https://example.com/ ' })).toEqual({
      username: 'admin',
      password: 'password',
      tokenSecret: 'secret',
      accessTokenTtlMs: 900_000,
      refreshTokenTtlMs: 2_592_000_000,
      publicUrl: 'https://example.com/',
    })
  })

  it('parses TTL durations and public URL', () => {
    expect(loadConfig({ ...complete, DSH_AUTH_ACCESS_TOKEN_TTL: '20m', DSH_AUTH_REFRESH_TOKEN_TTL: '7d', DSH_PUBLIC_URL: 'https://public.example' })).toMatchObject({
      accessTokenTtlMs: 1_200_000,
      refreshTokenTtlMs: 604_800_000,
      publicUrl: 'https://public.example',
    })
  })

  it('rejects malformed and zero TTL values', () => {
    expect(() => loadConfig({ ...complete, DSH_AUTH_ACCESS_TOKEN_TTL: '0s' })).toThrow('DSH_AUTH_ACCESS_TOKEN_TTL')
    expect(() => loadConfig({ ...complete, DSH_AUTH_REFRESH_TOKEN_TTL: 'invalid' })).toThrow('DSH_AUTH_REFRESH_TOKEN_TTL')
  })

  it('prefers the duration alias without the _MS suffix', () => {
    expect(loadConfig({ ...complete, DSH_AUTH_ACCESS_TOKEN_TTL: '20m', DSH_AUTH_ACCESS_TOKEN_TTL_MS: '1m' }).accessTokenTtlMs).toBe(1_200_000)
  })
})
