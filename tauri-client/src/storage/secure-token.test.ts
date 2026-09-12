import { describe, expect, it, vi } from 'vitest'
import { secureToken } from './secure-token'
vi.mock('@tauri-apps/api/core', () => ({ invoke: vi.fn() }))
describe('secureToken', () => { it('exposes only secure storage commands', () => { expect(Object.keys(secureToken)).toEqual(['get', 'set', 'clear']) }) })
