"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase/config";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { uploadImageToCloudinary } from "@/lib/cloudinary";
import { useRouter } from "next/navigation";
import Image from "next/image";
import ProtectedRoute from "@/features/auth/ProtectedRoute";
import Sidebar from "@/components/dashboard/Sidebar";
import Topbar from "@/components/dashboard/Topbar";
import toast from "react-hot-toast";
import {
  Camera, User, Heart, Users, FileText,
  Save, ArrowLeft, Upload,
} from "lucide-react";

function FormInput({
  label, value, onChange, placeholder, type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="input-premium"
      />
    </div>
  );
}

function FormSelect({
  label, value, onChange, options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input-premium"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

function SectionCard({
  icon: Icon, title, children, gradient = "from-pink-500 to-purple-600",
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
  gradient?: string;
}) {
  return (
    <div className="bg-white rounded-3xl shadow-sm p-6 sm:p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className={`w-9 h-9 rounded-xl bg-linear-to-br ${gradient} flex items-center justify-center shadow-sm`}>
          <Icon size={17} className="text-white" />
        </div>
        <h2 className="text-lg font-bold text-gray-900">{title}</h2>
      </div>
      {children}
    </div>
  );
}

export default function EditProfilePage() {
  const router = useRouter();
  const [loading,       setLoading]       = useState(true);
  const [saving,        setSaving]        = useState(false);
  const [uploading,     setUploading]     = useState(false);

  const [profileImage,  setProfileImage]  = useState("");
  const [firstName,     setFirstName]     = useState("");
  const [lastName,      setLastName]      = useState("");
  const [city,          setCity]          = useState("");
  const [country,       setCountry]       = useState("");
  const [bio,           setBio]           = useState("");
  const [gender,        setGender]        = useState("");
  const [interestedIn,  setInterestedIn]  = useState("");
  const [religion,      setReligion]      = useState("");
  const [ethnicity,     setEthnicity]     = useState("");
  const [caste,         setCaste]         = useState("");
  const [occupation,    setOccupation]    = useState("");
  const [fatherName,    setFatherName]    = useState("");
  const [additionalInfo,setAdditionalInfo]= useState("");

  useEffect(() => {
    const fetchUser = async () => {
      const currentUser = auth.currentUser;
      if (!currentUser) { setLoading(false); return; }
      try {
        const snap = await getDoc(doc(db, "users", currentUser.uid));
        if (snap.exists()) {
          const d = snap.data();
          setFirstName(d.firstName     || "");
          setLastName(d.lastName       || "");
          setCity(d.city               || "");
          setCountry(d.country         || "");
          setBio(d.bio                 || "");
          setGender(d.gender           || "");
          setInterestedIn(d.interestedIn|| "");
          setReligion(d.religion       || "");
          setEthnicity(d.ethnicity     || "");
          setCaste(d.caste             || "");
          setOccupation(d.occupation   || "");
          setProfileImage(d.profileImage|| "");
          setFatherName(d.fatherName   || "");
          setAdditionalInfo(d.additionalInfo|| "");
        }
      } catch { toast.error("Failed to load profile"); }
      finally { setLoading(false); }
    };
    fetchUser();
  }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadImageToCloudinary(file);
      setProfileImage(url);
      toast.success("📷 Photo uploaded!");
    } catch {
      toast.error("❌ Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, "users", currentUser.uid), {
        firstName, lastName, city, country, bio,
        gender, interestedIn, religion, ethnicity, caste,
        occupation, profileImage, fatherName, additionalInfo,
        updatedAt: new Date().toISOString(),
      });
      toast.success("❤️ Profile updated successfully!");
      router.push("/profile");
    } catch {
      toast.error("❌ Failed to save profile. Try again.");
    } finally {
      setSaving(false);
    }
  };

  const Shell = ({ children }: { children: React.ReactNode }) => (
    <ProtectedRoute>
      <div className="flex bg-gray-50 min-h-screen">
        <Sidebar />
        <div className="flex-1 min-w-0">
          <Topbar />
          {children}
        </div>
      </div>
    </ProtectedRoute>
  );

  if (loading) {
    return (
      <Shell>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-48 bg-white rounded-3xl animate-pulse" />
          ))}
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 pb-12 space-y-5">
        {/* Header */}
        <div className="relative overflow-hidden bg-linear-to-br from-pink-500 via-rose-500 to-purple-600 rounded-3xl p-7 sm:p-10 text-white shadow-xl shadow-pink-200/40">
          <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full bg-white/10" />
          <div className="relative flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">Edit Your Profile</h1>
              <p className="text-pink-100 text-sm mt-1">
                A complete profile gets 3× more matches
              </p>
            </div>
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl text-sm font-medium transition border border-white/20"
            >
              <ArrowLeft size={15} /> Back
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-5">
          {/* Left: Photo + completion */}
          <div className="space-y-5">
            {/* Photo upload */}
            <SectionCard icon={Camera} title="Profile Photo">
              <div className="flex flex-col items-center">
                <div className="relative group">
                  <Image
                    src={
                      profileImage ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(
                        `${firstName} ${lastName}`
                      )}&background=f9a8d4&color=9d174d&size=200`
                    }
                    alt="Profile"
                    width={140}
                    height={140}
                    className="rounded-full object-cover border-4 border-pink-100 shadow-lg"
                    unoptimized
                  />
                  {uploading && (
                    <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
                      <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    </div>
                  )}
                  {/* Hover overlay */}
                  <label className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center cursor-pointer">
                    <Upload size={22} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      disabled={uploading}
                    />
                  </label>
                </div>

                <label className="mt-5 cursor-pointer btn-primary px-5 py-2.5 text-sm">
                  <Camera size={15} />
                  {uploading ? "Uploading…" : "Change Photo"}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                </label>
                <p className="text-xs text-gray-400 mt-2 text-center">
                  JPG, PNG or WebP · Max 5 MB
                </p>
              </div>
            </SectionCard>

            {/* Completion */}
            <SectionCard icon={User} title="Profile Strength">
              <div className="space-y-3">
                {[
                  { label: "Basic Info",   done: !!(firstName && lastName) },
                  { label: "About Me",     done: !!bio },
                  { label: "Photo",        done: !!profileImage },
                  { label: "Preferences",  done: !!(gender && interestedIn) },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between text-sm">
                    <span className={item.done ? "text-gray-700" : "text-gray-400"}>{item.label}</span>
                    <span className={`text-xs font-semibold ${item.done ? "text-green-500" : "text-gray-300"}`}>
                      {item.done ? "✓" : "—"}
                    </span>
                  </div>
                ))}
                <div className="mt-2 bg-gray-100 rounded-full h-2">
                  <div
                    className="bg-linear-to-r from-pink-500 to-purple-600 h-2 rounded-full transition-all duration-500"
                    style={{
                      width: `${[!!firstName, !!bio, !!profileImage, !!gender].filter(Boolean).length * 25}%`
                    }}
                  />
                </div>
              </div>
            </SectionCard>
          </div>

          {/* Right: Forms */}
          <div className="lg:col-span-2 space-y-5">
            {/* Personal Info */}
            <SectionCard icon={User} title="Personal Information">
              <div className="grid sm:grid-cols-2 gap-5">
                <FormInput label="First Name"  value={firstName}  onChange={setFirstName}  placeholder="Your first name" />
                <FormInput label="Last Name"   value={lastName}   onChange={setLastName}   placeholder="Your last name" />
                <FormInput label="City"        value={city}       onChange={setCity}       placeholder="e.g. Colombo" />
                <FormInput label="Country"     value={country}    onChange={setCountry}    placeholder="e.g. Sri Lanka" />
                <FormInput label="Occupation"  value={occupation} onChange={setOccupation} placeholder="e.g. Software Engineer" />
              </div>
            </SectionCard>

            {/* About Me */}
            <SectionCard icon={FileText} title="About Me" gradient="from-purple-500 to-indigo-600">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Bio</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell people about yourself — your personality, hobbies, what you're looking for…"
                  rows={5}
                  className="input-premium resize-none"
                />
                <p className="text-xs text-gray-400 mt-1 text-right">{bio.length}/500</p>
              </div>
            </SectionCard>

            {/* Religious & Cultural */}
            <SectionCard icon={Heart} title="Religious & Cultural" gradient="from-rose-500 to-pink-600">
              <div className="grid sm:grid-cols-2 gap-5">
                <FormInput label="Religion"  value={religion}  onChange={setReligion}  placeholder="e.g. Buddhist" />
                <FormInput label="Ethnicity" value={ethnicity} onChange={setEthnicity} placeholder="e.g. Sinhalese" />
                <FormInput label="Caste"     value={caste}     onChange={setCaste}     placeholder="Optional" />
              </div>
            </SectionCard>

            {/* Family */}
            <SectionCard icon={Users} title="Family Information" gradient="from-amber-400 to-orange-500">
              <div className="grid sm:grid-cols-2 gap-5 mb-5">
                <FormInput label="Father's Name" value={fatherName} onChange={setFatherName} placeholder="Father's full name" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Additional Information</label>
                <textarea
                  value={additionalInfo}
                  onChange={(e) => setAdditionalInfo(e.target.value)}
                  placeholder="Any other family details you'd like to share…"
                  rows={3}
                  className="input-premium resize-none"
                />
              </div>
            </SectionCard>

            {/* Partner Preferences */}
            <SectionCard icon={Heart} title="Partner Preferences" gradient="from-teal-400 to-cyan-600">
              <div className="grid sm:grid-cols-2 gap-5">
                <FormSelect
                  label="My Gender"
                  value={gender}
                  onChange={setGender}
                  options={[
                    { value: "",       label: "Select gender" },
                    { value: "Male",   label: "Male" },
                    { value: "Female", label: "Female" },
                  ]}
                />
                <FormSelect
                  label="Interested In"
                  value={interestedIn}
                  onChange={setInterestedIn}
                  options={[
                    { value: "",       label: "Select preference" },
                    { value: "Male",   label: "Men" },
                    { value: "Female", label: "Women" },
                  ]}
                />
              </div>
            </SectionCard>

            {/* Save button */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => router.back()}
                className="btn-secondary px-6 py-3"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="btn-primary px-8 py-3 text-base"
              >
                {saving ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Saving…
                  </>
                ) : (
                  <><Save size={16} /> Save Changes</>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Shell>
  );
}
