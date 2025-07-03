import { User } from "../utils/Types";
import Link from "next/link";
import { formatDateTime } from "../utils/formatDateTime";

export default function UserTable({
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
	const columns: { label: string; key: keyof User | "name" }[] = [
		{ label: "Name", key: "name" },
		{ label: "Department", key: "department_name" },
		{ label: "Extension", key: "extension_number" },
		{ label: "Email", key: "email" },
		{ label: "Created At", key: "created_at" },
	];

	const getSortSymbol = (key: keyof User | "name") => {
		if (key === "name" && sortKey === "user_last_name") return sortOrder === "asc" ? "↑" : "↓";
		if (key === sortKey) return sortOrder === "asc" ? "↑" : "↓";
		return "";
	};

	return (
		<div className="overflow-x-auto">
			<table className="min-w-full divide-y divide-gray-200">
				<thead className="bg-gray-50">
					<tr>
						{columns.map(({ label, key }) => (
							<th
								key={label}
								onClick={() => onSort(key === "name" ? "last_name" : key)}
								className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
							>
								{label} <span className="ml-1">{getSortSymbol(key)}</span>
							</th>
						))}
						<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
								Actions
						</th>
					</tr>
				</thead>
				<tbody className="bg-white divide-y divide-gray-200">
					{users.length === 0 ? (
						<tr key="no-users">
							<td colSpan={4} className="px-6 py-4 text-center text-gray-500">
								No users found
							</td>
						</tr>
					) : (
						users.map((u) => (
							<tr key={u.user_id} className="hover:bg-gray-50">
								<td className="px-6 py-4">
									{u.last_name} {u.first_name}
								</td>
								<td className="px-6 py-4 text-sm text-gray-500">
									{u.department_name}
								</td>
								<td className="px-6 py-4 text-sm text-gray-500">
									{u.extension_number}
								</td>
								<td className="px-6 py-4">
									{u.email}
								</td>
								<td className="px-6 py-4">
									{formatDateTime(u.created_at).relative}
								</td>
								<td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
									<Link
										href={`/admin/users/${u.user_id}`}
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
	);
}
