"use client";
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../utils/AuthContext";
import { User } from "../utils/Types";
import DashboardTable from "../components/DashboardTable";
import toast from "react-hot-toast";
import { useRef } from "react";

// Inside your component

export default function DashboardPage() {
	const { sessionUser, isAuthReady } = useAuth();
	const router = useRouter();
	const [users, setUsers] = useState<User[]>([]);
	const [search, setSearch] = useState("");
	const [statusFilter, setStatusFilter] = useState("");
	const [departmentFilter, setDepartmentFilter] = useState("");
	const [sortKey, setSortKey] = useState<keyof User>("updated_at");
	const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(true);
	const successToastShown = useRef(false);

	useEffect(() => {
		if (isAuthReady && !sessionUser) {
			router.push("/login");
		}
	}, [sessionUser, isAuthReady, router]);

	const departmentId =
		sessionUser?.user_role == "super" ||
		sessionUser?.user_role == "operator"
			? null
			: sessionUser?.department;

	useEffect(() => {
		if (sessionUser?.user_role === "user") return;

		const fetchUsers = async () => {
			try {
				const response = await fetch(
					`https://test.apbco.co.za/switchboard/api/public/index.php/status/current/?departmentid=${departmentId}`
				);
				const data = await response.json();
				if (data.status) {
					setUsers(data.data);
					setError("");
					if (!successToastShown.current) {
						toast.success(
							data?.message || "Users fetched successfully."
						);
						successToastShown.current = true;
					}
				} else {
					toast.error(data?.message || "Failed to fetch users.");
					setError(data.message || "Failed to fetch users");
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
		const interval = setInterval(fetchUsers, 1000);
		return () => clearInterval(interval);
	}, [departmentId, sessionUser?.user_role]);

	const filteredUsers = useMemo(() => {
		let filtered = users;

		if (search.trim()) {
			const s = search.toLowerCase();
			filtered = filtered.filter((u) => {
				const fullName =
					`${u.user_first_name} ${u.user_last_name}`.toLowerCase();
				return (
					fullName.includes(s) ||
					(u.email?.toLowerCase() || "").includes(s) ||
					(u.extension_number?.toLowerCase() || "").includes(s) ||
					(u.status_name?.toLowerCase() || "").includes(s)
				);
			});
		}

		if (statusFilter) {
			filtered = filtered.filter((u) => u.status_name === statusFilter);
		}
		if (departmentFilter) {
			filtered = filtered.filter(
				(u) => u.department_name === departmentFilter
			);
		}

		const getValue = (u: User, key: keyof User): string | number => {
			if (key === "updated_at") return new Date(u.updated_at).getTime();
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
	}, [users, search, statusFilter, departmentFilter, sortKey, sortOrder]);

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
				<h3 className="text-3xl font-bold mb-2">Dashboard</h3>

				<div className="flex flex-wrap gap-4 mb-6">
					<input
						type="text"
						placeholder="Search by name, email, or status..."
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						className="w-full max-w-sm border rounded-md px-3 py-2"
					/>

					<select
						value={statusFilter}
						onChange={(e) => setStatusFilter(e.target.value)}
						className="border rounded-md px-3 py-2"
					>
						<option value="">All Statuses</option>
						{[...new Set(users.map((u) => u.status_name))]
							.sort()
							.map((status) => (
								<option key={status} value={status}>
									{status}
								</option>
							))}
					</select>

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

					<button
						onClick={() => setDepartmentFilter("Call Centre")}
						className={`px-4 py-1.5 rounded-md text-sm font-semibold transition ${
							departmentFilter === "Call Centre"
								? "bg-blue-600 text-white shadow"
								: "bg-blue-100 text-blue-800 hover:bg-blue-200"
						}`}
					>
						Call Centre Department
					</button>
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
					<DashboardTable
						users={filteredUsers}
						sortKey={sortKey}
						sortOrder={sortOrder}
						onSort={handleSort}
					/>
				)}
			</div>
		</>
	);
}
