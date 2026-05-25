import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api";

function ManageUsers() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("ALL");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [editingUser, setEditingUser] = useState(null); // user being edited
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    const role = localStorage.getItem("role");
    if (role !== "ROLE_SUPER_ADMIN") {
      navigate("/admin/dashboard");
      return;
    }
    fetchUsers();
  }, [navigate]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get("/users");
      setUsers(res.data);
    } catch (err) {
      setError("Failed to load users.");
    } finally {
      setLoading(false);
    }
  };

  const showMsg = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(""), 4000);
  };

  const handleRoleChange = async (userId, newRole) => {
    setActionLoading(`role-${userId}`);
    try {
      await api.patch(`/users/${userId}`, { role: newRole });
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)),
      );
      showMsg("✅ Role updated!");
    } catch (err) {
      setError(err.response?.data || "Failed to update role.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (userId, username) => {
    if (!window.confirm(`"${username}" ကို တကယ် ဖျက်မလား?`)) return;
    setActionLoading(`delete-${userId}`);
    try {
      await api.delete(`/users/${userId}`);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      showMsg("🗑️ User deleted.");
    } catch (err) {
      setError(err.response?.data || "Failed to delete user.");
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = users.filter((u) => {
    const searchMatch =
      search === "" ||
      u.username?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase());
    const roleMatch = filterRole === "ALL" || u.role === filterRole;
    return searchMatch && roleMatch;
  });

  const roleColor = (role) => {
    const map = {
      ROLE_SUPER_ADMIN: "bg-rose-500/10 text-rose-400 border-rose-500/20",
      ROLE_SUB_ADMIN: "bg-orange-500/10 text-orange-400 border-orange-500/20",
      ROLE_VOLUNTEER: "bg-blue-500/10 text-blue-400 border-blue-500/20",
      ROLE_PUBLIC: "bg-slate-500/10 text-slate-400 border-slate-500/20",
    };
    return map[role] || "bg-slate-500/10 text-slate-400 border-slate-500/20";
  };

  const roleLabel = (role) => role?.replace("ROLE_", "") || "—";

  const currentUserId = localStorage.getItem("userId");

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 border-b border-slate-800 pb-5">
          <div>
            <h1 className="text-2xl font-black bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              👥 Manage Users
            </h1>
            <p className="text-xs text-gray-500 mt-1 font-mono">
              {filtered.length} of {users.length} users · Super Admin only
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={fetchUsers}
              className="bg-slate-800 hover:bg-slate-700 text-gray-300 border border-slate-700 text-xs px-4 py-2 rounded-xl transition cursor-pointer font-semibold"
            >
              🔄 Refresh
            </button>
            <button
              onClick={() => navigate("/admin/dashboard")}
              className="bg-slate-900 hover:bg-slate-800 text-xs border border-slate-800 px-4 py-2 rounded-xl transition cursor-pointer"
            >
              ← Back
            </button>
          </div>
        </div>

        {/* Messages */}
        {message && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 rounded-xl text-sm text-center">
            {message}
          </div>
        )}
        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3 rounded-xl text-sm text-center">
            {error}
            <button
              onClick={() => setError("")}
              className="ml-2 underline cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {
              label: "Total Users",
              value: users.length,
              color: "border-slate-700",
              icon: "👥",
            },
            {
              label: "Admins",
              value: users.filter((u) => u.role?.includes("ADMIN")).length,
              color: "border-rose-500/20",
              icon: "🛡️",
            },
            {
              label: "Volunteers",
              value: users.filter((u) => u.role === "ROLE_VOLUNTEER").length,
              color: "border-blue-500/20",
              icon: "🤝",
            },
            {
              label: "Public",
              value: users.filter((u) => u.role === "ROLE_PUBLIC").length,
              color: "border-slate-600",
              icon: "👤",
            },
          ].map((s) => (
            <div
              key={s.label}
              className={`bg-slate-900/50 border ${s.color} rounded-2xl p-4 flex items-center gap-3`}
            >
              <span className="text-2xl">{s.icon}</span>
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider font-mono">
                  {s.label}
                </p>
                <p className="text-xl font-black text-white">{s.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Search by username or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-slate-900 border border-slate-800 focus:border-purple-500/50 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none"
          />
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none"
          >
            <option value="ALL">All Roles</option>
            <option value="ROLE_SUPER_ADMIN">SUPER_ADMIN</option>
            <option value="ROLE_SUB_ADMIN">SUB_ADMIN</option>
            <option value="ROLE_VOLUNTEER">VOLUNTEER</option>
            <option value="ROLE_PUBLIC">PUBLIC</option>
          </select>
        </div>

        {/* Table */}
        {loading ? (
          <div className="text-center py-16 text-purple-400 animate-pulse text-sm">
            Loading users...
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-slate-900/20 border border-slate-800 border-dashed rounded-2xl">
            <p className="text-gray-500 text-sm">No users found.</p>
          </div>
        ) : (
          <div className="bg-slate-900/30 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/60 text-[10px] uppercase font-mono tracking-wider text-gray-500">
                    <th className="p-4">#</th>
                    <th className="p-4">Username</th>
                    <th className="p-4">Email</th>
                    <th className="p-4">Phone</th>
                    <th className="p-4">Role</th>
                    <th className="p-4">Verified</th>
                    <th className="p-4">Joined</th>
                    <th className="p-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50 text-xs text-gray-300">
                  {filtered.map((u) => (
                    <tr
                      key={u.id}
                      className={`hover:bg-slate-900/30 transition ${String(u.id) === String(currentUserId) ? "bg-teal-500/5" : ""}`}
                    >
                      <td className="p-4 font-mono text-gray-600">#{u.id}</td>
                      <td className="p-4">
                        <span className="font-bold text-white">
                          {u.username}
                          {String(u.id) === String(currentUserId) && (
                            <span className="ml-1.5 text-[9px] text-teal-400 font-mono">
                              (you)
                            </span>
                          )}
                        </span>
                      </td>
                      <td className="p-4 text-gray-400">{u.email}</td>
                      <td className="p-4 text-gray-500 font-mono">
                        {u.phoneNumber || "—"}
                      </td>
                      <td className="p-4">
                        {/* Role change dropdown */}
                        {String(u.id) !== String(currentUserId) ? (
                          <select
                            value={u.role}
                            onChange={(e) =>
                              handleRoleChange(u.id, e.target.value)
                            }
                            disabled={actionLoading === `role-${u.id}`}
                            className={`text-[10px] font-mono px-2 py-1 rounded border bg-slate-950 focus:outline-none cursor-pointer ${roleColor(u.role)}`}
                          >
                            <option value="ROLE_PUBLIC">PUBLIC</option>
                            <option value="ROLE_VOLUNTEER">VOLUNTEER</option>
                            <option value="ROLE_SUB_ADMIN">SUB_ADMIN</option>
                            <option value="ROLE_SUPER_ADMIN">
                              SUPER_ADMIN
                            </option>
                          </select>
                        ) : (
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-mono border ${roleColor(u.role)}`}
                          >
                            {roleLabel(u.role)}
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        {u.verified ? (
                          <span className="text-emerald-400 text-[11px]">
                            ✅ Yes
                          </span>
                        ) : (
                          <span className="text-gray-600 text-[11px]">
                            — No
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-gray-500 font-mono text-[10px]">
                        {u.createdAt
                          ? new Date(u.createdAt).toLocaleDateString()
                          : "—"}
                      </td>
                      <td className="p-4 text-center">
                        {String(u.id) !== String(currentUserId) ? (
                          <button
                            onClick={() => handleDelete(u.id, u.username)}
                            disabled={actionLoading === `delete-${u.id}`}
                            className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 font-bold py-1.5 px-3 rounded-lg text-[10px] transition cursor-pointer disabled:opacity-40"
                          >
                            {actionLoading === `delete-${u.id}`
                              ? "..."
                              : "🗑️ Delete"}
                          </button>
                        ) : (
                          <span className="text-gray-700 text-[10px]">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-3 border-t border-slate-800 text-[10px] text-gray-600 font-mono">
              Showing {filtered.length} of {users.length} users
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ManageUsers;
