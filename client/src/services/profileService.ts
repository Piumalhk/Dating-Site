import {
  doc,
  getDoc,
} from "firebase/firestore";

import { db } from "@/lib/firebase/config";

export const getUserProfile = async (
  uid: string
) => {
  const docRef = doc(db, "users", uid);

  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return docSnap.data();
  }

  return null;
};