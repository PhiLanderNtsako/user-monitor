"use client";
import { useEffect, useState, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { User } from "../../utils/Types";
import { useAuth } from "../../utils/AuthContext";
import toast from "react-hot-toast";
import UserTable from "../../components/UserTable";
import AddUserModal from "@/app/components/AddUserModal";

type Departments = {
	id: string;
	name: string;
};

export default function UsersPage() {
	const { sessionUser, isAuthReady } = useAuth();
	const router = useRouter();

	const [users, setUsers] = useState<User[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [departmentsData, setDepartmentsData] = useState<Departments[]>([]);

	const [search, setSearch] = useState("");
	const [departmentFilter, setDepartmentFilter] = useState("");
	const [sortKey, setSortKey] = useState<keyof User>("first_name");
	const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
	const successToastShown = useRef(false);

	useEffect(() => {
		if (isAuthReady && !sessionUser) {
			router.push("/login");
		}
	}, [sessionUser, isAuthReady, router]);

	const departmentId =
		sessionUser?.user_role == "super" ? null : sessionUser?.department;
	const user_role = sessionUser?.user_role;

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

	useEffect(() => {
		const fetchUsers = async () => {
			try {
				const response = await fetch(
					`https://test.apbco.co.za/switchboard/api/public/index.php/users/?departmentid=${departmentId}`
				);
				const res = await response.json();
				if (res.status) {
					setUsers(res.data);
					setError("");
					if (!successToastShown.current) {
						toast.success("Users fetched successfully.");
						successToastShown.current = true;
					}
				} else {
					toast.error(res?.message || "Failed to fetch users.");
					setError(res.message || "Failed to fetch users");
					successToastShown.current = false;
				}
			} catch (err) {
				setError("Failed to fetch users" + err);
				toast.error("Failed to fetch users" + err);
			} finally {
				setLoading(false);
			}
		};

		fetchUsers();
		const interval = setInterval(fetchUsers, 10000);
		return () => clearInterval(interval);
	}, [departmentId]);

	// Sorting & filtering logic
	const filteredUsers = useMemo(() => {
		let filtered = users;

		if (search.trim()) {
			const s = search.toLowerCase();
			filtered = filtered.filter((u) => {
				const fullName = `${u.first_name} ${u.last_name}`.toLowerCase();
				return (
					fullName.includes(s) ||
					(u.email?.toLowerCase() || "").includes(s) ||
					(u.extension_number?.toLowerCase() || "").includes(s) ||
					(u.department_name?.toLowerCase() || "").includes(s)
				);
			});
		}

		if (departmentFilter) {
			filtered = filtered.filter(
				(u) => u.department_name === departmentFilter
			);
		}

		const getValue = (u: User, key: keyof User): string | number => {
			if (key === "created_at") return new Date(u.created_at).getTime();
			const val = u[key];
			if (val === undefined || val === null) return "";
			return typeof val === "string" ? val.toLowerCase() : val;
		};

		return [...filtered].sort((a, b) => {
			const aVal = getValue(a, sortKey);
			const bVal = getValue(b, sortKey);
			if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
			if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
			return 0;
		});
	}, [users, search, departmentFilter, sortKey, sortOrder]);

	const handleSort = (key: keyof User) => {
		if (key === sortKey) {
			setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
		} else {
			setSortKey(key);
			setSortOrder("asc");
		}
	};

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
				<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
					<h3 className="text-3xl font-bold mb-2 ">Users</h3>
					<button
						onClick={() => setIsModalOpen(true)}
						className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md transition-colors w-full sm:w-auto font-semibold"
					>
						Add New User
					</button>
				</div>

				<div className="flex flex-wrap gap-4 mb-6">
					<input
						type="text"
						placeholder="Search by name, email, or status..."
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						className="w-full max-w-sm border rounded-md px-3 py-2"
					/>

					<select
						value={departmentFilter}
						onChange={(e) => setDepartmentFilter(e.target.value)}
						className="border rounded-md px-3 py-2"
					>
						<option value="">All Departments</option>
						{[...new Set(users.map((u) => u.department_name))]
							.sort()
							.map((dept) => (
								<option key={dept} value={dept}>
									{dept}
								</option>
							))}
					</select>
				</div>

				{loading ? (
					<div className="text-center p-8">
						<div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
						<p className="mt-2 text-gray-600">Loading users...</p>
					</div>
				) : error ? (
					<div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700">
						{error}
					</div>
				) : (
					<UserTable
						users={filteredUsers}
						sortKey={sortKey}
						sortOrder={sortOrder}
						onSort={handleSort}
					/>
				)}

				{/* Edit User Modal */}
				{isModalOpen && (
					<AddUserModal
						modalClose={() => setIsModalOpen(false)}
						departmentsData={departmentsData}
						user_role={user_role}
						departmentId={departmentId}
					/>
				)}
			</div>
		</>
	);
}


