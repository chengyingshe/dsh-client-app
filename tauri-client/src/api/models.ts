export interface ServerConfig { id: string; name: string; url: string; kind: 'lan' | 'public'; updatedAt: number }
export interface TokenPair { accessToken: string; refreshToken: string; accessExpiresAt: number; refreshExpiresAt: number }
export interface Conversation { id: string; title: string; updatedAt: number; version: number; archived: boolean }
export interface Message { id: string; conversationId: string; role: string; content: unknown; version: number; createdAt: number }
