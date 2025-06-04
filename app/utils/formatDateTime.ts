export function formatDateTime(dateString?: string | null) {
	if (!dateString) {
		return {
			formatted: "N/A",
			relative: "N/A",
		};
	}

	const fixedTimestamp = dateString.replace(" ", "T");
	const date = new Date(fixedTimestamp);

	const formatted = date.toLocaleString("en-US", {
		month: "short", // "May"
		day: "numeric", // "30"
		year: "numeric", // "2025"
		hour: "numeric", // "12"
		minute: "2-digit",
		second: "2-digit",
		hour12: true, // "PM"
	});

	const relative = getRelativeTime(date);

	return {
		formatted, // e.g., "May 30, 2025, 12:39:12 PM"
		relative, // e.g., "5 minutes ago"
	};
}

function getRelativeTime(date: Date): string {
	const now = new Date();
	const seconds = Math.floor((now.getTime() - date.getTime()) / 1000) - 62;

	if (seconds < 10) {
		return "just now";
	} else if (seconds < 60) {
		return `${seconds} second${seconds !== 1 ? "s" : ""} ago`;
	} else if (seconds < 3600) {
		const minutes = Math.floor(seconds / 60);
		return `${minutes} minute${minutes !== 1 ? "s" : ""} ago`;
	} else if (seconds < 86400) {
		const hours = Math.floor(seconds / 3600);
		return `${hours} hour${hours !== 1 ? "s" : ""} ago`;
	} else if (seconds < 2592000) {
		const days = Math.floor(seconds / 86400);
		return `${days} day${days !== 1 ? "s" : ""} ago`;
	} else if (seconds < 31536000) {
		const months = Math.floor(seconds / 2592000);
		return `${months} month${months !== 1 ? "s" : ""} ago`;
	} else {
		const years = Math.floor(seconds / 31536000);
		return `${years} year${years !== 1 ? "s" : ""} ago`;
	}
}
