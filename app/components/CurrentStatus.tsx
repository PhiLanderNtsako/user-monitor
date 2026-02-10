"use client";

import LiveFormattedTime from "./LiveFormattedTime";
import { useCallback, useEffect, useState, useRef } from "react";
import toast from "react-hot-toast";
import { format, formatDistanceStrict, parseISO } from "date-fns";

const statusColors: Record<string, string> = {
  Available: "bg-emerald-500 text-white",
  "On Lunch": "bg-amber-400 text-gray-800",
  "In a Meeting": "bg-blue-500 text-white",
  "On Leave": "bg-purple-500 text-white",
  "On Sick Leave": "bg-red-500 text-white",
  "Logged Out": "bg-gray-400 text-white",
  "On Call": "bg-indigo-600 text-white",
  "Away from Desk": "bg-yellow-300 text-black",
  Busy: "bg-orange-500 text-white",
  "On Break": "bg-cyan-400 text-gray-800",
  Default: "bg-gray-200 text-gray-800",
};

type CurrentStatus = {
	id: number;
	status_name: string;
	status_note: string;
	start_time: string;
	end_time: string;
	created_at: string;
	updated_at: string;
	current_status_id: string;
	updated_by: string;
};

type StatusOption = {
	id: number;
	name: string;
};

type StatusLog = {
	id: number;
	status_name: string;
	status_note?: string;
	start_time: string;
	end_time: string;
	created_at: string;
};

type FormData = {
	note: string;
	start_time: string;
	end_time: string;
	status_id: number;
};


type CurrentStatusProps = {
  userId?: number;
}

function groupLogsByDate(logs: StatusLog[]) {
  return logs.reduce((acc, log) => {
    const dateKey = format(new Date(log.created_at), "yyyy-MM-dd");
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(log);
    return acc;
  }, {} as Record<string, StatusLog[]>);
}

export default function CurrentStatus({ userId }: CurrentStatusProps) {

	const [loading, setLoading] = useState(false);
	const [errorLogs, setErrorLogs] = useState("");
	const [currentStatus, setCurrentStatus] = useState<CurrentStatus[]>([]);
    const [statuses, setStatuses] = useState<StatusOption[]>([]);
	const [loadingLogs, setLoadingLogs] = useState(false);
  const successToastShown = useRef(false);
    const [statusLogs, setStatusLogs] = useState<StatusLog[]>([]);
  
    const [expandedDates, setExpandedDates] = useState<Record<string, boolean>>(
      {}
    );
    const groupedLogs = groupLogsByDate(statusLogs);
  
    const toggleDate = (date: string) => {
      setExpandedDates((prev) => ({
        ...prev,
        [date]: !prev[date],
      }));
    };

  
	const fetchCurrentStatus = useCallback(async () => {
		try {
			const response = await fetch(
				`https://api.apbco.co.za/switchboard/public/index.php/status/current/?userid=${userId}`
			);
			const data = await response.json();
			if (data.status === "success") {
				setCurrentStatus(data.data);
				if (!successToastShown.current) {
					toast.success("Status Loaded successfully.");
					successToastShown.current = true;
				}
			} else {
				setErrorLogs(data.message || "Failed to fetch status");
				toast.error(data?.message || "Failed to fetch status.");
			}
		} catch (err) {
			setErrorLogs("Failed to fetch user" + err);
		} finally {
			setLoading(false);
		}
  }, [userId]);

  	const fetchStatuses = useCallback(async () => {
		try {
			const response = await fetch(
				"https://api.apbco.co.za/switchboard/public/index.php/status/"
			);
			const data = await response.json();
			setStatuses(data.data);
		} catch (error) {
			console.error("Failed to load statuses", error);
		}
  }, []);
  
  	const fetchCurrentStatusLog = useCallback(async () => {
		try {
			const response = await fetch(
				`https://api.apbco.co.za/switchboard/public/index.php/status/log/?userid=${userId}`
			);
			const data = await response.json();
			if (data.status === "success") {
				setStatusLogs(data.data);
			} else {
				setErrorLogs(data.message || "Failed to fetch user");
			}
		} catch (err) {
			setErrorLogs("Failed to fetch user" + err);
		} finally {
			setLoadingLogs(false);
		}
	}, [userId]);

  
  	useEffect(() => {
		if (!userId) return;
		fetchCurrentStatus();
		fetchStatuses();
		fetchCurrentStatusLog();
    }, [userId,fetchCurrentStatus, fetchStatuses, fetchCurrentStatusLog]);
  
  	const onSubmit = async (formData: FormData) => {
		if (!userId) return;

      const currentStatusId = currentStatus?.[0]?.id;
		
		try {
			const res = await fetch(
				"https://api.apbco.co.za/switchboard/public/index.php/status/current/",
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						user_id: userId,
						current_status_id: currentStatusId,
            updated_by: userId,
            updated_at: new Date().toLocaleString("sv-SE"),
						...formData,
					}),
				}
      );

			const contentType = res.headers.get("content-type");

			if (!contentType || !contentType.includes("application/json")) {
				const raw = await res.text();
				console.error("Unexpected response (not JSON):", raw);
				toast.success("Unexpected server response. Contact support.");
				return;
			}

			const result = await res.json();

			if (result.status === "success") {
				toast.success("Status Updated.");
				fetchCurrentStatusLog();
				fetchCurrentStatus();
			} else {
				toast.error(result?.message || "Failed to save status.");
			}
		} catch (err) {
			toast.error("Failed to fetch users" + err);
		}
	};


  if (loading) {
    return <div className="text-center text-gray-500">Loading logs...</div>;
  }

  if (errorLogs) {
    return <div className="text-red-600 text-center">{errorLogs}</div>;
  }

  if (currentStatus.length === 0) {
    return <div className="text-center text-gray-600">No status logs found.</div>;
  }

  return (
    <>
      <section className="mb-10">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
                    Your Current Status
                  </h1>
                  <p className="text-gray-600">Update and view your status</p>
                </div>
              </div>
    <ul className="space-y-4">
      {currentStatus.map(({ id, status_name, status_note, created_at, updated_at }) => (
        <li
          key={id}
          className={`border border-gray-200 p-5 rounded-lg ${
            statusColors[(status_name?.trim() || "Default")] || statusColors["Default"]
          } shadow-sm hover:shadow-md transition-shadow`}
        >
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-2">
            <span className="text-sm font-semibold text-white-800">
              Status: <span>{status_name}</span>
            </span>
            <LiveFormattedTime timestamp={updated_at ?? created_at} />
          </div>
          {status_note && (
            <p className="text-sm text-gray-700">
              <span className="font-medium">Note:</span> {status_note}
            </p>
          )}
        </li>
      ))}
      </ul>
      </section>

    <section>
			<h2 className="text-xl font-semibold mb-4">
					Update Your Status
			</h2>
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {statuses.map((status) => (
        <button
          key={status.id}
          onClick={() =>
            onSubmit({
              status_id: status.id,
              note: "",
              start_time: new Date().toISOString(),
              end_time: new Date(Date.now() + 3600 * 1000).toISOString(),
            })
          }
          className={`hover:cursor-pointer px-4 py-4 rounded-full text-sm font-medium ${
            statusColors[status.name as keyof typeof statusColors] ||
            statusColors["Default"]
          }`}
        >
          {status.name}
        </button>
      ))}
      </div>
      </section>
      
      <section className="mt-8">
            <h2 className="text-xl font-semibold mb-4">User Status Logs</h2>
      
            {loadingLogs ? (
              <p>Loading logs...</p>
            ) : errorLogs ? (
              <p className="text-red-600">{errorLogs}</p>
            ) : statusLogs.length === 0 ? (
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
    </>
  );
}
