import { spawn, type ChildProcess } from 'node:child_process'

export class TunnelRunner {
  private child?: ChildProcess
  private stopping = false
  constructor(private readonly token: string | undefined, private readonly target: string, private readonly command = 'cloudflared') {}
  start(): boolean {
    if (!this.token || this.child) return false
    this.stopping = false
    this.child = spawn(this.command, ['tunnel', 'run', '--token', this.token, '--url', this.target], { stdio: 'ignore' })
    this.child.once('exit', () => { this.child = undefined })
    return true
  }
  stop(): void { this.stopping = true; this.child?.kill('SIGTERM'); this.child = undefined }
  get running(): boolean { return Boolean(this.child) && !this.stopping }
}
