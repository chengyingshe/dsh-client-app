import { invoke } from '@tauri-apps/api/core'
export const secureToken = { get: () => invoke<string | null>('get_refresh_token'), set: (token: string) => invoke('set_refresh_token', { token }), clear: () => invoke('clear_refresh_token') }
