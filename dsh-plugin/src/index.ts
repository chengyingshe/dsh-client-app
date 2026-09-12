import type { AuthConfig } from './config.ts'
import { loadConfig } from './config.ts'
import type { Context } from '../../../deepseek-harness/vendor/cordis/lib/types/index.d.ts'
import { AuthService } from './auth-service.ts'
import { hashPassword } from './password.ts'
import { createAuthRoute, createHttpGuard, createUpgradeGuard } from './web-guard.ts'

export const name = 'dsh-auth'
export const inject = ['webServer', 'connection']

export function apply(ctx: Context, config?: AuthConfig): AuthConfig {
  const resolved = config ?? loadConfig()
  const service = new AuthService(resolved, hashPassword(resolved.password))
  const webServer = (ctx as Context & { webServer?: { register?: Function; registerGuard?: Function; registerUpgradeGuard?: Function } }).webServer
  if (webServer?.register === undefined || webServer.registerGuard === undefined || webServer.registerUpgradeGuard === undefined) {
    throw new Error('dsh-auth requires WebServer guard support')
  }
  const disposeHttp = webServer.registerGuard(createHttpGuard(service))
  const disposeUpgrade = webServer.registerUpgradeGuard(createUpgradeGuard(service))
  const connection = (ctx as Context & { connection?: { registerAuthenticator?: (auth: (request: any) => boolean) => () => void } }).connection
  const disposeConnection = connection?.registerAuthenticator?.((request) => {
    const auth = request.headers.authorization?.match(/^Bearer\s+(.+)$/i)?.[1] ?? request.headers.cookie?.match(/(?:^|;\s*)dsh_access=([^;]+)/)?.[1]
    if (!auth) return false
    try { service.tokens.authenticate(auth); return true } catch { return false }
  })
  const disposeRoutes = [
    webServer.register({ kind: 'exact', path: '/auth/login', handler: createAuthRoute('/auth/login', service) }),
    webServer.register({ kind: 'exact', path: '/auth/refresh', handler: createAuthRoute('/auth/refresh', service) }),
    webServer.register({ kind: 'exact', path: '/auth/logout', handler: createAuthRoute('/auth/logout', service) }),
    webServer.register({ kind: 'exact', path: '/auth/status', handler: (request: any, response: any) => {
      const authenticated = (() => { try { service.tokens.authenticate(String(request.headers.authorization?.match(/^Bearer\s+(.+)$/i)?.[1] ?? request.headers.cookie?.match(/(?:^|;\s*)dsh_access=([^;]+)/)?.[1] ?? '')); return true } catch { return false } })()
      response.writeHead(200, { 'content-type': 'application/json; charset=utf-8' })
      response.end(JSON.stringify({ authenticated }))
    } }),
  ]
  ctx.effect(() => () => { disposeHttp(); disposeUpgrade(); disposeConnection?.(); for (const dispose of disposeRoutes) dispose() }, 'dsh-auth guards')
  return resolved
}

export { loadConfig }
export type { AuthConfig }
