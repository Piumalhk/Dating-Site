import type { Timestamp } from "firebase/firestore";

export interface ChatDocument {
  id: string;
  users: [string, string];
  matchId: string;
  lastMessage: string | null;
  lastMessageAt: Timestamp | null;
  createdAt: Timestamp;
  /** Per-user unread counts: { uid1: 0, uid2: 3 } */
  unreadCounts: Record<string, number>;
}

/** Extensible message type — add "image" | "voice" later without schema change */
export type MessageType = "text";

export interface MessageDocument {
  id: string;
  senderId: string;
  text: string;
  type: MessageType;
  createdAt: Timestamp;
  read: boolean;
}
