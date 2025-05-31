"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

type UserData = {
  id: number;
  name: string;
  user_role: string;
};

export default function Navigation() {
  const router = useRouter();
  const pathname = usePathname(); // Get current path
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);

  useEffect(() => {
    const handleAuthChange = () => {
      const token = localStorage.getItem("token");
      const userStr = localStorage.getItem("user");

      let role = "";
      if (userStr) {
        try {
          const userObj = JSON.parse(userStr);
          setUserData(userObj);
          role = userObj.user_role || "";
        } catch (err) {
          console.error("Failed to parse user from localStorage", err);
          setUserData(null);
        }
      } else {
        setUserData(null);
      }

      setIsLoggedIn(!!token);
      setIsAdmin(role === "admin" || role === "operator");
    };

    handleAuthChange(); // run on mount
    window.addEventListener("authChange", handleAuthChange);

    return () => {
      window.removeEventListener("authChange", handleAuthChange);
    };
  }, []);

  const handleLogout = async () => {
    try {
      if (userData?.id) {
        await fetch(
          `https://test.apbco.co.za/switchboard/api/public/index.php/auth/logout/?userid=${userData.id}`
        );
      }
    } catch (error) {
      console.error("Failed to notify logout:", error);
    }

    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.dispatchEvent(new Event("authChange")); // trigger UI update
    router.push("/login");
  };

  const isActive = (href: string) => pathname === href;

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-screen-lg mx-auto px-4 py-3 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-gray-800">
            Switchboard Monitor
          </h1>
          {isLoggedIn && userData && (
            <p className="text-sm text-gray-500">
              Logged in as{" "}
              <span className="font-medium font">{userData.name}</span> (
              {userData.user_role})
            </p>
          )}
        </div>

        {isLoggedIn && userData && (
          <div className="flex items-center space-x-4 text-sm">
            {isAdmin ? (
              <>
                <Link
                  href="/dashboard"
                  className={`hover:text-blue-600 ${
                    isActive("/dashboard")
                      ? "text-blue-600 font-semibold"
                      : "text-gray-700"
                  }`}
                >
                  Dashboard
                </Link>
                <Link
                  href="/admin/users"
                  className={`hover:text-blue-600 ${
                    isActive("/admin/users")
                      ? "text-blue-600 font-semibold"
                      : "text-gray-700"
                  }`}
                >
                  Users
                </Link>
              </>
            ) : (
              <Link
                href={`/user/${userData.name}`}
                className={`hover:text-blue-600 ${
                  isActive("/user")
                    ? "text-blue-600 font-semibold"
                    : "text-gray-700"
                }`}
              >
                Profile
              </Link>
            )}
            <button
              onClick={handleLogout}
              className="text-red-600 hover:text-red-800 font-medium"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
