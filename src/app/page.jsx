"use client";
import { useState, useEffect } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";

export default function HomePage() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourses = async () => {
      setLoading(true);
      const q = query(
        collection(db, "courses"),
        where("status", "==", "approved")
      );
      const querySnapshot = await getDocs(q);
      const coursesData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setCourses(coursesData);
      setLoading(false);
    };
    fetchCourses();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="bg-gray-200 rounded-lg shadow-md h-64 animate-pulse"
          ></div>
        ))}
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-4xl font-bold mb-8">Kursus Tersedia</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {courses.map((course) => (
          <Link key={course.id} href={`/courses/${course.id}`}>
            <div className="block bg-white rounded-lg shadow-lg overflow-hidden transform hover:-translate-y-2 transition-transform duration-300">
              <img
                src={
                  course.thumbnailBase64 ||
                  "https://via.placeholder.com/400x225"
                }
                alt={course.title}
                className="w-full h-48 object-cover"
              />
              <div className="p-6">
                <h2 className="text-xl font-bold mb-2 text-gray-800">
                  {course.title}
                </h2>
                <p className="text-gray-600 text-sm mb-4">
                  {course.description}
                </p>
                <p className="text-xs text-gray-500">
                  Oleh: {course.creatorName}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
