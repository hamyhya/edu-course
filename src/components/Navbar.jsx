"use client";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/");
  };

  return (
    <nav className="bg-white shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <Link href="/" className="text-2xl font-bold text-blue-600">
            Edu Course
          </Link>
          <div className="flex items-center space-x-4">
            <Link href="/" className="text-gray-600 hover:text-blue-500">
              Home
            </Link>
            {user && (
              <Link
                href="/upload"
                className="text-gray-600 hover:text-blue-500"
              >
                Upload Materi
              </Link>
            )}
            {user?.role === "admin" && (
              <Link
                href="/admin"
                className="font-bold text-red-600 hover:text-red-800"
              >
                Admin Panel
              </Link>
            )}

            {loading ? (
              <div className="h-8 w-24 bg-gray-200 rounded animate-pulse"></div>
            ) : user ? (
              <>
                <span className="text-gray-700">
                  Hi, {user.displayName || user.email}
                </span>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                >
                  Logout
                </button>
              </>
            ) : (
              <div className="space-x-2">
                <Link
                  href="/login"
                  className="px-4 py-2 text-gray-600 rounded-md hover:bg-gray-100"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
