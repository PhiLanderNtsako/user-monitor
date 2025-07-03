import { User } from "../utils/Types";
import StatusBadge from "./StatusBadge";
import { formatDateTime } from "../utils/formatDateTime";
import { useAuth } from "../utils/AuthContext";

export default function DashboardTable({
	users,
	sortKey,
	sortOrder,
	onSort,
}: {
	users: User[];
	sortKey: keyof User;
	sortOrder: "asc" | "desc";
	onSort: (key: keyof User) => void;
}) {
	const { sessionUser } = useAuth();
	const user_role = sessionUser?.user_role;
	const columns: { label: string; key: keyof User | "name" }[] = [
		{ label: "Name", key: "name" },
		{ label: "Department", key: "department_name" },
		{ label: "Extension", key: "extension_number" },
		{ label: "Current Status", key: "status_name" },
		{ label: "Updated At", key: "updated_at" },
	];

	const getSortSymbol = (key: keyof User | "name") => {
		if (key === "name" && sortKey === "user_last_name") return sortOrder === "asc" ? "↑" : "↓";
		if (key === sortKey) return sortOrder === "asc" ? "↑" : "↓";
		return "";
	};

	const visibleUsers = user_role === 'super'
	? users
	: users.filter(u => u.department_name !== "IT");

	return (
		<div className="overflow-x-auto">
			<table className="min-w-full divide-y divide-gray-200">
				<thead className="bg-gray-100">
					<tr>
						{columns.map(({ label, key }) => (
							<th
								key={label}
								onClick={() =>
									onSort(
										key === "name" ? "user_last_name" : key
									)
								}
								className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
							>
								{label}{" "}
								<span className="ml-1">
									{getSortSymbol(key)}
								</span>
							</th>
						))}
					</tr>
				</thead>
				<tbody className="divide-y divide-gray-200">
					{visibleUsers.length === 0 ? (
						<tr>
							<td
								colSpan={5}
								className="text-center px-6 py-4 text-gray-500"
							>
								No users found
							</td>
						</tr>
					) : (
						visibleUsers.map((u) => (
							<tr key={u.id} className="hover:bg-gray-50">
								<td className="px-6 py-4">
									{u.user_last_name} {u.user_first_name}
								</td>
								<td className="px-6 py-4 text-gray-600">
									{u.department_name}
								</td>
								<td className="px-6 py-4 text-gray-600">
									{u.extension_number}
								</td>
								<td className="px-6 py-4">
									<StatusBadge
										status={u.status_name}
										compact
									/>
								</td>
								<td className="px-6 py-4 text-gray-600">
									{formatDateTime(u.updated_at).relative}
								</td>
							</tr>
						))
					)}
				</tbody>
			</table>
		</div>
	);
}
