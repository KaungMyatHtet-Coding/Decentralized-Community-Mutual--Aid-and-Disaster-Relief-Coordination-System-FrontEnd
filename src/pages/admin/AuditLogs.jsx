import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api";

function AuditLogs() {
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterAction, setFilterAction] = useState("ALL");
  const [filterEntity, setFilterEntity] = useState("ALL");

  useEffect(() => {
    const role = localStorage.getItem("role");
    if (role !== "ROLE_SUPER_ADMIN") {
      navigate("/admin/dashboard");
      return;
    }
    fetchLogs();
  }, [navigate]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await api.get("/audit-logs");
      // Newest first
      const sorted = res.data.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );
      setLogs(sorted);
    } catch (err) {
      console.error("Failed to fetch audit logs", err);
    } finally {
      setLoading(false);
    }
  };

  // Unique actions + entities for filter dropdowns
  const uniqueActions = ["ALL", ...new Set(logs.map((l) => l.action))];
  const uniqueEntities = ["ALL", ...new Set(logs.map((l) => l.entityType))];

  const filtered = logs.filter((l) => {
    const searchMatch =
      search === "" ||
      l.action?.toLowerCase().includes(search.toLowerCase()) ||
      l.performedBy?.username?.toLowerCase().includes(search.toLowerCase()) ||
      l.entityType?.toLowerCase().includes(search.toLowerCase());
    const actionMatch = filterAction === "ALL" || l.action === filterAction;
    const entityMatch = filterEntity === "ALL" || l.entityType === filterEntity;
    return searchMatch && actionMatch && entityMatch;
  });

  const timeAgo = (dateStr) => {
    if (!dateStr) return "—";
    const diff = Math.floor((new Date() - new Date(dateStr)) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return new Date(dateStr).toLocaleDateString();
  };

  const entityColor = (type) => {
    const map = {
      DONATION: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      ITEM_DONATION: "bg-blue-500/10 text-blue-400 border-blue-500/20",
      AID_REQUEST: "bg-rose-500/10 text-rose-400 border-rose-500/20",
      CAMPAIGN: "bg-teal-500/10 text-teal-400 border-teal-500/20",
      USER: "bg-purple-500/10 text-purple-400 border-purple-500/20",
      VOLUNTEER: "bg-orange-500/10 text-orange-400 border-orange-500/20",
    };
    return map[type] || "bg-slate-500/10 text-slate-400 border-slate-500/20";
  };

  const actionIcon = (action) => {
    if (action?.includes("CREATE") || action?.includes("SUBMIT")) return "➕";
    if (action?.includes("UPDATE") || action?.includes("APPROVE")) return "✏️";
    if (action?.includes("DELETE") || action?.includes("REJECT")) return "🗑️";
    if (action?.includes("LOGIN")) return "🔐";
    return "📋";
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 border-b border-slate-800 pb-5">
          <div>
            <h1 className="text-2xl font-black bg-gradient-to-r from-slate-300 to-slate-500 bg-clip-text text-transparent">
              🔍 Audit Logs
            </h1>
            <p className="text-xs text-gray-500 mt-1 font-mono">
              {filtered.length} of {logs.length} records · Super Admin only
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={fetchLogs}
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

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Search by admin, action, entity..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-slate-900 border border-slate-800 focus:border-slate-600 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none"
          />
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none"
          >
            {uniqueActions.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
          <select
            value={filterEntity}
            onChange={(e) => setFilterEntity(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none"
          >
            {uniqueEntities.map((e) => (
              <option key={e} value={e}>{e}</option>
            ))}
          </select>
        </div>

        {/* Table */}
        {loading ? (
          <div className="text-center py-16 text-slate-500 animate-pulse text-sm">
            Loading audit logs...
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-slate-900/20 border border-slate-800 border-dashed rounded-2xl">
            <p className="text-gray-500 text-sm">No logs found.</p>
          </div>
        ) : (
          <div className="bg-slate-900/30 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/60 text-[10px] uppercase font-mono tracking-wider text-gray-500">
                    <th className="p-4">#</th>
                    <th className="p-4">Admin</th>
                    <th className="p-4">Action</th>
                    <th className="p-4">Entity</th>
                    <th className="p-4">Entity ID</th>
                    <th className="p-4">Old Value</th>
                    <th className="p-4">New Value</th>
                    <th className="p-4">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50 text-xs text-gray-300">
                  {filtered.map((l) => (
                    <tr key={l.id} className="hover:bg-slate-900/30 transition">
                      <td className="p-4 font-mono text-gray-600">#{l.id}</td>
                      <td className="p-4 font-bold text-white">
                        {l.performedBy?.username || "—"}
                      </td>
                      <td className="p-4">
                        <span className="flex items-center gap-1.5">
                          <span>{actionIcon(l.action)}</span>
                          <span className="font-mono text-[11px] text-gray-300">{l.action}</span>
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono border ${entityColor(l.entityType)}`}>
                          {l.entityType}
                        </span>
                      </td>
                      <td className="p-4 font-mono text-gray-500">
                        #{l.entityId}
                      </td>
                      <td className="p-4 max-w-[140px]">
                        {l.oldValue ? (
                          <span className="text-rose-400/70 font-mono text-[10px] truncate block">
                            {l.oldValue}
                          </span>
                        ) : (
                          <span className="text-gray-700">—</span>
                        )}
                      </td>
                      <td className="p-4 max-w-[140px]">
                        {l.newValue ? (
                          <span className="text-emerald-400/70 font-mono text-[10px] truncate block">
                            {l.newValue}
                          </span>
                        ) : (
                          <span className="text-gray-700">—</span>
                        )}
                      </td>
                      <td className="p-4 text-gray-500 font-mono text-[10px]">
                        {timeAgo(l.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-3 border-t border-slate-800 text-[10px] text-gray-600 font-mono">
              Showing {filtered.length} of {logs.length} logs
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AuditLogs;
