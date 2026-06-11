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
  createdAt: Date;
}