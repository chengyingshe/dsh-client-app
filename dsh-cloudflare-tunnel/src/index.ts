import type { Context } from '../../../deepseek-harness/vendor/cordis/lib/types/index.d.ts'
import { TunnelRunner } from './tunnel-runner.ts'

export const name = 'dsh-cloudflare-tunnel'

export interface TunnelConfig { token?: string; target?: string; command?: string }

export function apply(ctx: Context, config: TunnelConfig = {}): TunnelRunner {
  const target = config.target ?? process.env.DSH_TUNNEL_TARGET ?? 'http://127.0.0.1:3099'
  const token = config.token ?? process.env.CLOUDFLARE_TUNNEL_TOKEN
  const runner = new TunnelRunner(token, target, config.command)
  runner.start()
  ctx.effect(() => () => runner.stop(), 'dsh-cloudflare-tunnel lifecycle')
  return runner
}

export { TunnelRunner }
