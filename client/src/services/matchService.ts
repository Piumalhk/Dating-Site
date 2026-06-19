import {
  addDoc,
  collection,
  doc,
  getDocs,
  onSnapshot,
  query,
  Timestamp,
  updateDoc,
  where,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import type { MatchDocument } from "@/types/users";

/**
 * Creates a match between userA and userB.
 * Guards against duplicate matches.
 * Updates both like documents to status "matched".
 * Returns the new match document ID, or null if match already existed.
 */
export const createMatch = async (
  userA: string,
  userB: string
): Promise<string | null> => {
  // Duplicate guard: check if a match containing userA also contains userB
  const existingSnap = await getDocs(
    query(collection(db, "matches"), where("users", "array-contains", userA))
  );
  const alreadyExists = existingSnap.docs.some((d) =>
    (d.data().users as string[]).includes(userB)
  );
  if (alreadyExists) return null;

  // Create the match document
  const matchRef = await addDoc(collection(db, "matches"), {
    users: [userA, userB],
    createdAt: Timestamp.now(),
    lastMessage: null,
    lastMessageAt: null,
  });

  // Update both like documents (A→B and B→A) to status "matched"
  const [snapAB, snapBA] = await Promise.all([
    getDocs(
      query(
        collection(db, "likes"),
        where("fromUser", "==", userA),
        where("toUser", "==", userB)
      )
    ),
    getDocs(
      query(
        collection(db, "likes"),
        where("fromUser", "==", userB),
        where("toUser", "==", userA)
      )
    ),
  ]);

  await Promise.all(
    [...snapAB.docs, ...snapBA.docs].map((d) =>
      updateDoc(doc(db, "likes", d.id), { status: "matched" })
    )
  );

  return matchRef.id;
};

/**
 * Returns all matches for a user (one-time fetch).
 */
export const getMatches = async (userId: string): Promise<MatchDocument[]> => {
  const snap = await getDocs(
    query(collection(db, "matches"), where("users", "array-contains", userId))
  );
  return snap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as Omit<MatchDocument, "id">),
  }));
};

/**
 * Real-time listener for a user's matches.
 */
export const watchMatches = (
  userId: string,
  callback: (matches: MatchDocument[]) => void
): Unsubscribe => {
  return onSnapshot(
    query(collection(db, "matches"), where("users", "array-contains", userId)),
    (snap) => {
      const matches = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<MatchDocument, "id">),
      }));
      callback(matches);
    }
  );
};

/**
 * Returns true if a match between userA and userB already exists.
 */
export const checkExistingMatch = async (
  userA: string,
  userB: string
): Promise<boolean> => {
  const snap = await getDocs(
    query(collection(db, "matches"), where("users", "array-contains", userA))
  );
  return snap.docs.some((d) => (d.data().users as string[]).includes(userB));
};
