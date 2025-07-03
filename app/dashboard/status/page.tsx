"use client";
import { useEffect,} from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../utils/AuthContext";
import CurrentStatus from "../../components/CurrentStatus";

// Inside your component

export default function DashboardPage() {
	const { sessionUser, isAuthReady } = useAuth();
	const router = useRouter();

	useEffect(() => {
		if (isAuthReady && !sessionUser) {
			router.push("/login");
		}
	}, [sessionUser, isAuthReady, router]);

	const userId = sessionUser?.id;

	if (!isAuthReady) {
		return (
			<div className="text-center p-8 text-gray-500">
				Checking authentication...
			</div>
		);
	}

	return (
		<>
			<div className="max-w-6xl mx-auto mt-8 p-6 bg-white rounded-md shadow-md">
				<CurrentStatus userId={userId} />
			</div>
		</>
	);
}
