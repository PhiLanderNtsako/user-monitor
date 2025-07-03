export default function StatusBadge({
	status,
	compact = false,
}: {
	status: string;
	compact?: boolean;
}) {
	const statusColors = {
		Available: "bg-emerald-500 text-white",
		"On Lunch": "bg-amber-400 text-gray-800",
		"In a Meeting": "bg-blue-500 text-white",
		"On Leave": "bg-purple-500 text-white",
		"On Sick Leave": "bg-red-500 text-white",
		"Logged Out": "bg-gray-400 text-gray-800",
		"On Call": "bg-indigo-600 text-white",
		Away: "bg-yellow-300 text-gray-800",
		Busy: "bg-orange-500 text-white",
		"On Break": "bg-cyan-400 text-gray-800",
		Default: "bg-gray-200 text-gray-800",
	};

	const classes = statusColors[status as keyof typeof statusColors] || statusColors.Default;

	return (
		<span
			className={`inline-block rounded-full font-medium ${
				compact ? "text-xs px-2 py-1" : "text-xs px-2 py-1"
			} ${classes}`}
		>
			{status}
		</span>
	);
}
