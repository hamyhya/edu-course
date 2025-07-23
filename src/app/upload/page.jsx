"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";

const toBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });

export default function UploadPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [thumbnail, setThumbnail] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.size > 700 * 1024) {
      setError("Ukuran file terlalu besar. Maksimal 700KB.");
      setThumbnail(null);
      e.target.value = null;
      return;
    }
    setError("");
    setThumbnail(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user || !thumbnail) {
      setError("Harap lengkapi semua field dan pastikan Anda login.");
      return;
    }

    setIsUploading(true);
    setError("");

    try {
      const thumbnailBase64 = await toBase64(thumbnail);

      await addDoc(collection(db, "courses"), {
        title,
        description,
        thumbnailBase64,
        creatorId: user.uid,
        creatorName: user.displayName,
        status: "pending",
        createdAt: serverTimestamp(),
      });

      setIsUploading(false);
      router.push("/");
      alert("Materi berhasil diunggah dan menunggu approval admin!");
    } catch (err) {
      setError("Gagal mengunggah. Coba lagi.");
      setIsUploading(false);
      console.error(err);
    }
  };

  if (loading) return <p>Loading...</p>;
  if (!user) {
    router.push("/login");
    return null;
  }

  return (
    <div className="max-w-2xl mx-auto mt-10">
      <h1 className="text-3xl font-bold mb-6">Upload Materi Baru</h1>
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-lg shadow-md"
      >
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <div className="mb-4">
          <label className="block text-gray-700 font-bold mb-2">
            Judul Materi
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border rounded-md text-gray-900"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 font-bold mb-2">
            Deskripsi Singkat
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 border rounded-md text-gray-900"
            rows="4"
            required
          ></textarea>
        </div>
        <div className="mb-6">
          <label className="block text-gray-700 font-bold mb-2">
            Thumbnail (Gambar, maks 700KB)
          </label>
          <input
            type="file"
            onChange={handleFileChange}
            accept="image/*"
            className="w-full"
            required
          />
        </div>
        <button
          type="submit"
          disabled={isUploading || !thumbnail}
          className="w-full bg-green-500 text-white py-2 rounded-md hover:bg-green-600 disabled:bg-gray-400"
        >
          {isUploading ? "Mengunggah..." : "Kirim untuk Approval"}
        </button>
      </form>
    </div>
  );
}
