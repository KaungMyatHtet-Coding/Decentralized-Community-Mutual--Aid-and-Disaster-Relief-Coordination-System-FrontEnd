import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api";

const STATUS_FILTERS = [
  "ALL",
  "PENDING",
  "VERIFIED",
  "IN_PROGRESS",
  "RESOLVED",
  "REJECTED",
];

const statusColor = (status) => {
  switch (status) {
    case "VERIFIED":
      return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
    case "IN_PROGRESS":
      return "text-blue-400 bg-blue-500/10 border-blue-500/20";
    case "RESOLVED":
      return "text-gray-400 bg-gray-500/10 border-gray-500/20";
    case "REJECTED":
      return "text-rose-400 bg-rose-500/10 border-rose-500/20";
    default:
      return "text-amber-400 bg-amber-500/10 border-amber-500/20";
  }
};

const categoryEmoji = (cat) => {
  const map = {
    FOOD: "🍚",
    MEDICINE: "💊",
    WATER: "💧",
    CLOTHING: "👕",
    SHELTER: "🏠",
    OTHER: "📦",
  };
  return map[cat] || "📦";
};

function AdminAidRequests() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [actionLoading, setActionLoading] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [search, setSearch] = useState("");

  // ── fetch ──────────────────────────────────────────────
  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await api.get("/aid-requests");
      setRequests(res.data);
    } catch {
      setError("Failed to load aid requests.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  // ── actions ────────────────────────────────────────────
  const updateStatus = async (id, status) => {
    setActionLoading(`${id}-${status}`);
    try {
      await api.patch(`/aid-requests/${id}/status?status=${status}`);
      setMessage(`✅ Request #${id} marked as ${status}`);
      fetchRequests();
      setTimeout(() => setMessage(""), 4000);
    } catch (err) {
      setError(err.response?.data || "Failed to update status.");
    } finally {
      setActionLoading(null);
    }
  };

  // ── filter ─────────────────────────────────────────────
  const filtered = requests.filter((r) => {
    const statusMatch = selectedStatus === "ALL" || r.status === selectedStatus;
    const searchMatch =
      search === "" ||
      r.title?.toLowerCase().includes(search.toLowerCase()) ||
      r.township?.toLowerCase().includes(search.toLowerCase()) ||
      r.reporter?.username?.toLowerCase().includes(search.toLowerCase());
    return statusMatch && searchMatch;
  });

  const pendingCount = requests.filter((r) => r.status === "PENDING").length;

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 border-b border-slate-800 pb-5">
          <div>
            <h1 className="text-2xl font-black bg-gradient-to-r from-rose-400 to-orange-400 bg-clip-text text-transparent">
              🆘 Aid Request Management
            </h1>
            <p className="text-xs text-gray-400 mt-1">
              {filtered.length} request{filtered.length !== 1 ? "s" : ""} shown
              {pendingCount > 0 && (
                <span className="ml-2 text-amber-400 animate-pulse font-mono">
                  · {pendingCount} pending review
                </span>
              )}
            </p>
          </div>
          <button
            onClick={() => navigate("/admin/dashboard")}
            className="bg-slate-900 hover:bg-slate-800 text-xs border border-slate-800 px-4 py-2 rounded-xl transition cursor-pointer self-start"
          >
            ← Back to Dashboard
          </button>
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

        {/* Search + Filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Search by title, township, or username..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-slate-900 border border-slate-800 focus:border-rose-500 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none"
          />
          <div className="flex flex-wrap gap-2">
            {STATUS_FILTERS.map((s) => (
              <button
                key={s}
                onClick={() => setSelectedStatus(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                  selectedStatus === s
                    ? "bg-rose-500 text-slate-950 border-rose-500"
                    : "bg-slate-900 text-gray-400 border-slate-800 hover:border-slate-600"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        {loading ? (
          <div className="text-center py-16 text-rose-400 animate-pulse text-sm">
            Loading aid requests...
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((req) => (
              <div
                key={req.id}
                className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition space-y-3"
              >
                {/* Top row */}
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">
                      {req.categories?.map((c) => categoryEmoji(c)).join("") ||
                        "📦"}
                    </span>
                    <div>
                      <h3 className="font-bold text-white text-sm">
                        {req.title}
                      </h3>
                      <p className="text-[11px] text-gray-500 font-mono">
                        📍 {req.township}, {req.wardOrVillage}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-mono border self-start ${statusColor(req.status)}`}
                  >
                    {req.status}
                  </span>
                </div>

                {/* Categories */}
                <div className="flex flex-wrap gap-1">
                  {req.categories?.map((cat) => (
                    <span
                      key={cat}
                      className="px-2 py-0.5 bg-slate-800 text-gray-300 rounded text-[10px] font-mono"
                    >
                      {categoryEmoji(cat)} {cat}
                    </span>
                  ))}
                </div>

                {/* Description */}
                <p className="text-xs text-gray-400 leading-relaxed">
                  {req.description}
                </p>

                {/* Meta */}
                <div className="flex flex-wrap items-center gap-4 text-[11px] text-gray-500">
                  <span>📞 {req.contactPhone}</span>
                  <span>👤 {req.reporter?.username || "Anonymous"}</span>
                  <span>
                    🕐{" "}
                    {req.createdAt
                      ? new Date(req.createdAt).toLocaleDateString()
                      : "—"}
                  </span>
                  <span>👍 {req.upvoteCount || 0} upvotes</span>
                </div>

                {/* Admin Actions */}
                {req.status === "PENDING" && (
                  <div className="flex flex-wrap gap-2 pt-1 border-t border-slate-800">
                    <button
                      disabled={actionLoading !== null}
                      onClick={() => updateStatus(req.id, "VERIFIED")}
                      className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-1.5 rounded-lg text-xs transition cursor-pointer disabled:opacity-40"
                    >
                      {actionLoading === `${req.id}-VERIFIED`
                        ? "..."
                        : "✔ Verify"}
                    </button>
                    <button
                      disabled={actionLoading !== null}
                      onClick={() => updateStatus(req.id, "IN_PROGRESS")}
                      className="bg-blue-500 hover:bg-blue-400 text-slate-950 font-bold px-4 py-1.5 rounded-lg text-xs transition cursor-pointer disabled:opacity-40"
                    >
                      {actionLoading === `${req.id}-IN_PROGRESS`
                        ? "..."
                        : "🔄 In Progress"}
                    </button>
                    <button
                      disabled={actionLoading !== null}
                      onClick={() => updateStatus(req.id, "REJECTED")}
                      className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 font-bold px-4 py-1.5 rounded-lg text-xs transition cursor-pointer disabled:opacity-40"
                    >
                      {actionLoading === `${req.id}-REJECTED`
                        ? "..."
                        : "❌ Reject"}
                    </button>
                  </div>
                )}

                {req.status === "VERIFIED" && (
                  <div className="flex flex-wrap gap-2 pt-1 border-t border-slate-800">
                    <button
                      disabled={actionLoading !== null}
                      onClick={() => updateStatus(req.id, "RESOLVED")}
                      className="bg-gray-500 hover:bg-gray-400 text-white font-bold px-4 py-1.5 rounded-lg text-xs transition cursor-pointer disabled:opacity-40"
                    >
                      {actionLoading === `${req.id}-RESOLVED`
                        ? "..."
                        : "✅ Mark Resolved"}
                    </button>
                    <button
                      disabled={actionLoading !== null}
                      onClick={() => updateStatus(req.id, "IN_PROGRESS")}
                      className="bg-blue-500 hover:bg-blue-400 text-slate-950 font-bold px-4 py-1.5 rounded-lg text-xs transition cursor-pointer disabled:opacity-40"
                    >
                      {actionLoading === `${req.id}-IN_PROGRESS`
                        ? "..."
                        : "🔄 In Progress"}
                    </button>
                  </div>
                )}

                {req.status === "IN_PROGRESS" && (
                  <div className="flex flex-wrap gap-2 pt-1 border-t border-slate-800">
                    <button
                      disabled={actionLoading !== null}
                      onClick={() => updateStatus(req.id, "RESOLVED")}
                      className="bg-gray-500 hover:bg-gray-400 text-white font-bold px-4 py-1.5 rounded-lg text-xs transition cursor-pointer disabled:opacity-40"
                    >
                      {actionLoading === `${req.id}-RESOLVED`
                        ? "..."
                        : "✅ Mark Resolved"}
                    </button>
                  </div>
                )}
              </div>
            ))}

            {filtered.length === 0 && !loading && (
              <div className="text-center py-20 bg-slate-900/20 border border-slate-800 border-dashed rounded-2xl">
                <p className="text-gray-400 text-sm">No aid requests found.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminAidRequests;
