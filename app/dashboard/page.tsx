"use client";
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { formatDateTime } from "../utils/formatDateTime";

type User = {
	id: number;
	user_first_name: string;
	user_last_name: string;
	extension_number: string;
	email: string;
	status_name: string;
	status_note: string;
	updated_at: string;
};

export default function AdminPage() {
	const router = useRouter();
	const [users, setUsers] = useState<User[]>([]);
	const [error, setError] = useState("");

	const [search, setSearch] = useState("");
	const [sortKey, setSortKey] = useState<keyof User>("updated_at");
	const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
	const [loading, setLoading] = useState(true);

	const statusColors = {
		Available: "bg-emerald-500 text-white", // Fresh green for available
		"On Lunch": "bg-amber-400 text-gray-800", // Warm yellow for lunch
		"In a Meeting": "bg-blue-500 text-white", // Professional blue for meetings
		"On Leave": "bg-purple-500 text-white", // Distinct purple for leave
		"On Sick Leave": "bg-red-500 text-white", // Alert red for sick leave
		"Logged Out": "bg-gray-400 text-gray-800", // Neutral gray for logged out
		"On Call": "bg-indigo-600 text-white", // Rich indigo for on call
		Away: "bg-yellow-300 text-gray-800", // Light yellow for away
		Busy: "bg-orange-500 text-white", // Vibrant orange for busy
		"On Break": "bg-cyan-400 text-gray-800", // Refreshing cyan for breaks
		Default: "bg-gray-200 text-gray-800", // Default light gray
	};

		const user =
			typeof window !== "undefined"
				? JSON.parse(localStorage.getItem("user") || "{}")
				: null;
		const departmentId = user?.department;
	useEffect(() => {
		const fetchUsers = async () => {
			try {
				const response = await fetch(
					`https://test.apbco.co.za/switchboard/api/public/index.php/status/current/?departmentid=${departmentId}`
				);
				const data = await response.json();
				if (data.status) {
					setUsers(data.data);
					setError("");
				} else {
					setError(data.message || "Failed to fetch users");
				}
			} catch (err) {
				setError("Failed to fetch users" + err);
			} finally {
				setLoading(false);
			}
		};

		fetchUsers(); // initial fetch
		const interval = setInterval(fetchUsers, 1000); // fetch every 5 seconds

		return () => clearInterval(interval); // cleanup on unmount
	}, [departmentId]);

	// Sorting & filtering logic
	const filteredUsers = useMemo(() => {
		let filtered = users;

		if (search.trim()) {
			const s = search.toLowerCase();
			filtered = filtered.filter(
				(u) =>
					u.user_first_name.toLowerCase().includes(s) ||
					u.extension_number.toLowerCase().includes(s) ||
					u.status_name.toLowerCase().includes(s) ||
					u.updated_at.toLowerCase().includes(s)
			);
		}

		const getSortableValue = (
			user: User,
			key: keyof User
		): string | number => {
			if (key === "updated_at") {
				return new Date(user.updated_at).getTime(); // returns number (timestamp)
			}
			const val = user[key];
			// val is string for name/email/status, so just return as is
			return typeof val === "string" ? val.toLowerCase() : val;
		};

		filtered = filtered.sort((a, b) => {
			const aVal = getSortableValue(a, sortKey);
			const bVal = getSortableValue(b, sortKey);

			if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
			if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
			return 0;
		});

		return filtered;
	}, [users, search, sortKey, sortOrder]);

	// Toggle sort order or set new sort key
	const onSort = (key: keyof User) => {
		if (sortKey === key) {
			setSortOrder(sortOrder === "asc" ? "desc" : "asc");
		} else {
			setSortKey(key);
			setSortOrder("asc");
		}
	};

	useEffect(() => {
		const token = localStorage.getItem("token");
		const userStr = localStorage.getItem("user");
		let role = "";

		if (userStr) {
			try {
				const userObj = JSON.parse(userStr);

				role = userObj.user_role || "";
			} catch (err) {
				console.error("Failed to parse user from localStorage", err);
			}
		}

		if (!token || role === "user" || !departmentId) {
			router.replace("/login?unauthorized=true");
		}
	}, [departmentId, router]);

	return (
		<div className="max-w-6xl mx-auto mt-8 p-6 bg-white rounded-md shadow-md">
			<h1 className="text-3xl font-bold mb-6">Status Monitor</h1>

			{/* Search */}
			<div className="mb-4">
				<input
					type="text"
					placeholder="Search by name, email, or status..."
					value={search}
					onChange={(e) => setSearch(e.target.value)}
					className="w-full max-w-sm border rounded-md px-3 py-2"
				/>
			</div>

			<div className="bg-white rounded-lg shadow overflow-hidden">
				{loading ? (
					<div className="p-8 text-center">
						<div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
						<p className="mt-2 text-gray-600">Loading users...</p>
					</div>
				) : error ? (
					<div className="p-4 bg-red-50 border-l-4 border-red-500">
						<p className="text-red-700">{error}</p>
					</div>
				) : (
					<div className="overflow-x-auto">
						<table className="min-w-full divide-y divide-gray-200">
							<thead className="bg-gray-50">
								<tr>
									{[
										"name",
										"extension_number",
										"current_status",
										"updated_at",
									].map((key) => (
										<th
											key={key}
											onClick={() =>
												onSort(key as keyof User)
											}
											className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
										>
											<div className="flex items-center">
												{key.replace("_", " ")}
												{sortKey === key && (
													<span className="ml-1">
														{sortOrder === "asc"
															? "↑"
															: "↓"}
													</span>
												)}
											</div>
										</th>
									))}
								</tr>
							</thead>
							<tbody className="bg-white divide-y divide-gray-200">
								{filteredUsers.length === 0 ? (
									<tr>
										<td
											colSpan={6}
											className="px-6 py-4 text-center text-gray-500"
										>
											No users found
										</td>
									</tr>
								) : (
									filteredUsers.map((user) => (
										<tr
											key={user.id}
											className="hover:bg-gray-50"
										>
											<td className="px-6 py-4 whitespace-nowrap">
												<div className="flex items-center">
													<div className="ml-4">
														<div className="text-sm font-medium text-gray-900">
															{
																user.user_first_name
															}{" "}
															{
																user.user_last_name
															}
														</div>
													</div>
												</div>
											</td>
											<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
												{user.extension_number}
											</td>
											<td className="px-6 py-4 whitespace-nowrap">
												<span
													className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
														${
															statusColors[
																user.status_name as keyof typeof statusColors
															] ||
															statusColors[
																"Default"
															]
														}`}
												>
													{user.status_name}
												</span>
											</td>
											<td className="px-6 py-4 whitespace-nowrap">
												{
													formatDateTime(
														user.updated_at
													).relative
												}
											</td>
										</tr>
									))
								)}
							</tbody>
						</table>
					</div>
				)}
			</div>
		</div>
	);
}
