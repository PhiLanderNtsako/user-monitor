"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import EditUserModal from "@/app/components/EditUserModal";

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
	department_id?: number;
	cellphone?: string;
	telephone?: string;
};

export default function UserPage() {
	const router = useRouter();
	const { user_id } = useParams<{ user_id: string }>();
	const parsedUserId = user_id ? parseInt(user_id, 10) : undefined;
	const [user, setUser] = useState<User | null>(null);
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(true);
	const [isModalOpen, setIsModalOpen] = useState(false);

	useEffect(() => {
		const fetchUser = async () => {
			try {
				const response = await fetch(
					`https://test.apbco.co.za/switchboard/api/public/index.php/users/?userid=${user_id}`
				);
				const data = await response.json();

				if (data.status === "success") {
					setUser(data.data[0]);
				} else {
					setError(data.message || "Failed to fetch user");
				}
			} catch (err) {
				setError("Failed to fetch user" + err);
			} finally {
				setLoading(false);
			}
		};

		fetchUser();
	}, [user_id]);

	// Auth check
	useEffect(() => {
		const token = localStorage.getItem("token");
		const user_session = JSON.parse(localStorage.getItem("user") || "{}");

		if (!token || user_session.user_role === "admin") {
			router.replace("/login?unauthorized=true");
		}
	}, [router]);

	if (loading) {
		return (
			<div className="flex justify-center items-center h-screen">
				<div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="max-w-3xl mx-auto mt-8 p-4 bg-red-50 border border-red-200 rounded">
				<p className="text-red-600">{error}</p>
				<Link
					href="/admin/users"
					className="text-blue-600 hover:underline mt-4 inline-block"
				>
					&larr; Back to Users
				</Link>
			</div>
		);
	}

	if (!user) {
		return (
			<div className="max-w-3xl mx-auto mt-8 p-4">
				<p>User not found</p>
				<Link
					href="/admin/users"
					className="text-blue-600 hover:underline mt-4 inline-block"
				>
					&larr; Back to Users
				</Link>
			</div>
		);
	}

	// If `user_id` is required:
	if (parsedUserId === undefined || isNaN(parsedUserId)) {
		// handle error, redirect, or show fallback
		return <div>User ID is invalid</div>;
	}

	return (
		<div className="max-w-4xl mx-auto p-6">
			<div className="flex justify-between items-start mb-6">
				<div>
					<h1 className="text-2xl font-bold text-gray-800">
						{user.first_name} {user.last_name}
					</h1>
					<p className="text-gray-600">{user.email}</p>
				</div>
				<button
					onClick={() => setIsModalOpen(true)}
					className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
				>
					Edit User
				</button>
			</div>

			<div className="bg-white rounded-lg shadow-md p-6 mb-6">
				<h2 className="text-xl font-semibold mb-4 text-gray-800">
					User Details
				</h2>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
					<div>
						<h3 className="font-medium text-gray-700 mb-2">
							Personal Information
						</h3>
						<div className="space-y-2">
							<p>
								<span className="font-medium">First Name:</span>{" "}
								{user.first_name}
							</p>
							<p>
								<span className="font-medium">Last Name:</span>{" "}
								{user.last_name}
							</p>
							<p>
								<span className="font-medium">Email:</span>{" "}
								{user.email}
							</p>
						</div>
					</div>

					<div>
						<h3 className="font-medium text-gray-700 mb-2">
							Contact Information
						</h3>
						<div className="space-y-2">
							<p>
								<span className="font-medium">Extension:</span>{" "}
								{user.extension_number}
							</p>
							<p>
								<span className="font-medium">Cellphone:</span>{" "}
								{user.cellphone || "Not provided"}
							</p>
							<p>
								<span className="font-medium">Telephone:</span>{" "}
								{user.telephone || "Not provided"}
							</p>
						</div>
					</div>

					<div>
						<h3 className="font-medium text-gray-700 mb-2">
							Organization
						</h3>
						<div className="space-y-2">
							<p>
								<span className="font-medium">Role:</span>{" "}
								{user.user_role}
							</p>
							<p>
								<span className="font-medium">Department:</span>{" "}
								{user.department_name}
							</p>
						</div>
					</div>

					<div>
						<h3 className="font-medium text-gray-700 mb-2">
							Account Information
						</h3>
						<div className="space-y-2">
							<p>
								<span className="font-medium">User ID:</span>{" "}
								{user.user_id}
							</p>
							<p>
								<span className="font-medium">Created At:</span>{" "}
								{new Date(user.created_at).toLocaleString()}
							</p>
						</div>
					</div>
				</div>
			</div>

			<Link
				href="/admin/users"
				className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					className="h-5 w-5 mr-1"
					viewBox="0 0 20 20"
					fill="currentColor"
				>
					<path
						fillRule="evenodd"
						d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
						clipRule="evenodd"
					/>
				</svg>
				Back to Users
			</Link>

			{/* Edit User Modal */}
			{isModalOpen && (
				<EditUserModal
					userData={user}
					modalClose={() => setIsModalOpen(false)}
					user_id={parsedUserId}
				/>
			)}
		</div>
	);
}