"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase/config";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { uploadImageToCloudinary } from "@/lib/cloudinary";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function EditProfilePage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [fatherName, setFatherName] = useState("");
const [ethnicity, setEthnicity] = useState("");
const [caste, setCaste] = useState("");
const [country, setCountry] = useState("");
const [additionalInfo, setAdditionalInfo] = useState("");

  const [profileImage, setProfileImage] =
    useState("");

  const [firstName, setFirstName] =
    useState("");

  const [lastName, setLastName] =
    useState("");

  const [city, setCity] =
    useState("");

  const [bio, setBio] =
    useState("");

  const [gender, setGender] =
    useState("");

  const [interestedIn, setInterestedIn] =
    useState("");

  const [religion, setReligion] =
    useState("");

  const [occupation, setOccupation] =
    useState("");

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = auth.currentUser;

        if (!currentUser) return;

        const userDoc = await getDoc(
          doc(db, "users", currentUser.uid)
        );

        if (userDoc.exists()) {
          const data = userDoc.data();

          setFirstName(data.firstName || "");
          setLastName(data.lastName || "");
          setCity(data.city || "");
          setBio(data.bio || "");
          setGender(data.gender || "");
          setInterestedIn(
            data.interestedIn || ""
          );
          setReligion(
            data.religion || ""
          );
          setOccupation(
            data.occupation || ""
          );
          setProfileImage(
            data.profileImage || ""
          );
          setFatherName(data.fatherName || "");
setEthnicity(data.ethnicity || "");
setCaste(data.caste || "");
setCountry(data.country || "");
setAdditionalInfo(data.additionalInfo || "");
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];

    if (!file) return;

    try {
      const imageUrl =
        await uploadImageToCloudinary(
          file
        );

      setProfileImage(imageUrl);
    } catch (error) {
      console.error(error);
      alert("Image upload failed");
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      const currentUser =
        auth.currentUser;

      if (!currentUser) return;

      await updateDoc(
        doc(db, "users", currentUser.uid),
        {
        firstName,
    lastName,
    city,
    country,

    bio,

    gender,
    interestedIn,

    religion,
    ethnicity,
    caste,

    occupation,

    fatherName,
    additionalInfo,

    profileImage,
          updatedAt:
            new Date().toISOString(),
        }
      );

      alert("Profile updated");

      router.push("/profile");
    } catch (error) {
      console.error(error);
      alert("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-10">
        Loading...
      </div>
    );
  }

  return (
  <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white">
    <div className="max-w-7xl mx-auto px-6 py-10">
      {/* Header */}

      <div className="bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-600 rounded-3xl p-10 text-white mb-8">
        <h1 className="text-4xl font-bold">
          Edit Your Profile
        </h1>

        <p className="mt-3 text-pink-100">
          Complete your profile to receive better matches
          and increase your visibility.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Side */}

        <div className="space-y-6">
          {/* Profile Image */}

          <div className="bg-white rounded-3xl shadow-lg p-8">
            <h2 className="text-xl font-bold mb-6">
              Profile Photo
            </h2>

            <div className="flex flex-col items-center">
              <Image
                src={
                  profileImage ||
                  `https://ui-avatars.com/api/?name=${firstName}+${lastName}&format=png`
                }
                alt="Profile"
                width={180}
                height={180}
                className="rounded-full object-cover border-4 border-pink-100 h-44 w-44"
              />

              <label className="mt-6 cursor-pointer bg-pink-600 text-white px-5 py-3 rounded-xl hover:bg-pink-700 transition">
                Upload New Photo

                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Completion */}

          <div className="bg-white rounded-3xl shadow-lg p-6">
            <h2 className="font-bold text-lg mb-4">
              Profile Completion
            </h2>

            <div className="w-full bg-gray-200 rounded-full h-4">
              <div className="bg-pink-500 h-4 rounded-full w-4/5" />
            </div>

            <p className="text-sm text-gray-500 mt-3">
              Complete all sections to improve matching.
            </p>
          </div>
        </div>

        {/* Right Side */}

        <div className="lg:col-span-2 space-y-6">

          {/* Personal Information */}

          <div className="bg-white rounded-3xl shadow-lg p-8">
            <h2 className="text-2xl font-bold mb-6 text-pink-600">
              Personal Information
            </h2>

            <div className="grid md:grid-cols-2 gap-5">

              <input
                type="text"
                placeholder="First Name"
                value={firstName}
                onChange={(e) =>
                  setFirstName(e.target.value)
                }
                className="border rounded-xl p-4"
              />

              <input
                type="text"
                placeholder="Last Name"
                value={lastName}
                onChange={(e) =>
                  setLastName(e.target.value)
                }
                className="border rounded-xl p-4"
              />

              <input
                type="text"
                placeholder="City"
                value={city}
                onChange={(e) =>
                  setCity(e.target.value)
                }
                className="border rounded-xl p-4"
              />

              <input
                type="text"
                placeholder="Occupation"
                value={occupation}
                onChange={(e) =>
                  setOccupation(e.target.value)
                }
                className="border rounded-xl p-4"
              />

            </div>
          </div>

          {/* About Me */}

          <div className="bg-white rounded-3xl shadow-lg p-8">
            <h2 className="text-2xl font-bold mb-6 text-pink-600">
              About Me
            </h2>

            <textarea
              placeholder="Tell people about yourself..."
              value={bio}
              onChange={(e) =>
                setBio(e.target.value)
              }
              className="border rounded-xl p-4 w-full h-40"
            />
          </div>

          {/* Religious Information */}

          <div className="bg-white rounded-3xl shadow-lg p-8">
            <h2 className="text-2xl font-bold mb-6 text-pink-600">
              Religious & Cultural Information
            </h2>

            <div className="grid md:grid-cols-2 gap-5">

              <input
                type="text"
                placeholder="Religion"
                value={religion}
                onChange={(e) =>
                  setReligion(e.target.value)
                }
                className="border rounded-xl p-4"
              />

              <input
                type="text"
                placeholder="Ethnicity"
                value={ethnicity}
                onChange={(e) =>
                  setEthnicity(e.target.value)
                }
                className="border rounded-xl p-4"
              />

              <input
                type="text"
                placeholder="Caste"
                value={caste}
                onChange={(e) =>
                  setCaste(e.target.value)
                }
                className="border rounded-xl p-4"
              />

            </div>
          </div>

          {/* Family Information */}

          <div className="bg-white rounded-3xl shadow-lg p-8">
            <h2 className="text-2xl font-bold mb-6 text-pink-600">
              Family Information
            </h2>

            <div className="grid md:grid-cols-2 gap-5">

              <input
                type="text"
                placeholder="Father Name"
                value={fatherName}
                onChange={(e) =>
                  setFatherName(e.target.value)
                }
                className="border rounded-xl p-4"
              />

              <input
                type="text"
                placeholder="Country of Residence"
                value={country}
                onChange={(e) =>
                  setCountry(e.target.value)
                }
                className="border rounded-xl p-4"
              />

            </div>

            <textarea
              placeholder="Additional family information..."
              value={additionalInfo}
              onChange={(e) =>
                setAdditionalInfo(e.target.value)
              }
              className="border rounded-xl p-4 w-full h-32 mt-5"
            />
          </div>

          {/* Partner Preferences */}

          <div className="bg-white rounded-3xl shadow-lg p-8">
            <h2 className="text-2xl font-bold mb-6 text-pink-600">
              Partner Preferences
            </h2>

            <div className="grid md:grid-cols-2 gap-5">

              <select
                value={gender}
                onChange={(e) =>
                  setGender(e.target.value)
                }
                className="border rounded-xl p-4"
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

              <select
                value={interestedIn}
                onChange={(e) =>
                  setInterestedIn(e.target.value)
                }
                className="border rounded-xl p-4"
              >
                <option value="">
                  Interested In
                </option>

                <option value="Male">
                  Male
                </option>

                <option value="Female">
                  Female
                </option>
              </select>

            </div>
          </div>

          {/* Save Button */}

          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-gradient-to-r bg-pink-500  text-white px-10 py-4 rounded-2xl font-semibold hover:opacity-90 transition"
            >
              {saving
                ? "Saving Changes..."
                : "Save Changes"}
            </button>
          </div>

        </div>
      </div>
    </div>
  </div>
);
}