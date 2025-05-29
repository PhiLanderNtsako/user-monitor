"use client";

import { useEffect, useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

type User = {
  user_id: number;
  first_name: string;
  last_name: string;
  extension_number: string;
  email: string;
  role: string;
  created_at: string;
  department_name: string;
  status_name?: string; // optional if not always available
};

type StatusLog = {
  id: number;
  status_name: string;
  status_note: string;
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

export default function UserPage() {
  // Assume user ID is stored in localStorage after login
    const { user_id } = useParams();
    
      const authUser =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("user") || "{}")
      : null;
  const authUserId = authUser?.id;

  const [logs, setLogs] = useState<StatusLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [errorLogs, setErrorLogs] = useState("");
  const [statuses, setStatuses] = useState<StatusOption[]>([]);
    const [currentStatus, setCurrentStatus] = useState<CurrentStatus[]>([]);
  const [user, setUser] = useState<User[]>([]);
  const [error, setError] = useState("");
    
    const [loading, setLoading] = useState(true);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
    } = useForm<FormData>();
    

  useEffect(() => {
    const fetchUsers = () => {
      fetch(
        `https://test.apbco.co.za/switchboard/api/public/index.php/users/?userid=${user_id}`
      )
        .then((res) => res.json())
          .then((data) => {
              if (data.status === "success") {
                  setUser(data.data[0]);
            setError("");
          } else {
            setError(data.message || "Failed to fetch users");
          }
        })
        .catch(() => setError("Failed to fetch users"));
    };

    fetchUsers(); // initial fetch
    const interval = setInterval(fetchUsers, 10000); // fetch every 10 seconds

      return () => clearInterval(interval); // cleanup on unmount

  }, [user_id]);
    
      if (error) {
    return (
      <div className="text-center text-red-600 mt-10">
        <p>{error}</p>
      </div>
    );
    }
    
      if (!user) {
    return (
      <div className="text-center mt-10">
        <p>Loading user details...</p>
      </div>
    );
  }
    
    
  // Fetch status logs on mount & userId change
  useEffect(() => {
    if (!authUserId) return;

    setLoadingLogs(true);
    
    fetch(
      `https://test.apbco.co.za/switchboard/api/public/index.php/status/current/?userid=${user_id}`
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
  }, [user_id]);

  useEffect(() => {
    if (!authUserId) return;

    setLoadingLogs(true);
    fetch(
      `https://test.apbco.co.za/switchboard/api/public/index.php/status/log/?userid=${user_id}`
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
  }, [user_id]);

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
    if (!authUserId) return;

    const currentStatusId = currentStatus?.[0]?.id;

    try {
      const res = await fetch(
        "https://test.apbco.co.za/switchboard/api/public/index.php/status/current/",
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: user_id,
            current_status_id: currentStatusId,
            updated_by: authUserId,
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
        reset();
      } else {
        alert(result.message || "Failed to save status.");
      }
    } catch (err) {
      console.error("Fetch error:", err);
      alert("Failed to save status.");
    }
  };

  const fetchStatusLogs = async () => {
    if (!authUserId) return;
    try {
      const res = await fetch(
        `https://test.apbco.co.za/switchboard/api/public/index.php/status/log/?userid=${user_id}`
      );
      const data = await res.json();
      if (data.status) setLogs(data.data);
    } catch {
      console.error("Failed to refresh status logs.");
    }
  };

  const fetchCurrentStatus = async () => {
    if (!authUserId) return;
    try {
      const res = await fetch(
        `https://test.apbco.co.za/switchboard/api/public/index.php/status/current/?userid=${user_id}`
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
        <>
        <div className="max-w-3xl mx-auto mt-8">
            <h1 className="text-2xl font-bold mb-4">
                User Details: {user.first_name} {user.last_name}
            </h1>
            <div className="space-y-2">
                <p><strong>Email:</strong> {user.email}</p>
                <p><strong>Role:</strong> {user.user_role}</p>
                <p><strong>Department:</strong> {user.department_name}</p>
                <p><strong>Extension:</strong> {user.extension_number}</p>
                <p><strong>Created At:</strong> {new Date(user.created_at).toLocaleString()}</p>
            </div>
            <div className="mt-6">
                <Link href="/admin/users" className="text-blue-600 hover:underline">
                &larr; Back to Users
                </Link>
            </div>
        </div>
                
    <div className="max-w-3xl mx-auto mt-8 p-6 bg-white rounded-md shadow-md">
      <h1 className="text-2xl font-semibold mb-6">Your Current Status</h1>

      {/* Logs Section */}
      <section className="mb-8">
        {loadingLogs ? (
          <p>Loading logs...</p>
        ) : errorLogs ? (
          <p className="text-red-600">{errorLogs}</p>
        ) : currentStatus.length === 0 ? (
          <p>No status logs found.</p>
        ) : (
          <ul className="space-y-4">
            {currentStatus.map(
              ({
                id,
                status_name,
                status_note,
                start_time,
                end_time,
                created_at,
              }) => (
                <li key={id} className="border p-4 rounded-md bg-gray-50">
                        <div className="flex justify-between font-semibold">  
                    <div>        
                      <span
                        className={`mr-3 w-3 h-3 rounded-full inline-block ${
                          status_name === "Available"
                          ? "bg-green-500"
                          : status_name === "On Lunch"
                            ? "bg-yellow-500"
                            : status_name === "In a Meeting"
                            ? "bg-orange-500"
                            : status_name === "On Leave"
                            ? "bg-red-500"
                            : status_name === "On Sick Leave"
                            ? "bg-red-600"
                            : status_name === "Logged Out"
                            ? "bg-gray-500"
                            : status_name === "Away"
                            ? "bg-gray-700"
                            : "bg-gray-300"
                        }`}>      
                                </span>
                      <span>Status: {status_name}</span>
                        </div>
                    <span>
                      {new Date(start_time).toLocaleString()} -{" "}
                      {new Date(end_time).toLocaleString()}
                    </span>
                  </div>
                  {status_note && (
                    <p className="mt-2 text-gray-700">Note: {status_note}</p>
                  )}
                </li>
              )
            )}
          </ul>
        )}
      </section>
      {/* Logs Section */}

      {/* New Status Form */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Update Your Status</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block mb-1 font-medium">Status</label>
            <select
              {...register("status_id", { required: "Status is required" })}
              className="w-full border rounded-md p-2"
            >
              <option value="">Select status</option>
              {statuses.map((status) => (
                <option key={status.id} value={status.id}>
                  {status.name}
                </option>
              ))}
            </select>
            {errors.status_id && (
              <p className="text-red-600 text-sm">{errors.status_id.message}</p>
            )}
          </div>

          <div>
            <label className="block mb-1 font-medium">Note</label>
            <textarea
              {...register("note")}
              rows={3}
              className="w-full border rounded-md p-2"
              placeholder="Optional note"
            />
          </div>

          <div>
            <label className="block mb-1 font-medium">Start Time</label>
            <input
              type="date"
              {...register("start_time", {
                required: "Start time is required",
              })}
              className="w-full border rounded-md p-2"
            />
            {errors.start_time && (
              <p className="text-red-600 text-sm">
                {errors.start_time.message}
              </p>
            )}
          </div>

          <div>
            <label className="block mb-1 font-medium">End Time</label>
            <input
              type="date"
              {...register("end_time", { required: "End time is required" })}
              className="w-full border rounded-md p-2"
            />
            {errors.end_time && (
              <p className="text-red-600 text-sm">{errors.end_time.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition disabled:opacity-50"
          >
            {isSubmitting ? "Saving..." : "Save Status"}
          </button>
        </form>
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
          <ul className="space-y-4">
            {logs.map(
              ({
                id,
                status_name,
                status_note,
                start_time,
                end_time,
                created_at,
              }) => (
                <li key={id} className="border p-4 rounded-md bg-gray-50">
                  <div className="flex justify-between font-semibold">
                    <span>Status: {status_name}</span>
                    <span>{new Date(created_at).toLocaleString()} - </span>
                  </div>
                  {status_note && (
                    <p className="mt-2 text-gray-700">Note: {status_note}</p>
                  )}
                </li>
              )
            )}
          </ul>
        )}
      </section>
            </div>
    </>
            
  );
}
