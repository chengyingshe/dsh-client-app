export interface AuthConfig {
  readonly username: string
  readonly password: string
  readonly tokenSecret: string
  readonly accessTokenTtlMs: number
  readonly refreshTokenTtlMs: number
  readonly publicUrl?: string
}

type Environment = Record<string, string | undefined>

const REQUIRED = [
  ['DSH_AUTH_USERNAME', 'username'],
  ['DSH_AUTH_PASSWORD', 'password'],
  ['DSH_AUTH_TOKEN_SECRET', 'tokenSecret'],
] as const

const DEFAULT_ACCESS_TOKEN_TTL_MS = 15 * 60 * 1000
const DEFAULT_REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000

function parseDuration(value: string, variable: string): number {
  const match = /^(\d+(?:\.\d+)?)(ms|s|m|h|d)?$/i.exec(value.trim())
  if (!match) throw new Error(`${variable} must be a positive duration`)
  const amount = Number(match[1])
  const multiplier = { ms: 1, s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 }[match[2]?.toLowerCase() ?? 'ms'] ?? 1
  const result = amount * multiplier
  if (!Number.isFinite(result) || result <= 0) throw new Error(`${variable} must be a positive duration`)
  return result
}

function optionalDuration(env: Environment, names: string[], fallback: number): number {
  const name = names.find((candidate) => env[candidate] !== undefined)
  return name === undefined ? fallback : parseDuration(env[name]!, name)
}

export function loadConfig(env: Environment = process.env): AuthConfig {
  const values = {} as Record<(typeof REQUIRED)[number][1], string>
  for (const [variable, key] of REQUIRED) {
    const value = env[variable]?.trim()
    if (!value) throw new Error(`Missing required environment variable: ${variable}`)
    values[key] = value
  }

  const publicUrl = env.DSH_PUBLIC_URL?.trim() || undefined
  return {
    ...values,
    accessTokenTtlMs: optionalDuration(env, ['DSH_AUTH_ACCESS_TOKEN_TTL', 'DSH_AUTH_ACCESS_TOKEN_TTL_MS'], DEFAULT_ACCESS_TOKEN_TTL_MS),
    refreshTokenTtlMs: optionalDuration(env, ['DSH_AUTH_REFRESH_TOKEN_TTL', 'DSH_AUTH_REFRESH_TOKEN_TTL_MS'], DEFAULT_REFRESH_TOKEN_TTL_MS),
    publicUrl,
  }
}
