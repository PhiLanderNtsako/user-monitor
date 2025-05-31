"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import LiveFormattedTime from "../components/LiveFormattedTime"; // Client-side logic
import { format } from "date-fns";
import EditUserModal from "@/app/components/EditUserModal";

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

type StatusLog = {
  id: number;
  status_name: string;
  status_note?: string;
  start_time: string;
  end_time: string;
  created_at: string;
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

type FormData = {
  note: string;
  start_time: string;
  end_time: string;
  status_id: number;
};

function groupLogsByDate(logs: StatusLog[]) {
  return logs.reduce((acc, log) => {
    const dateKey = format(new Date(log.created_at), "yyyy-MM-dd");
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(log);
    return acc;
  }, {} as Record<string, StatusLog[]>);
}

export default function UserPage() {
  // Assume user ID is stored in localStorage after login
  const user =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("user") || "{}")
      : null;
  const userId = user?.id;

  const [logs, setLogs] = useState<StatusLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [errorLogs, setErrorLogs] = useState("");
  const [statuses, setStatuses] = useState<StatusOption[]>([]);
  const [userData, setUserData] = useState<User | null>(null);
  const [currentStatus, setCurrentStatus] = useState<CurrentStatus[]>([]);
  const [expandedDates, setExpandedDates] = useState<Record<string, boolean>>(
    {}
  );
  const [isModalOpen, setIsModalOpen] = useState(false);

  const groupedLogs = groupLogsByDate(logs);

  const toggleDate = (date: string) => {
    setExpandedDates((prev) => ({
      ...prev,
      [date]: !prev[date],
    }));
  };

  const getStatusColor = (statusName) => {
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

    return statusColors[statusName] || statusColors["Default"];
  };

  // Fetch status logs on mount & userId change
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch(
          `https://test.apbco.co.za/switchboard/api/public/index.php/users/?userid=${userId}`
        );
        const data = await response.json();
        console.log(data);
        if (data.status === "success") {
          setUserData(data.data[0]);
        } else {
          setErrorLogs(data.message || "Failed to fetch user");
        }
      } catch (err) {
        setErrorLogs("Failed to fetch user" + err);
      } finally {
        setLoadingLogs(false);
      }
    };

    fetchUser();
  }, [userId]);

  useEffect(() => {
    if (!userId) return;

    setLoadingLogs(true);
    fetch(
      `https://test.apbco.co.za/switchboard/api/public/index.php/status/current/?userid=${userId}`
    )
      .then((res) => res.json())
      .then((data) => {
        if (data.status) {
          setCurrentStatus(data.data);
          setErrorLogs("");
        } else {
          setErrorLogs(data.message || "Failed to load logs.");
        }
      })
      .catch(() => setErrorLogs("Failed to load logs."))
      .finally(() => setLoadingLogs(false));
  }, [userId]);

  useEffect(() => {
    if (!userId) return;

    setLoadingLogs(true);
    fetch(
      `https://test.apbco.co.za/switchboard/api/public/index.php/status/log/?userid=${userId}`
    )
      .then((res) => res.json())
      .then((data) => {
        if (data.status) {
          setLogs(data.data);
          setErrorLogs("");
        } else {
          setErrorLogs(data.message || "Failed to load logs.");
        }
      })
      .catch(() => setErrorLogs("Failed to load logs."))
      .finally(() => setLoadingLogs(false));
  }, [userId]);

  useEffect(() => {
    const fetchStatuses = async () => {
      try {
        const response = await fetch(
          "https://test.apbco.co.za/switchboard/api/public/index.php/status/"
        );
        const data = await response.json();
        setStatuses(data.data);
      } catch (error) {
        console.error("Failed to load statuses", error);
      }
    };

    fetchStatuses();
  }, []);

  const onSubmit = async (formData: FormData) => {
    if (!userId) return;

    const currentStatusId = currentStatus?.[0]?.id;

    try {
      const res = await fetch(
        "https://test.apbco.co.za/switchboard/api/public/index.php/status/current/",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: userId,
            current_status_id: currentStatusId,
            updated_by: userId,
            ...formData,
          }),
        }
      );

      const contentType = res.headers.get("content-type");

      if (!contentType || !contentType.includes("application/json")) {
        const raw = await res.text();
        console.error("Unexpected response (not JSON):", raw);
        alert("Unexpected server response. Contact support.");
        return;
      }

      const result = await res.json();

      if (result.status === "success") {
        // alert(result.message || "Failed to save status.");
        fetchStatusLogs();
        fetchCurrentStatus();
      } else {
        alert(result.message || "Failed to save status.");
      }
    } catch (err) {
      console.error("Fetch error:", err);
      alert("Failed to save status.");
    }
  };

  const fetchStatusLogs = async () => {
    if (!userId) return;
    try {
      const res = await fetch(
        `https://test.apbco.co.za/switchboard/api/public/index.php/status/log/?userid=${userId}`
      );
      const data = await res.json();
      if (data.status) setLogs(data.data);
    } catch {
      console.error("Failed to refresh status logs.");
    }
  };

  const fetchCurrentStatus = async () => {
    if (!userId) return;
    try {
      const res = await fetch(
        `https://test.apbco.co.za/switchboard/api/public/index.php/status/current/?userid=${userId}`
      );
      const data = await res.json();
      if (data.status) setCurrentStatus(data.data);
    } catch {
      console.error("Failed to refresh current status.");
    }
  };

  const router = useRouter();
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token"); // or sessionStorage, cookie, etc.

    if (!token) {
      router.replace("/login?error=unauthorized");
    } else {
      setAuthorized(true);
    }
  }, [router]);

  if (authorized === null) {
    return <p>Checking login...</p>; // You can show a spinner here
  }

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 mt-8 p-6 bg-white rounded-md shadow-md">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
            Your Current Status
          </h1>
          <p className="text-gray-600">Update and view your status</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-gray-100 hover:bg-gray-600 text-black hover:text-white  px-4 py-2 rounded-md transition-colors w-full sm:w-auto cursor-pointer"
        >
          Update Profile
        </button>
      </div>

      {/* Logs Section */}
      <section className="mb-10">
        {loadingLogs ? (
          <div className="text-center text-gray-500">Loading logs...</div>
        ) : errorLogs ? (
          <div className="text-red-600 text-center">{errorLogs}</div>
        ) : currentStatus.length === 0 ? (
          <div className="text-center text-gray-600">No status logs found.</div>
        ) : (
          <ul className="space-y-4">
            {currentStatus.map(
              ({ id, status_name, status_note, created_at, updated_at }) => {
                return (
                  <li
                    key={id}
                    className={`border border-gray-200 p-5 rounded-lg ${getStatusColor(
                      status_name
                    )} shadow-sm hover:shadow-md transition-shadow`}
                  >
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-2">
                      <span className="text-sm font-semibold text-white-800">
                        Status:{" "}
                        <span
                          className={`text-sm font-semibold text-white-800`}
                        >
                          {status_name}
                        </span>
                      </span>
                      <LiveFormattedTime timestamp={updated_at ?? created_at} />
                    </div>
                    {status_note && (
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">Note:</span> {status_note}
                      </p>
                    )}
                  </li>
                );
              }
            )}
          </ul>
        )}
      </section>

      {/* New Status Form */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Update Your Status</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {statuses.map((status) => (
            <button
              key={status.id}
              onClick={() =>
                onSubmit({
                  status_id: status.id,
                  note: "", // You can add default note logic here
                  start_time: new Date().toISOString(),
                  end_time: new Date(Date.now() + 3600 * 1000).toISOString(), // 1 hour later
                })
              }
              className={`hover:cursor-pointer px-4 py-4 rounded-full text-sm font-medium ${getStatusColor(
                status.name
              )}`}
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
        ) : logs.length === 0 ? (
          <p>No status logs found.</p>
        ) : (
          Object.entries(groupedLogs)
            .sort((a, b) => (a[0] > b[0] ? -1 : 1)) // latest dates first
            .map(([date, logsForDate]) => (
              <div key={date} className="mb-4 border rounded-lg shadow-sm">
                <button
                  onClick={() => toggleDate(date)}
                  className="w-full text-left px-4 py-3 bg-gray-100 hover:bg-gray-200 font-semibold rounded-t-lg"
                >
                  {format(new Date(date), "MMMM d, yyyy")} ({logsForDate.length}{" "}
                  log
                  {logsForDate.length > 1 ? "s" : ""})
                </button>

                {expandedDates[date] && (
                  <ul className="divide-y">
                    {logsForDate.map(
                      ({ id, status_name, status_note, created_at }) => (
                        <li
                          key={id}
                          className="p-4 bg-white hover:bg-gray-50 transition"
                        >
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm font-medium text-gray-800">
                              {status_name}
                            </span>
                            <span className="text-xs text-gray-500">
                              {format(new Date(created_at), "hh:mm:ss a")}
                            </span>
                          </div>
                          {status_note && (
                            <p className="text-sm text-gray-600">
                              Note: {status_note}
                            </p>
                          )}
                        </li>
                      )
                    )}
                  </ul>
                )}
              </div>
            ))
        )}
      </section>
      {/* Edit User Modal */}
      {isModalOpen && (
        <EditUserModal
          userData={userData}
          modalClose={() => setIsModalOpen(false)}
          user_id={userId}
        />
      )}
    </div>
  );
}
