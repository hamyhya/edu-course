"use client";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
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

export default function AddMaterialPage() {
  const { courseId } = useParams();
  const { user, loading } = useAuth();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [type, setType] = useState("article");
  const [content, setContent] = useState("");
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.size > 700 * 1024) {
        setError("Ukuran file terlalu besar. Maksimal 700KB.");
        setFile(null);
        e.target.value = null;
        return;
      }
      setError("");
      setFile(selectedFile);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      setError("Anda harus login untuk menambahkan materi.");
      return;
    }

    setIsUploading(true);
    setError("");

    try {
      let materialData = {
        courseId,
        title,
        type,
        createdAt: serverTimestamp(),
      };

      if (type === "article") {
        if (!content.trim()) {
          setError("Konten artikel tidak boleh kosong.");
          setIsUploading(false);
          return;
        }
        materialData.content = content;
      } else {
        if (!file) {
          setError("Anda harus memilih file untuk diunggah.");
          setIsUploading(false);
          return;
        }
        const fileBase64 = await toBase64(file);
        materialData.fileUrl = fileBase64;
      }

      await addDoc(collection(db, "materials"), materialData);

      setIsUploading(false);
      alert("Materi berhasil ditambahkan!");
      router.push(`/courses/${courseId}`);
    } catch (err) {
      setError("Gagal menambahkan materi. Coba lagi.");
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
      <h1 className="text-3xl font-bold mb-6">Tambah Materi Baru ke Kursus</h1>
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
            Tipe Materi
          </label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full px-3 py-2 border rounded-md text-gray-900"
          >
            <option value="article">Artikel</option>
            <option value="pdf">E-Book (PDF)</option>
            <option value="video">Video</option>
            <option value="image">Gambar</option>
          </select>
        </div>

        {type === "article" ? (
          <div className="mb-6">
            <label className="block text-gray-700 font-bold mb-2">
              Konten Artikel
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-3 py-2 border rounded-md text-gray-900"
              rows="10"
              required
            ></textarea>
          </div>
        ) : (
          <div className="mb-6">
            <label className="block text-gray-700 font-bold mb-2">
              Unggah File
            </label>
            <input
              type="file"
              onChange={handleFileChange}
              className="w-full text-gray-900"
              required
            />
            <p className="text-xs text-red-600 mt-1">
              Peringatan: Ukuran file sangat terbatas (maks ~700KB) karena
              disimpan langsung di database.
            </p>
          </div>
        )}

        <button
          type="submit"
          disabled={isUploading}
          className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 disabled:bg-gray-400"
        >
          {isUploading ? "Menambahkan..." : "Tambah Materi"}
        </button>
      </form>
    </div>
  );
}
