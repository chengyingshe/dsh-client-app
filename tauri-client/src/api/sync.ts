import type { Conversation, Message } from './models'
export interface SyncSnapshot { conversations: Conversation[]; messages: Message[]; revision: number }
export class SyncCache { private snapshot: SyncSnapshot = { conversations: [], messages: [], revision: 0 }; get value(): SyncSnapshot { return this.snapshot }; apply(next: SyncSnapshot): void { if (next.revision >= this.snapshot.revision) this.snapshot = next } }
