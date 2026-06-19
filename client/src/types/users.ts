import type { Timestamp } from "firebase/firestore";

export interface UserProfile {
  uid: string;
  email: string;
  firstName: string;
  lastName: string;
  gender: string;
  interestedIn: string;
  dob: string;
  city: string;
  country: string;
  bio: string;
  civilStatus: string;
  education: string;
  drinking: string;
  smoking: string;
  religion: string;
  job: string;
  height: string;
  profileImage: string;
  gallery: string[];
  premium: boolean;
  verified: boolean;
  profileCompleted: boolean;
  createdAt: Timestamp;
  /** Presence fields — updated on login/logout */
  isOnline?: boolean;
  lastSeen?: Timestamp;
}

export type LikeStatus = "pending" | "matched";

export interface LikeDocument {
  id: string;
  fromUser: string;
  toUser: string;
  status: LikeStatus;
  createdAt: Timestamp;
}

export interface MatchDocument {
  id: string;
  users: [string, string];
  createdAt: Timestamp;
  lastMessage: string | null;
  lastMessageAt: Timestamp | null;
}
