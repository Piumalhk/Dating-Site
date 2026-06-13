"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase/config";
import { doc, updateDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import ProfileImageUploader from "@/components/profile/ProfileImageUploader";

export default function ProfileSetupPage() {
  const router = useRouter();

  const [uid, setUid] = useState("");

  const [loading, setLoading] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  const [gender, setGender] = useState("");
  const [interestedIn, setInterestedIn] = useState("");

  const [dob, setDob] = useState("");

  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");

  const [bio, setBio] = useState("");

  const [profileImage, setProfileImage] =
  useState("");

  <ProfileImageUploader
  onUploadComplete={(url) =>
    setProfileImage(url)
  }
/>

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        if (!user) {
          router.push("/login");
          return;
        }

        setUid(user.uid);
      }
    );

    return unsubscribe;
  }, [router]);

  const handleSaveProfile = async () => {
    if (!uid) return;

    if (
      !firstName ||
      !lastName ||
      !gender ||
      !interestedIn ||
      !dob ||
      !country ||
      !city
    ) {
      alert("Please fill all required fields");
      return;
    }

    try {
      setLoading(true);

     await updateDoc(
  doc(db, "users", uid),
  {
    firstName,
    lastName,
    gender,
    interestedIn,
    dob,
    country,
    city,
    bio,

    profileImage,

    profileCompleted: true,
  }
);

      alert("Profile saved successfully");

      router.push("/dashboard");
    } catch (error) {
      console.error(error);

      alert("Failed to save profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-10 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-3xl shadow-lg p-8">
        <h1 className="text-3xl font-bold mb-2">
          Complete Your Profile
        </h1>

        <p className="text-gray-500 mb-8">
          Help others know more about you.
        </p>

        <div className="grid md:grid-cols-2 gap-5">
          <div>
            <label className="font-medium">
              First Name *
            </label>

            <input
              className="w-full border rounded-lg p-3 mt-1"
              value={firstName}
              onChange={(e) =>
                setFirstName(e.target.value)
              }
            />
          </div>

          <div>
            <label className="font-medium">
              Last Name *
            </label>

            <input
              className="w-full border rounded-lg p-3 mt-1"
              value={lastName}
              onChange={(e) =>
                setLastName(e.target.value)
              }
            />
          </div>

          <div>
            <label className="font-medium">
              Gender *
            </label>

            <select
              className="w-full border rounded-lg p-3 mt-1"
              value={gender}
              onChange={(e) =>
                setGender(e.target.value)
              }
            >
              <option value="">
                Select Gender
              </option>

              <option value="Male">
                Male
              </option>

              <option value="Female">
                Female
              </option>
            </select>
          </div>

          <div>
            <label className="font-medium">
              Interested In *
            </label>

            <select
              className="w-full border rounded-lg p-3 mt-1"
              value={interestedIn}
              onChange={(e) =>
                setInterestedIn(
                  e.target.value
                )
              }
            >
              <option value="">
                Select
              </option>

              <option value="Male">
                Male
              </option>

              <option value="Female">
                Female
              </option>
            </select>
          </div>

          <div>
            <label className="font-medium">
              Date of Birth *
            </label>

            <input
              type="date"
              className="w-full border rounded-lg p-3 mt-1"
              value={dob}
              onChange={(e) =>
                setDob(e.target.value)
              }
            />
          </div>

          <div>
            <label className="font-medium">
              Country *
            </label>

            <input
              className="w-full border rounded-lg p-3 mt-1"
              value={country}
              onChange={(e) =>
                setCountry(e.target.value)
              }
            />
          </div>

          <div>
            <label className="font-medium">
              City *
            </label>

            <input
              className="w-full border rounded-lg p-3 mt-1"
              value={city}
              onChange={(e) =>
                setCity(e.target.value)
              }
            />
          </div>
        </div>

        <div className="mt-5">
          <label className="font-medium">
            About Me
          </label>

          <textarea
            rows={5}
            className="w-full border rounded-lg p-3 mt-1"
            placeholder="Tell others about yourself..."
            value={bio}
            onChange={(e) =>
              setBio(e.target.value)
            }
          />
        </div>

        <button
          onClick={handleSaveProfile}
          disabled={loading}
          className="w-full mt-8 bg-pink-600 text-white py-3 rounded-xl font-semibold hover:bg-pink-700"
        >
          {loading
            ? "Saving..."
            : "Complete Profile"}
        </button>
      </div>
    </div>
  );
}