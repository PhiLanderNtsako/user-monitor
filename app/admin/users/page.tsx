"use client";
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import Link from "next/link";

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

type Departments = {
	id: number;
	name: string;
};

type FormData = {
	first_name: string;
	last_name: string;
	email: string;
	extension_number: string;
	cellphone: string;
	telephone: string;
	password: string;
	department_id: number;
	verification_code: string;
	role_id: number;
};

export default function UsersPage() {
	const user =
		typeof window !== "undefined"
			? JSON.parse(localStorage.getItem("user") || "{}")
			: null;
	const userId = user?.id;
	const departmentId = user?.department;
	const [submitMessage, setSubmitMessage] = useState({ text: "", type: "" });
	const router = useRouter();
	const [users, setUsers] = useState<User[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [departments, setDepartments] = useState<Departments[]>([]);

	const [search, setSearch] = useState("");
	const [sortKey, setSortKey] = useState<keyof User>("first_name");
	const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

	const {
		register,
		handleSubmit,
		reset,
		formState: { errors, isSubmitting },
	} = useForm<FormData>();

	useEffect(() => {
		const fetchUsers = async () => {
			try {
				const response = await fetch(
					`https://test.apbco.co.za/switchboard/api/public/index.php/users/?departmentid=${departmentId}`
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

		fetchUsers();
		const interval = setInterval(fetchUsers, 10000);
		return () => clearInterval(interval);
	}, []);

	useEffect(() => {
		const fetchDepartments = async () => {
			try {
				const response = await fetch(
					`https://test.apbco.co.za/switchboard/api/public/index.php/users/departments/?departmentid=${departmentId}`
				);
				const data = await response.json();
				setDepartments(data.data);
			} catch (error) {
				console.error("Failed to load departments", error);
			}
		};

		fetchDepartments();
	}, []);

	// Sorting & filtering logic
	const filteredUsers = useMemo(() => {
		let filtered = users;

		if (search.trim()) {
			const s = search.toLowerCase();
			filtered = filtered.filter(
				(u) =>
					u.department_name.toLowerCase().includes(s) ||
					u.user_role.toLowerCase().includes(s) ||
					u.email.toLowerCase().includes(s) ||
					u.extension_number.toLowerCase().includes(s)
			);
		}

		const getSortableValue = (
			user: User,
			key: keyof User
		): string | number => {
			if (key === "created_at") {
				return new Date(user.created_at).getTime(); // returns number (timestamp)
			}
			const val = user[key];
			if (val === undefined) return "";
			return typeof val === "string" ? val.toLowerCase() : val;
		};

		return [...filtered].sort((a, b) => {
			const aVal = getSortableValue(a, sortKey);
			const bVal = getSortableValue(b, sortKey);
			return sortOrder === "asc"
				? aVal < bVal
					? -1
					: 1
				: aVal > bVal
				? -1
				: 1;
		});
	}, [users, search, sortKey, sortOrder]);

	const onSort = (key: keyof User) => {
		setSortOrder((prev) =>
			sortKey === key ? (prev === "asc" ? "desc" : "asc") : "asc"
		);
		setSortKey(key);
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

	const onSubmit = async (formData: FormData) => {
		if (!userId) return;
		setSubmitMessage({ text: "", type: "" });

		try {
			const res = await fetch(
				"https://test.apbco.co.za/switchboard/api/public/index.php/users/",
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(formData),
				}
			);

			const result = await res.json();

			if (result.status === "success") {
				setSubmitMessage({
					text: "✅ User successfully saved! Redirecting...",
					type: "success",
				});
				reset();
				setTimeout(() => {
					router.push(`/admin/users/${result.id}`);
				}, 2000);
			} else {
				setSubmitMessage({
					text: result.message || "❌ Failed to save user.",
					type: "error",
				});
			}
		} catch (err) {
			console.error("Error:", err);
			setSubmitMessage({
				text: "❌ Failed to save user due to network error.",
				type: "error",
			});
		}
	};

	const getMessageClass = (type: string) => {
		switch (type) {
			case "success":
				return "bg-green-100 border-green-400 text-green-700";
			case "error":
				return "bg-red-100 border-red-400 text-red-700";
			default:
				return "bg-blue-100 border-blue-400 text-blue-700";
		}
	};

	return (
		<div className="max-w-6xl mx-auto p-4 sm:p-6">
			{/* Header */}
			<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
				<div>
					<h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
						User Management
					</h1>
					<p className="text-gray-600">Manage all system users</p>
				</div>
				<button
					onClick={() => setIsModalOpen(true)}
					className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors w-full sm:w-auto"
				>
					Add New User
				</button>
			</div>

			{/* Search */}
			<div className="mb-6">
				<input
					type="text"
					placeholder="Search by name, email, department or role..."
					value={search}
					onChange={(e) => setSearch(e.target.value)}
					className="w-full max-w-md border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
				/>
			</div>

			{/* Table */}
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
										"email",
										"department_name",
										"user_role",
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
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Actions
									</th>
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
											key={user.user_id}
											className="hover:bg-gray-50"
										>
											<td className="px-6 py-4 whitespace-nowrap">
												<div className="flex items-center">
													<div className="ml-4">
														<div className="text-sm font-medium text-gray-900">
															{user.first_name}{" "}
															{user.last_name}
														</div>
													</div>
												</div>
											</td>
											<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
												{user.extension_number}
											</td>
											<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
												{user.email}
											</td>
											<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
												{user.department_name}
											</td>
											<td className="px-6 py-4 whitespace-nowrap">
												<span
													className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                          ${
								user.user_role === "admin"
									? "bg-purple-100 text-purple-800"
									: user.user_role === "operator"
									? "bg-blue-100 text-blue-800"
									: "bg-green-100 text-green-800"
							}`}
												>
													{user.user_role}
												</span>
											</td>
											<td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
												<Link
													href={`/admin/users/${user.user_id}`}
													className="text-blue-600 hover:text-blue-900 mr-3"
												>
													View
												</Link>
											</td>
										</tr>
									))
								)}
							</tbody>
						</table>
					</div>
				)}
			</div>

			{/* Add User Modal */}
			{isModalOpen && (
				<div className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
					<div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
						<div className="p-6">
							<div className="flex justify-between items-center mb-4">
								<h2 className="text-xl font-bold text-gray-800">
									Add New User
								</h2>
								<button
									onClick={() => {
										setIsModalOpen(false);
										setSubmitMessage({
											text: "",
											type: "",
										});
										reset();
									}}
									className="text-gray-500 hover:text-gray-700"
								>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										className="h-6 w-6"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M6 18L18 6M6 6l12 12"
										/>
									</svg>
								</button>
							</div>

							{submitMessage.text && (
								<div
									className={`mb-4 p-3 border rounded-md ${getMessageClass(
										submitMessage.type
									)}`}
								>
									{submitMessage.text}
								</div>
							)}

							<form
								onSubmit={handleSubmit(onSubmit)}
								className="space-y-4"
							>
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-1">
											First Name *
										</label>
										<input
											type="text"
											{...register("first_name", {
												required:
													"First name is required",
											})}
											className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
										/>
										{errors.first_name && (
											<p className="mt-1 text-sm text-red-600">
												{errors.first_name.message}
											</p>
										)}
									</div>

									<div>
										<label className="block text-sm font-medium text-gray-700 mb-1">
											Last Name *
										</label>
										<input
											type="text"
											{...register("last_name", {
												required:
													"Last name is required",
											})}
											className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
										/>
										{errors.last_name && (
											<p className="mt-1 text-sm text-red-600">
												{errors.last_name.message}
											</p>
										)}
									</div>
								</div>

								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-1">
											Email *
										</label>
										<input
											type="email"
											{...register("email", {
												required: "Email is required",
												pattern: {
													value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
													message:
														"Invalid email address",
												},
											})}
											className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
										/>
										{errors.email && (
											<p className="mt-1 text-sm text-red-600">
												{errors.email.message}
											</p>
										)}
									</div>

									<div>
										<label className="block text-sm font-medium text-gray-700 mb-1">
											Extension *
										</label>
										<input
											type="text"
											{...register("extension_number", {
												required:
													"Extension is required",
												pattern: {
													value: /^[0-9]+$/,
													message:
														"Only numbers are allowed",
												},
											})}
											className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
										/>
										{errors.extension_number && (
											<p className="mt-1 text-sm text-red-600">
												{
													errors.extension_number
														.message
												}
											</p>
										)}
									</div>
								</div>

								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-1">
											Cellphone
										</label>
										<input
											type="tel"
											{...register("cellphone")}
											className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
										/>
									</div>

									<div>
										<label className="block text-sm font-medium text-gray-700 mb-1">
											Telephone
										</label>
										<input
											type="tel"
											{...register("telephone")}
											className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
										/>
									</div>
								</div>

								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-1">
											Role *
										</label>
										<select
											{...register("role_id", {
												required: "Role is required",
											})}
											className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
										>
											<option value="">
												Select role
											</option>
											<option value="2">Admin</option>
											<option value="3">Operator</option>
											<option value="1">User</option>
										</select>
										{errors.role_id && (
											<p className="mt-1 text-sm text-red-600">
												{errors.role_id.message}
											</p>
										)}
									</div>

									<div>
										<label className="block text-sm font-medium text-gray-700 mb-1">
											Department
										</label>
										<select
											{...register("department_id")}
											className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
										>
											{departments.map((department) => (
												<option
													key={department.id}
													value={department.id}
												>
													{department.name}
												</option>
											))}
										</select>
									</div>
								</div>

								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-1">
											Password *
										</label>
										<input
											type="password"
											{...register("password", {
												required:
													"Password is required",
											})}
											className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
										/>
										{errors.password && (
											<p className="mt-1 text-sm text-red-600">
												{errors.password.message}
											</p>
										)}
									</div>
								</div>

								<div className="flex justify-end space-x-3 pt-4">
									<button
										type="button"
										onClick={() => {
											setIsModalOpen(false);
											setSubmitMessage({
												text: "",
												type: "",
											});
											reset();
										}}
										className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
									>
										Cancel
									</button>
									<button
										type="submit"
										disabled={isSubmitting}
										className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-70 flex items-center justify-center min-w-[120px]"
									>
										{isSubmitting ? (
											<>
												<svg
													className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
													xmlns="http://www.w3.org/2000/svg"
													fill="none"
													viewBox="0 0 24 24"
												>
													<circle
														className="opacity-25"
														cx="12"
														cy="12"
														r="10"
														stroke="currentColor"
														strokeWidth="4"
													></circle>
													<path
														className="opacity-75"
														fill="currentColor"
														d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
													></path>
												</svg>
												Saving...
											</>
										) : (
											"Save User"
										)}
									</button>
								</div>
							</form>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}


