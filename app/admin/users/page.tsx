"use client";
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
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
};

type Departments = {
  id: number;
  name: string;
};

type FormData = {
  first_name: string;
  last_name: string;
  email: string;
  extension_number: string;
  cellphone: string;
  telephone: string;
  password: string;
  department_id: number;
  verification_code: string;
  role_id: number;
};

export default function UsersPage() {
    const user =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("user") || "{}")
      : null;
  const userId = user?.id;

  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
    const [departments, setDepartments] = useState<Departments[]>([]);

  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<keyof User>("first_name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

    const {
      register,
      handleSubmit,
      reset,
      formState: { errors, isSubmitting },
    } = useForm<FormData>();

  useEffect(() => {
    const fetchUsers = () => {
      fetch(
        "https://test.apbco.co.za/switchboard/api/public/index.php/users/"
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
    const interval = setInterval(fetchUsers, 10000); // fetch every 10 seconds

    return () => clearInterval(interval); // cleanup on unmount
  }, []);
    
    useEffect(() => {
    const fetchStatuses = async () => {
      try {
        const response = await fetch(
          "https://test.apbco.co.za/switchboard/api/public/index.php/users/departments/"
        );
        const data = await response.json();
        console.log(data)
        setDepartments(data.data);
      } catch (error) {
        console.error("Failed to load statuses", error);
      }
    };

    fetchStatuses();
  }, []);

  // Sorting & filtering logic
  const filteredUsers = useMemo(() => {
    let filtered = users;

    if (search.trim()) {
      const s = search.toLowerCase();
      filtered = filtered.filter(
        (u) =>
          u.first_name.toLowerCase().includes(s) ||
          u.email.toLowerCase().includes(s) ||
          u.extension_number.toLowerCase().includes(s)
      );
    }

    const getSortableValue = (user: User, key: keyof User): string | number => {
      if (key === "created_at") {
        return new Date(user.created_at).getTime(); // returns number (timestamp)
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
  
  const onSubmit = async (formData: FormData) => {
    if (!userId) return;

    try {
      const res = await fetch(
        "https://test.apbco.co.za/switchboard/api/public/index.php/users/",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
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
        reset();
      } else {
        alert(result.message || "Failed to save status.");
      }
    } catch (err) {
      console.error("Fetch error:", err);
      alert("Failed to save status.");
    }
  };

  return (
      <div className="max-w-6xl mx-auto mt-8 p-6 bg-white rounded-md shadow-md">
      {/* Header with Add User button inline */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Admin: User Status Management</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
        >
          Add New User
        </button>
      </div>

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
                {["name", "extension_number", "email", "deparment", "role"].map(
                  (key) => (
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
                  )
                )}
                <th className="border border-gray-300 px-4 py-2">Action</th>
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
                  <tr key={user.user_id} className="hover:bg-gray-100">
                    <td className="border border-gray-300 px-4 py-2">
                      {user.first_name} {user.last_name}
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      {user.extension_number}
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      {user.email}
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      {user.department_name}
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      {new Date(user.created_at).toLocaleString()}
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                        <Link
                        href={`/admin/users/${user.user_id}`}
                        className="text-blue-500 hover:underline"
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
          )}
         {/* Add User Modal */}
{isModalOpen && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white rounded-md shadow-lg max-w-2xl w-full p-6 relative">
      <button
        onClick={() => setIsModalOpen(false)}
        className="absolute top-2 right-2 text-gray-600 hover:text-gray-900"
        aria-label="Close"
      >
        ✕
      </button>

      <h2 className="text-xl font-semibold mb-4">Add New User</h2>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Name Row */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block mb-1 font-medium">First Name *</label>
            <input
              type="text"
              {...register("first_name", { required: "First name is required" })}
              className="w-full border rounded-md p-2"
            />
            {errors.first_name && (
              <p className="text-red-600 text-sm">{errors.first_name.message}</p>
            )}
          </div>

          <div>
            <label className="block mb-1 font-medium">Last Name *</label>
            <input
              type="text"
              {...register("last_name", { required: "Last name is required" })}
              className="w-full border rounded-md p-2"
            />
            {errors.last_name && (
              <p className="text-red-600 text-sm">{errors.last_name.message}</p>
            )}
          </div>
        </div>

        {/* Contact Row */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block mb-1 font-medium">Email *</label>
            <input
              type="email"
              {...register("email", { 
                required: "Email is required",
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: "Invalid email address"
                }
              })}
              className="w-full border rounded-md p-2"
            />
            {errors.email && (
              <p className="text-red-600 text-sm">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block mb-1 font-medium">Extension Number *</label>
            <input
              type="text"
              {...register("extension_number", { 
                required: "Extension is required",
                pattern: {
                  value: /^[0-9]+$/,
                  message: "Only numbers are allowed"
                }
              })}
              className="w-full border rounded-md p-2"
            />
            {errors.extension_number && (
              <p className="text-red-600 text-sm">{errors.extension_number.message}</p>
            )}
          </div>
        </div>

        {/* Extension and Role Row */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block mb-1 font-medium">Cellphone</label>
            <input
              type="tel"
              {...register("cellphone")}
              className="w-full border rounded-md p-2"
            />
          </div>

          <div>
            <label className="block mb-1 font-medium">Telephone</label>
            <input
              type="tel"
              {...register("telephone")}
              className="w-full border rounded-md p-2"
            />
          </div>
          </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block mb-1 font-medium">Role *</label>
            <select
              {...register("role_id", { required: "Role is required" })}
              className="w-full border rounded-md p-2"
            >
              <option value="">Select role</option>
              <option value="2">Admin</option>
              <option value="3">Operator</option>
              <option value="1">User</option>
            </select>
            {errors.role_id && (
              <p className="text-red-600 text-sm">{errors.role_id.message}</p>
            )}
          </div>
        <div>
          <label className="block mb-1 font-medium">Department</label>
          <select
            {...register("department_id")}
            className="w-full border rounded-md p-2"
          >
            <option value="">Select Department</option>
            {departments.map((department) => (
              <option key={department.id} value={department.id}>
                {department.name}
              </option>
            ))}
          </select>
        </div>
              </div>
        <div className="grid grid-cols-2 gap-4">
              
        <div>
          <label className="block mb-1 font-medium">Password</label>
          <input
              type="password"
              {...register("password")}
              className="w-full border rounded-md p-2"
            />
        </div>
        <div>
          <label className="block mb-1 font-medium">verification Code</label>
          <input
              type="text"
              {...register("verification_code")}
              className="w-full border rounded-md p-2"
            />
        </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition disabled:opacity-50 w-full"
        >
          {isSubmitting ? "Adding User..." : "Add User"}
        </button>
      </form>
    </div>
  </div>
)}


    </div>
  );
}

