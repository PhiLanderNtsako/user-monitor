"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./utils/AuthContext";

export default function HomePage() {
	const { sessionUser } = useAuth();
	const router = useRouter();

	useEffect(() => {
		if (!sessionUser) {
			router.push("/login");
			return;
		}

		if (["operator", "super"].includes(sessionUser.user_role)) {
			router.push("/dashboard");
		}
		if (["admin"].includes(sessionUser.user_role)) {
			router.push("/dashboard/status");
		}
		if (["user"].includes(sessionUser.user_role)) {
			router.push("/user");
		}
	}, [sessionUser, router]);

	return (
		<div className="min-h-screen flex flex-col items-center justify-center bg-[#F4F6F8] text-center px-4">
			<h1 className="text-3xl font-bold text-[#1A73E8] mb-2">
				Switchboard Monitor
			</h1>
			<p className="text-gray-600 text-sm">Checking your access...</p>
		</div>
	);
}
