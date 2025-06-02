// ErrorMessage.tsx
"use client";

import { useSearchParams } from "next/navigation";

export default function ErrorMessage() {
	const params = useSearchParams();
	const error = params.get("error");

	if (error === "unauthorized") {
		return (
			<p className="text-red-600 mb-4">
				You must be logged in to access the admin page.
			</p>
		);
	}

	return null;
}
