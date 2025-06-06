"use client";

import { format, formatDistanceStrict, parseISO } from "date-fns";
import { useState } from "react";

type StatusLog = {
	id: number;
	status_name: string;
	status_note?: string;
	start_time: string;
	end_time: string;
	created_at: string;
};

type UserStatusLogProps = {
	logs: StatusLog[];
	loadingLogs: boolean;
	errorLogs: string;
};

function groupLogsByDate(logs: StatusLog[]) {
	return logs.reduce((acc, log) => {
		const dateKey = format(new Date(log.created_at), "yyyy-MM-dd");
		if (!acc[dateKey]) acc[dateKey] = [];
		acc[dateKey].push(log);
		return acc;
	}, {} as Record<string, StatusLog[]>);
}

export default function UserStatusLog({
	logs,
	loadingLogs,
	errorLogs,
}: UserStatusLogProps) {
	const [expandedDates, setExpandedDates] = useState<Record<string, boolean>>(
		{}
	);
	const groupedLogs = groupLogsByDate(logs);

	const toggleDate = (date: string) => {
		setExpandedDates((prev) => ({
			...prev,
			[date]: !prev[date],
		}));
	};

	return (
		<section className="mt-8">
			<h2 className="text-xl font-semibold mb-4">User Status Logs</h2>

			{loadingLogs ? (
				<p>Loading logs...</p>
			) : errorLogs ? (
				<p className="text-red-600">{errorLogs}</p>
			) : logs.length === 0 ? (
				<p>No status logs found.</p>
			) : (
				Object.entries(groupedLogs)
					.sort((a, b) => (a[0] > b[0] ? -1 : 1)) // latest dates first
					.map(([date, logsForDate]) => {
						return (
							<div
								key={date}
								className="mb-4 border rounded-lg shadow-sm"
							>
								<button
									onClick={() => toggleDate(date)}
									className="w-full text-left px-4 py-3 bg-gray-100 hover:bg-gray-200 font-semibold rounded-t-lg"
								>
									{format(new Date(date), "MMMM d, yyyy")} (
									{logsForDate.length} status change
									{logsForDate.length > 1 ? "s" : ""})
								</button>

								{expandedDates[date] && (
									<ul className="divide-y">
										{logsForDate
											.slice()
											.reverse()
											.map((log, index, reversedLogs) => {
												const {
													id,
													status_name,
													created_at,
												} = log;

												const previousLog =
													reversedLogs[index - 1];
												const duration =
													previousLog &&
													formatDistanceStrict(
														parseISO(created_at),
														parseISO(
															previousLog.created_at
														)
													);

												return (
													<li
														key={id}
														className="p-4 bg-white hover:bg-gray-50 transition"
													>
														<div className="flex justify-between items-center mb-1">
															<span className="text-sm font-medium text-gray-800">
																{status_name}
															</span>
															<span className="text-xs text-gray-500">
																{format(
																	new Date(
																		created_at
																	),
																	"hh:mm:ss a"
																)}
															</span>
														</div>
														{index === 0 ? (
															<p className="text-sm text-green-600 font-semibold">
																Currently active
															</p>
														) : (
															duration && (
																<p className="text-sm text-gray-500 italic">
																	Duration in
																	this status:{" "}
																	<strong>
																		{
																			duration
																		}
																	</strong>
																</p>
															)
														)}
													</li>
												);
											})}
									</ul>
								)}
							</div>
						);
					})
			)}
		</section>
	);
}
