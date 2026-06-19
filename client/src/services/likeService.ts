import {
  addDoc,
  collection,
  getDocs,
  query,
  where,
  onSnapshot,
  Timestamp,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import type { LikeDocument } from "@/types/users";
import { createMatch } from "./matchService";

/**
 * Send a like from currentUserId → targetUserId.
 * If a reverse like already exists, creates a match and returns matched: true.
 * Prevents self-likes and duplicate likes silently.
 */
export const sendLike = async (
  currentUserId: string,
  targetUserId: string
): Promise<{ matched: boolean; matchId?: string }> => {
  if (currentUserId === targetUserId) {
    throw new Error("Cannot like yourself");
  }

  // Guard: prevent duplicate
  const dupSnap = await getDocs(
    query(
      collection(db, "likes"),
      where("fromUser", "==", currentUserId),
      where("toUser", "==", targetUserId)
    )
  );
  if (!dupSnap.empty) return { matched: false };

  // Create like with pending status
  await addDoc(collection(db, "likes"), {
    fromUser: currentUserId,
    toUser: targetUserId,
    status: "pending",
    createdAt: Timestamp.now(),
  });

  // Check for reverse like → mutual match
  const reverseSnap = await getDocs(
    query(
      collection(db, "likes"),
      where("fromUser", "==", targetUserId),
      where("toUser", "==", currentUserId)
    )
  );

  if (!reverseSnap.empty) {
    const matchId = await createMatch(currentUserId, targetUserId);
    return { matched: true, matchId: matchId ?? undefined };
  }

  return { matched: false };
};

/**
 * Returns the set of user IDs that currentUserId has already liked (any status).
 */
export const getUserSentLikeIds = async (
  userId: string
): Promise<Set<string>> => {
  const snap = await getDocs(
    query(collection(db, "likes"), where("fromUser", "==", userId))
  );
  const ids = new Set<string>();
  snap.docs.forEach((d) => ids.add(d.data().toUser as string));
  return ids;
};

/**
 * Returns the set of user IDs that currentUserId has a "matched" like towards.
 * Used to determine the "Matched" button state on profile cards.
 */
export const getMatchedUserIds = async (
  userId: string
): Promise<Set<string>> => {
  const snap = await getDocs(
    query(
      collection(db, "likes"),
      where("fromUser", "==", userId),
      where("status", "==", "matched")
    )
  );
  const ids = new Set<string>();
  snap.docs.forEach((d) => ids.add(d.data().toUser as string));
  return ids;
};

/**
 * Returns true if fromUser has already liked toUser (any status).
 */
export const checkExistingLike = async (
  fromUser: string,
  toUser: string
): Promise<boolean> => {
  const snap = await getDocs(
    query(
      collection(db, "likes"),
      where("fromUser", "==", fromUser),
      where("toUser", "==", toUser)
    )
  );
  return !snap.empty;
};

/**
 * Real-time listener for likes received by userId.
 */
export const watchUserLikes = (
  userId: string,
  callback: (likes: LikeDocument[]) => void
): Unsubscribe => {
  return onSnapshot(
    query(collection(db, "likes"), where("toUser", "==", userId)),
    (snap) => {
      const likes = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<LikeDocument, "id">),
      }));
      callback(likes);
    }
  );
};
