import { describe, expect, it } from 'vitest'
import { TunnelRunner } from '../src/tunnel-runner.ts'

describe('TunnelRunner', () => {
  it('does not start without a token', () => expect(new TunnelRunner(undefined, 'http://127.0.0.1:3099').start()).toBe(false))
  it('starts and stops cloudflared', () => {
    const runner = new TunnelRunner('token', 'http://127.0.0.1:3099', process.execPath)
    expect(runner.start()).toBe(true); expect(runner.running).toBe(true); runner.stop(); expect(runner.running).toBe(false)
  })
})
