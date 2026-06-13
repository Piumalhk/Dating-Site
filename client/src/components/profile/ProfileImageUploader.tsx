"use client";

import { useState } from "react";
import Image from "next/image";
import { uploadImageToCloudinary } from "@/lib/cloudinary";

interface Props {
  onUploadComplete: (
    imageUrl: string
  ) => void;
}

export default function ProfileImageUploader({
  onUploadComplete,
}: Props) {
  const [loading, setLoading] =
    useState(false);

  const [preview, setPreview] =
    useState("");

  const handleUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];

    if (!file) return;

    try {
      setLoading(true);

      setPreview(
        URL.createObjectURL(file)
      );

      const imageUrl =
        await uploadImageToCloudinary(file);

      onUploadComplete(imageUrl);
    } catch (error) {
      console.error(error);
      alert("Image upload failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-center">
        {preview ? (
          <Image
            src={preview}
            alt="Preview"
            width={120}
            height={120}
            className="rounded-full object-cover h-30 w-30"
          />
        ) : (
          <div className="h-30 w-30 rounded-full bg-gray-200 flex items-center justify-center">
            No Image
          </div>
        )}
      </div>

      <input
        type="file"
        accept="image/*"
        onChange={handleUpload}
        className="w-full border rounded-lg p-3"
      />

      {loading && (
        <p className="text-center">
          Uploading...
        </p>
      )}
    </div>
  );
}