"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type UserData = {
  id: number;
  name: string;
  user_role: string;
};

export default function Navigation() {
  const router = useRouter();
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

  return (
    <nav className="bg-white shadow-md p-4 flex justify-between items-center">
      <div className="font-bold text-lg">
        <p> Switchboard Monitor</p>
        {isLoggedIn && userData && (
          <small> {userData.name} {userData.user_role} </small>
        )}
      </div>
      {isLoggedIn && userData && (
        <div className="space-x-4 flex items-center">
          {isAdmin ? (
            <>
            <Link href="/admin/users" className="hover:underline">
              Users
            </Link>
            <Link href="/dashboard/" className="hover:underline">
              Dashboard
              </Link>
              </>
          ) : (
            <Link href={`/user/${userData.name}`} className="hover:underline">
              {userData.name} - {userData.user_role}
            </Link>
          )}
          <button
            onClick={handleLogout}
            className="hover:underline text-red-600"
          >
            Logout
          </button>
        </div>
      )}
    </nav>
  );
}
