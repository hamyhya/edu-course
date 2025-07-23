"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  doc,
  getDoc,
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import Comments from "@/components/Comments";
import Link from "next/link";

export default function CourseDetailPage() {
  const { courseId } = useParams();
  const { user, loading: authLoading } = useAuth();
  const [course, setCourse] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!courseId) return;

    const fetchData = async () => {
      setLoading(true);
      const courseRef = doc(db, "courses", courseId);
      const courseSnap = await getDoc(courseRef);

      if (courseSnap.exists() && courseSnap.data().status === "approved") {
        setCourse({ id: courseSnap.id, ...courseSnap.data() });

        if (user) {
          const materialsQuery = query(
            collection(db, "materials"),
            where("courseId", "==", courseId)
          );
          const materialsSnap = await getDocs(materialsQuery);
          setMaterials(
            materialsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
          );
        }
      } else {
        setCourse(null);
      }
      setLoading(false);
    };

    if (!authLoading) {
      fetchData();
    }
  }, [courseId, user, authLoading]);

  if (loading || authLoading)
    return <p className="text-center mt-10">Loading course...</p>;
  if (!course)
    return (
      <p className="text-center mt-10 text-red-500">
        Materi tidak ditemukan atau belum disetujui.
      </p>
    );

  const canAddMaterial =
    user && (user.uid === course.creatorId || user.role === "admin");

  return (
    <div>
      <div className="bg-white p-8 rounded-lg shadow-lg relative">
        {canAddMaterial && (
          <Link
            href={`/courses/${courseId}/add-material`}
            className="absolute top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 text-sm font-semibold z-10"
          >
            + Tambah Materi
          </Link>
        )}

        <img
          src={course.thumbnailBase64 || "https://via.placeholder.com/400x225"}
          alt={course.title}
          className="w-full h-64 object-cover rounded-md mb-6"
        />
        <h1 className="text-4xl font-extrabold text-gray-800">
          {course.title}
        </h1>
        <p className="text-lg text-gray-600 mt-2">Oleh: {course.creatorName}</p>
        <p className="mt-4 text-gray-600">{course.description}</p>
      </div>

      <div className="mt-8">
        {user ? (
          <div>
            <h2 className="text-3xl font-bold mb-4">Konten Materi</h2>
            {materials.length > 0 ? (
              materials.map((material) => (
                <div
                  key={material.id}
                  className="mb-6 p-6 bg-white rounded-lg shadow-md"
                >
                  <h3 className="text-2xl font-semibold text-gray-600">
                    {material.title}
                  </h3>
                  {material.type === "article" && (
                    <div
                      className="mt-4 prose"
                      dangerouslySetInnerHTML={{ __html: material.content }}
                    ></div>
                  )}
                  {material.fileUrl && material.type === "image" && (
                    <img
                      src={material.fileUrl}
                      alt={material.title}
                      className="w-full mt-4 rounded"
                    />
                  )}
                  {material.fileUrl && material.type === "video" && (
                    <video
                      src={material.fileUrl}
                      controls
                      className="w-full mt-4 rounded"
                    ></video>
                  )}
                  {material.fileUrl && material.type === "pdf" && (
                    <a
                      href={material.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                      Buka PDF
                    </a>
                  )}

                  <Comments
                    topicId={material.id}
                    title={`Diskusi Materi: ${material.title}`}
                  />
                </div>
              ))
            ) : (
              <p className="p-4 bg-gray-100 rounded-md text-gray-600">
                Belum ada materi yang ditambahkan untuk kursus ini.
              </p>
            )}
          </div>
        ) : (
          <div className="mt-8 text-center p-8 bg-blue-50 border-l-4 border-blue-500 rounded-r-lg">
            <h3 className="text-2xl font-bold text-gray-600">
              Akses Konten Penuh
            </h3>
            <p className="mt-2 text-gray-600">
              Silakan{" "}
              <Link href="/login" className="text-blue-600 font-bold">
                login
              </Link>{" "}
              atau{" "}
              <Link href="/register" className="text-blue-600 font-bold">
                register
              </Link>{" "}
              untuk melihat seluruh materi.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
