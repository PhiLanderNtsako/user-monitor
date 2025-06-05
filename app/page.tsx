"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userString = localStorage.getItem("user");

    // If no token or user data, redirect to login
    if (!token || !userString) {
      router.push("/login");
      return;
    }

    try {
      const user = JSON.parse(userString);
      const role = user.user_role;

		if (role === "admin" || role === "operator") {
			router.push("/dashboard");
		} else {
			router.push(`/user`);
		}
    } catch (e) {
      console.error("Failed to parse user info:", e);
      // If parsing fails, redirect to login
      router.push("/login");
    }
  }, [router]);

  // Show loading state while checking auth
  return (
		<div className="text-center">
			<h1 className="text-3xl font-semibold mb-4">
				Welcome to the Switchboard Monitor
			</h1>
			<p className="text-gray-600">Checking authentication...</p>
		</div>
  );
}
