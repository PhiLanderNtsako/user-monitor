"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import EditUserModal from "@/app/components/EditUserModal";
import UserStatusLog from "@/app/components/UserStatusLog";
import { useAuth } from "../../../utils/AuthContext";
import toast from "react-hot-toast";
import { useRef } from "react";

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

type StatusLog = {
	id: number;
	status_name: string;
	status_note?: string;
	start_time: string;
	end_time: string;
	created_at: string;
};

type Departments = {
	id: string;
	name: string;
};

export default function UserPage() {
	const router = useRouter();
	const { user_id } = useParams<{ user_id: string }>();
	const parsedUserId = user_id ? parseInt(user_id, 10) : undefined;

	const { sessionUser, isAuthReady } = useAuth();
	const [user, setUser] = useState<User | null>(null);
	const [logs, setLogs] = useState<StatusLog[]>([]);
	const [departmentsData, setDepartmentsData] = useState<Departments[]>([]);

	const [isModalOpen, setIsModalOpen] = useState(false);
	const [loading, setLoading] = useState(true);
	const [loadingLogs, setLoadingLogs] = useState(false);
	const [error, setError] = useState("");
	const [logError, setLogError] = useState("");
	const successToastShown = useRef(false);

	useEffect(() => {
		if (isAuthReady && !sessionUser) {
			router.push("/login");
		}
	}, [sessionUser, isAuthReady, router]);

	useEffect(() => {
		const fetchUser = async () => {
			try {
				const response = await fetch(
					`https://test.apbco.co.za/switchboard/api/public/index.php/users/?userid=${parsedUserId}`
				);
				const data = await response.json();

				if (data.status === "success") {
					setUser(data.data[0]);
					if (!successToastShown.current) {
						toast.success(
							data?.message || "Users fetched successfully."
						);
						successToastShown.current = true;
					}
				} else {
					setError(data.message || "Failed to fetch user");
					toast.error(data?.message || "Failed to fetch user.");
				}
			} catch (err) {
				setError("Failed to fetch user" + err);
			} finally {
				setLoading(false);
			}
		};

		const fetchUserStatusLogs = async () => {
			try {
				const response = await fetch(
					`https://test.apbco.co.za/switchboard/api/public/index.php/status/log/?userid=${parsedUserId}`
				);
				const data = await response.json();
				if (data.status === "success") {
					setLogs(data.data);
				} else {
					throw new Error(data.message || "Failed to fetch logs.");
				}
			} catch (err) {
				setLogError("Failed to fetch user" + err);
			} finally {
				setLoadingLogs(false);
			}
		};

		fetchUser();
		fetchUserStatusLogs();
	}, [parsedUserId]);

	useEffect(() => {
		const fetchDepartments = async () => {
			try {
				const response = await fetch(
					"https://test.apbco.co.za/switchboard/api/public/index.php/users/departments/"
				);
				const data = await response.json();
				setDepartmentsData(data.data || []);
			} catch (err) {
				console.error("Failed to fetch departments", err);
			}
		};

		fetchDepartments();
	}, []);

	const isAdmin = ["admin", "super"].includes(sessionUser?.user_role ?? "");

	if (loading) {
		return (
			<div className="flex items-center justify-center h-screen">
				<div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
			</div>
		);
	}

	if (error || !user) {
		return (
			<div className="max-w-3xl mx-auto mt-8 p-4 bg-red-50 border border-red-200 rounded">
				<p className="text-red-600">{error || "User not found."}</p>
				<Link
					href="/admin/users"
					className="inline-block mt-4 text-blue-600 hover:underline"
				>
					&larr; Back to Users
				</Link>
			</div>
		);
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

				{isAdmin && (
					<>
						<button
							onClick={() => setIsModalOpen(true)}
							className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition"
						>
							Edit User
						</button>
						<Link
							href="/admin/users"
							className="inline-flex items-center text-blue-600 hover:text-blue-800 mt-6 transition-colors"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								className="h-5 w-5 mr-1"
								fill="currentColor"
								viewBox="0 0 20 20"
							>
								<path
									fillRule="evenodd"
									d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
									clipRule="evenodd"
								/>
							</svg>
							Back to Users
						</Link>
					</>
				)}
			</div>

			<div className="bg-white shadow rounded-lg p-6 mb-6">
				<div className="grid md:grid-cols-2 gap-6 text-sm text-gray-700">
					<div>
						<p>
							<strong>First Name:</strong> {user.first_name}
						</p>
						<p>
							<strong>Last Name:</strong> {user.last_name}
						</p>
						<p>
							<strong>Email:</strong> {user.email}
						</p>
					</div>
					<div>
						<p>
							<strong>Extension:</strong> {user.extension_number}
						</p>
						<p>
							<strong>Cellphone:</strong>{" "}
							{user.cellphone || "N/A"}
						</p>
						<p>
							<strong>Telephone:</strong>{" "}
							{user.telephone || "N/A"}
						</p>
					</div>
					<div>
						<p>
							<strong>Role:</strong> {user.user_role}
						</p>
						<p>
							<strong>Department:</strong> {user.department_name}
						</p>
					</div>
					<div>
						<p>
							<strong>User ID:</strong> {user.user_id}
						</p>
						<p>
							<strong>Created At:</strong>{" "}
							{new Date(user.created_at).toLocaleString()}
						</p>
					</div>
				</div>
			</div>

			<UserStatusLog
				logs={logs}
				loadingLogs={loadingLogs}
				errorLogs={logError}
			/>

			{isModalOpen && (
				<EditUserModal
					userData={user}
					user_id={parsedUserId!}
					departmentsData={departmentsData}
					modalClose={() => setIsModalOpen(false)}
				/>
			)}
		</div>
	);
}