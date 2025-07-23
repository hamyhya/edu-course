"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";

export default function AdminPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [pendingCourses, setPendingCourses] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  useEffect(() => {
    if (loading) return;
    if (!user || user.role !== "admin") {
      router.push("/");
      return;
    }

    const fetchPendingCourses = async () => {
      setIsLoadingData(true);
      const q = query(
        collection(db, "courses"),
        where("status", "==", "pending")
      );
      const querySnapshot = await getDocs(q);
      const courses = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setPendingCourses(courses);
      setIsLoadingData(false);
    };

    fetchPendingCourses();
  }, [user, loading, router]);

  const handleApproval = async (courseId, newStatus) => {
    const courseRef = doc(db, "courses", courseId);
    if (newStatus === "approved") {
      await updateDoc(courseRef, { status: "approved" });
    } else {
      await deleteDoc(courseRef);
    }

    setPendingCourses((prev) => prev.filter((c) => c.id !== courseId));
  };

  if (loading || isLoadingData) return <p>Loading admin panel...</p>;
  if (!user || user.role !== "admin") return null;

  return (
    <div className="max-w-4xl mx-auto mt-10">
      <h1 className="text-3xl font-bold mb-6">Admin Panel - Approval Materi</h1>
      <div className="bg-white p-6 rounded-lg shadow-md">
        {pendingCourses.length === 0 ? (
          <p className="text-gray-600">
            Tidak ada materi yang menunggu approval saat ini.
          </p>
        ) : (
          <ul className="space-y-4">
            {pendingCourses.map((course) => (
              <li
                key={course.id}
                className="flex items-center justify-between p-4 border rounded-md"
              >
                <div>
                  <h3 className="font-bold text-gray-600">{course.title}</h3>
                  <p className="text-sm text-gray-600">
                    Oleh: {course.creatorName}
                  </p>
                </div>
                <div className="space-x-2">
                  <button
                    onClick={() => handleApproval(course.id, "approved")}
                    className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleApproval(course.id, "rejected")}
                    className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    Reject
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
