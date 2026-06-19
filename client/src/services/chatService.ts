import {
  addDoc,
  collection,
  doc,
  getDocs,
  increment,
  limitToLast,
  onSnapshot,
  orderBy,
  query,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import type { ChatDocument, MessageDocument } from "@/types/chat";

// ─── Chat creation ────────────────────────────────────────────────────────────

/**
 * Returns the chatId for an existing chat tied to this matchId,
 * or creates a new one if none exists.
 * Prevents duplicate chat rooms.
 */
export const getOrCreateChat = async (
  matchId: string,
  users: [string, string]
): Promise<string> => {
  // Query by users array-contains so the security rule
  // `request.auth.uid in resource.data.users` is satisfiable for
  // collection queries. Then filter matchId client-side.
  const snap = await getDocs(
    query(collection(db, "chats"), where("users", "array-contains", users[0]))
  );
  const existing = snap.docs.find((d) => d.data().matchId === matchId);
  if (existing) return existing.id;

  // Create a new chat
  const ref = await addDoc(collection(db, "chats"), {
    users,
    matchId,
    lastMessage: null,
    lastMessageAt: null,
    createdAt: Timestamp.now(),
    unreadCounts: { [users[0]]: 0, [users[1]]: 0 },
  });

  return ref.id;
};

// ─── Messaging ────────────────────────────────────────────────────────────────

/**
 * Writes a message to the subcollection and updates the chat's metadata.
 * Increments the recipient's unread count atomically.
 */
export const sendMessage = async (
  chatId: string,
  senderId: string,
  text: string,
  chatUsers: [string, string]
): Promise<void> => {
  const trimmed = text.trim();
  if (!trimmed) return;

  const recipientId = chatUsers.find((uid) => uid !== senderId)!;
  const now = Timestamp.now();

  // Write message doc
  await addDoc(collection(db, "chats", chatId, "messages"), {
    senderId,
    text: trimmed,
    type: "text",
    createdAt: now,
    read: false,
  });

  // Update chat metadata + atomically increment recipient's unread counter
  await updateDoc(doc(db, "chats", chatId), {
    lastMessage: trimmed,
    lastMessageAt: now,
    [`unreadCounts.${recipientId}`]: increment(1),
  });
};

// ─── Real-time listeners ──────────────────────────────────────────────────────

/**
 * Real-time listener for the last 100 messages in a chat, oldest-first.
 * Using limitToLast so new messages appear at the bottom naturally.
 */
export const watchMessages = (
  chatId: string,
  callback: (messages: MessageDocument[]) => void
): Unsubscribe => {
  return onSnapshot(
    query(
      collection(db, "chats", chatId, "messages"),
      orderBy("createdAt", "asc"),
      limitToLast(100)
    ),
    (snap) => {
      const messages = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<MessageDocument, "id">),
      }));
      callback(messages);
    }
  );
};

/**
 * Real-time listener for all of a user's chats.
 * Sorted client-side by lastMessageAt descending (newest conversation first).
 */
export const watchUserChats = (
  userId: string,
  callback: (chats: ChatDocument[]) => void
): Unsubscribe => {
  return onSnapshot(
    query(collection(db, "chats"), where("users", "array-contains", userId)),
    (snap) => {
      const chats = snap.docs
        .map((d) => ({ id: d.id, ...(d.data() as Omit<ChatDocument, "id">) }))
        .sort((a, b) => {
          const aMs = a.lastMessageAt?.toMillis?.() ?? a.createdAt?.toMillis?.() ?? 0;
          const bMs = b.lastMessageAt?.toMillis?.() ?? b.createdAt?.toMillis?.() ?? 0;
          return bMs - aMs;
        });
      callback(chats);
    }
  );
};

/**
 * Real-time listener for total unread count across all of a user's chats.
 * Reads unreadCounts[userId] from each chat and sums them.
 */
export const watchTotalUnreadCount = (
  userId: string,
  callback: (count: number) => void
): Unsubscribe => {
  return onSnapshot(
    query(collection(db, "chats"), where("users", "array-contains", userId)),
    (snap) => {
      const total = snap.docs.reduce((sum, d) => {
        const counts = (d.data().unreadCounts ?? {}) as Record<string, number>;
        return sum + (counts[userId] ?? 0);
      }, 0);
      callback(total);
    }
  );
};

// ─── Read receipts ────────────────────────────────────────────────────────────

/**
 * Marks all incoming unread messages in a chat as read,
 * and resets the current user's unread count to 0.
 * Uses a batch write (max 500 ops — safe for a chat context).
 */
export const markMessagesAsRead = async (
  chatId: string,
  currentUserId: string
): Promise<void> => {
  const unreadSnap = await getDocs(
    query(
      collection(db, "chats", chatId, "messages"),
      where("read", "==", false)
    )
  );

  // Only mark messages sent by the other user
  const toUpdate = unreadSnap.docs.filter(
    (d) => d.data().senderId !== currentUserId
  );

  if (toUpdate.length === 0) return;

  const batch = writeBatch(db);

  toUpdate.forEach((d) =>
    batch.update(doc(db, "chats", chatId, "messages", d.id), { read: true })
  );

  // Reset this user's unread counter on the parent chat doc
  batch.update(doc(db, "chats", chatId), {
    [`unreadCounts.${currentUserId}`]: 0,
  });

  await batch.commit();
};

// ─── Online status ────────────────────────────────────────────────────────────

/**
 * Updates isOnline and lastSeen on the user's Firestore document.
 * Call with isOnline=true on login, false before logout.
 */
export const setUserOnlineStatus = async (
  userId: string,
  isOnline: boolean
): Promise<void> => {
  await updateDoc(doc(db, "users", userId), {
    isOnline,
    lastSeen: Timestamp.now(),
  });
};
