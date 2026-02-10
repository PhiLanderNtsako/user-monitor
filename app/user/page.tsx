"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import EditUserModal from "@/app/components/EditUserModal";
import { useAuth } from "../utils/AuthContext";
import CurrentStatus from "../components/CurrentStatus";

type User = {
	user_id: number;
	first_name: string;
	last_name: string;
	extension_number: string;
	email: string;
	role: string;
	user_role: string;
	created_at: string;
	department_name: string;
	department_id: number;
	cellphone?: string;
	telephone?: string;
};

type CurrentStatus = {
	id: number;
	status_name: string;
	status_note: string;
	start_time: string;
	end_time: string;
	created_at: string;
	updated_at: string;
	current_status_id: string;
	updated_by: string;
};

type Departments = {
	id: string;
	name: string;
};

export default function UserPage() {
	const router = useRouter();
	const { sessionUser, isAuthReady } = useAuth();
	const [user, setUser] = useState<User | null>(null);
	const [departmentsData, setDepartmentsData] = useState<Departments[]>([]);

	const [isModalOpen, setIsModalOpen] = useState(false);

	const userId = sessionUser?.id;
	useEffect(() => {
		if (isAuthReady && !sessionUser) {
			router.push("/login");
		}
	}, [sessionUser, isAuthReady, router]);

	const fetchUser = useCallback(async () => {
		try {
			const response = await fetch(
				`https://api.apbco.co.za/switchboard/public/index.php/users/?userid=${userId}`
			);
			const data = await response.json();
			if (data.status === "success") {
				setUser(data.data[0]);
			} else {
				console.error(data.message || "Failed to fetch user");
			}
		} catch (err) {
			console.error("Failed to fetch departments", err);
		}
	}, [userId]);

	const fetchDepartments = async () => {
		try {
			const response = await fetch(
				"https://api.apbco.co.za/switchboard/public/index.php/users/departments/"
			);
			const data = await response.json();
			setDepartmentsData(data.data || []);
		} catch (err) {
			console.error("Failed to fetch departments", err);
		}
	};

	useEffect(() => {
		if (!userId) return;
		fetchUser();
		fetchDepartments();
	}, [userId, fetchUser]);

	if (!isAuthReady) {
		return (
			<div className="text-center p-8 text-gray-500">
				Checking authentication...
			</div>
		);
	}

	return (
		<div className="max-w-6xl mx-auto sm:p-6 mt-8 p-6 bg-white rounded-md shadow-md">
			<CurrentStatus userId={userId} />

			{/* Edit User Modal */}
			{isModalOpen && user && (
				<EditUserModal
					userData={user}
					modalClose={() => setIsModalOpen(false)}
					user_id={userId}
					departmentsData={departmentsData}
				/>
			)}
		</div>
	);
}
