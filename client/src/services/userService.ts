import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";

import { db } from "@/lib/firebase/config";

export const createUserDocument = async (uid: string, email: string) => {
  const userRef = doc(db, "users", uid);

  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    await setDoc(userRef, {
      uid,
      email,
      firstName: "",
      lastName: "",
      gender: "",
      interestedIn: "",
      dob: "",
      city: "",
      country: "",
      bio: "",
      civilStatus: "",
      education: "",
      drinking: "",
      smoking: "",
      religion: "",
      job: "",
      height: " ",
      profileImage: "",
      gallery: [],
      premium: false,
      verified: false,
      profileCompleted: false,
      createdAt: serverTimestamp(),
    });
  }
};
