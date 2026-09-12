import { describe, expect, it } from 'vitest'
import { TunnelRunner } from '../src/tunnel-runner.ts'

describe('TunnelRunner', () => {
  it('does not start without a token', () => { expect(new TunnelRunner(undefined, 'http://127.0.0.1:3080').start()).toBe(false) })
  it('starts and stops the configured cloudflared command', () => {
    const runner = new TunnelRunner('token', 'http://127.0.0.1:3080', process.execPath)
    expect(runner.start()).toBe(true)
    expect(runner.running).toBe(true)
    runner.stop()
    expect(runner.running).toBe(false)
  })
})
