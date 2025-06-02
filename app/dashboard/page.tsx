"use client";
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { formatDateTime } from "../utils/formatDateTime";

type User = {
	id: number;
	user_first_name: string;
	user_last_name: string;
	extension_number: string;
	user_email: string;
	status_name: string;
	status_note: string;
	updated_at: string;
};

export default function AdminPage() {
	const router = useRouter();
	const [users, setUsers] = useState<User[]>([]);
	const [error, setError] = useState("");

	const [search, setSearch] = useState("");
	const [sortKey, setSortKey] = useState<keyof User>("user_first_name");
	const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

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

	useEffect(() => {
		const fetchUsers = () => {
			fetch(
				"https://test.apbco.co.za/switchboard/api/public/index.php/status/current"
			)
				.then((res) => res.json())
				.then((data) => {
					if (data.status) {
						setUsers(data.data);
						setError("");
					} else {
						setError(data.message || "Failed to fetch users");
					}
				})
				.catch(() => setError("Failed to fetch users"));
		};

		fetchUsers(); // initial fetch
		const interval = setInterval(fetchUsers, 1000); // fetch every 5 seconds

		return () => clearInterval(interval); // cleanup on unmount
	}, []);

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

		if (!token || role === "user") {
			router.replace("/login?unauthorized=true");
		}
	}, [router]);

	// if (checkingAuth) return <p className="p-6">Checking permissions...</p>;

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

			{/* Table */}
			{error ? (
				<p className="text-red-600">{error}</p>
			) : (
				<div className="overflow-x-auto">
					<table className="min-w-full table-auto border-collapse border border-gray-300">
						<thead>
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
										className="cursor-pointer border border-gray-300 px-4 py-2 text-left select-none"
									>
										<div className="flex items-center gap-1">
											{key
												.replace("_", " ")
												.toUpperCase()}
											{sortKey === key && (
												<span>
													{sortOrder === "asc"
														? "▲"
														: "▼"}
												</span>
											)}
										</div>
									</th>
								))}
								{/* <th className="border border-gray-300 px-4 py-2">Action</th> */}
							</tr>
						</thead>
						<tbody>
							{filteredUsers.length === 0 ? (
								<tr>
									<td colSpan={5} className="text-center p-4">
										No users found.
									</td>
								</tr>
							) : (
								filteredUsers.map((user) => (
									<tr
										key={user.id}
										className="hover:bg-gray-100"
									>
										<td className="border border-gray-300 px-4 py-2">
											{user.user_first_name}{" "}
											{user.user_last_name}
										</td>
										<td className="border border-gray-300 px-4 py-2">
											{user.extension_number}
										</td>
										<td className="border border-gray-300 px-4 py-2 flex items-center gap-2">
											<span
												className={`w-3 h-3 rounded-full inline-block ${
													statusColors[
														user.status_name as keyof typeof statusColors
													] || statusColors["Default"]
												}`}
											></span>
											{user.status_name}
										</td>
										<td className="border border-gray-300 px-4 py-2">
											{
												formatDateTime(user.updated_at)
													.relative
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
	);
}
