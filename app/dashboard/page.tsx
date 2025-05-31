"use client";
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { formatDateTime } from "../utils/formatDateTime";
import LiveFormattedTime from "../components/LiveFormattedTime";

type User = {
  id: number;
  user_first_name: string;
  user_last_name: string;
  extension_number: string;
  user_email: string;
  status_name: string;
  status_note: string;
  updated_at: string;
};

type StatusUpdateForm = {
  status: string;
  note: string;
  start_time: string;
  end_time: string;
};

const STATUS_OPTIONS = ["Working", "On Break", "Out Sick", "Offline"];

export default function AdminPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<keyof User>("user_first_name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const [checkingAuth, setCheckingAuth] = useState(true);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<StatusUpdateForm>({
    status: "",
    note: "",
    start_time: "",
    end_time: "",
  });
  const [formSubmitting, setFormSubmitting] = useState(false);

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

  useEffect(() => {
    const fetchUsers = () => {
      fetch(
        "https://test.apbco.co.za/switchboard/api/public/index.php/status/current"
      )
        .then((res) => res.json())
        .then((data) => {
          if (data.status) {
            setUsers(data.data);
            setError("");
          } else {
            setError(data.message || "Failed to fetch users");
          }
        })
        .catch(() => setError("Failed to fetch users"));
    };

    fetchUsers(); // initial fetch
    const interval = setInterval(fetchUsers, 1000); // fetch every 5 seconds

    return () => clearInterval(interval); // cleanup on unmount
  }, []);

  // Sorting & filtering logic
  const filteredUsers = useMemo(() => {
    let filtered = users;

    if (search.trim()) {
      const s = search.toLowerCase();
      filtered = filtered.filter(
        (u) =>
          u.user_first_name.toLowerCase().includes(s) ||
          u.extension_number.toLowerCase().includes(s) ||
          u.status_name.toLowerCase().includes(s) ||
          u.updated_at.toLowerCase().includes(s)
      );
    }

    const getSortableValue = (user: User, key: keyof User): string | number => {
      if (key === "updated_at") {
        return new Date(user.updated_at).getTime(); // returns number (timestamp)
      }
      const val = user[key];
      // val is string for name/email/status, so just return as is
      return typeof val === "string" ? val.toLowerCase() : val;
    };

    filtered = filtered.sort((a, b) => {
      const aVal = getSortableValue(a, sortKey);
      const bVal = getSortableValue(b, sortKey);

      if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
      if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [users, search, sortKey, sortOrder]);

  // Toggle sort order or set new sort key
  const onSort = (key: keyof User) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortOrder("asc");
    }
  };

  // Open modal and reset form data for user
  const openModal = (user: User) => {
    setSelectedUser(user);
    setFormData({
      status: user.status_name || "",
      note: "",
      start_time: "",
      end_time: "",
    });
    setModalOpen(true);
  };

  // Handle form input change
  const handleFormChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  // Submit updated status for user
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    // Simple validation
    if (!formData.status || !formData.start_time || !formData.end_time) {
      alert("Please fill in all required fields.");
      return;
    }

    setFormSubmitting(true);

    try {
      const res = await fetch("https://your-api.com/api/statuses.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: selectedUser.id,
          ...formData,
        }),
      });
      const result = await res.json();

      if (result.success) {
        // Update user status locally for instant UI update
        setUsers((prev) =>
          prev.map((u) =>
            u.id === selectedUser.id
              ? {
                  ...u,
                  current_status: formData.status,
                  last_update: new Date().toISOString(),
                }
              : u
          )
        );
        setModalOpen(false);
      } else {
        alert(result.message || "Failed to update status");
      }
    } catch {
      alert("Failed to update status");
    } finally {
      setFormSubmitting(false);
    }
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

  // if (checkingAuth) return <p className="p-6">Checking permissions...</p>;

  return (
    <div className="max-w-6xl mx-auto mt-8 p-6 bg-white rounded-md shadow-md">
      <h1 className="text-3xl font-bold mb-6">Status Monitor</h1>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by name, email, or status..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-sm border rounded-md px-3 py-2"
        />
      </div>

      {/* Table */}
      {loading ? (
        <p>Loading users...</p>
      ) : error ? (
        <p className="text-red-600">{error}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto border-collapse border border-gray-300">
            <thead>
              <tr>
                {[
                  "name",
                  "extension_number",
                  "current_status",
                  "updated_at",
                ].map((key) => (
                  <th
                    key={key}
                    onClick={() => onSort(key as keyof User)}
                    className="cursor-pointer border border-gray-300 px-4 py-2 text-left select-none"
                  >
                    <div className="flex items-center gap-1">
                      {key.replace("_", " ").toUpperCase()}
                      {sortKey === key && (
                        <span>{sortOrder === "asc" ? "▲" : "▼"}</span>
                      )}
                    </div>
                  </th>
                ))}
                {/* <th className="border border-gray-300 px-4 py-2">Action</th> */}
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center p-4">
                    No users found.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-100">
                    <td className="border border-gray-300 px-4 py-2">
                      {user.user_first_name} {user.user_last_name}
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      {user.extension_number}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 flex items-center gap-2">
                      <span
                        className={`w-3 h-3 rounded-full inline-block ${
                          statusColors[user.status_name] ||
                          statusColors["Default"]
                        }`}
                      ></span>
                      {user.status_name}
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      {formatDateTime(user.updated_at).relative}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {modalOpen && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-md shadow-lg max-w-md w-full p-6 relative">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-2 right-2 text-gray-600 hover:text-gray-900"
              aria-label="Close"
            >
              ✕
            </button>

            <h2 className="text-xl font-semibold mb-4">
              Update Status for {selectedUser.user_first_name}
            </h2>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className="block mb-1 font-medium">Status *</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleFormChange}
                  required
                  className="w-full border rounded-md p-2"
                >
                  <option value="">Select status</option>
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block mb-1 font-medium">Note</label>
                <textarea
                  name="note"
                  value={formData.note}
                  onChange={handleFormChange}
                  rows={3}
                  className="w-full border rounded-md p-2"
                  placeholder="Optional note"
                />
              </div>

              <div>
                <label className="block mb-1 font-medium">Start Time *</label>
                <input
                  type="datetime-local"
                  name="start_time"
                  value={formData.start_time}
                  onChange={handleFormChange}
                  required
                  className="w-full border rounded-md p-2"
                />
              </div>

              <div>
                <label className="block mb-1 font-medium">End Time *</label>
                <input
                  type="datetime-local"
                  name="end_time"
                  value={formData.end_time}
                  onChange={handleFormChange}
                  required
                  className="w-full border rounded-md p-2"
                />
              </div>

              <button
                type="submit"
                disabled={formSubmitting}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {formSubmitting ? "Updating..." : "Update Status"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
