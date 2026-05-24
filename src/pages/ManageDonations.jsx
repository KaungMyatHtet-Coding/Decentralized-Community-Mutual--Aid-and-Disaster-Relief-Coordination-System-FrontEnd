import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import api from "../api";

const PIE_COLORS = ["#14b8a6", "#3b82f6", "#f59e0b", "#ef4444"];

function ManageDonations() {
  const [donations, setDonations] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(null);
  const navigate = useNavigate();

  // Filter states
  const [filters, setFilters] = useState({
    status: "",
    type: "",
    from: "",
    to: "",
    username: "",
  });

  // ── Data fetching ──────────────────────────────────────
  const fetchDonations = async (f = filters) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (f.status) params.append("status", f.status);
      if (f.type) params.append("type", f.type);
      if (f.from) params.append("from", f.from);
      if (f.to) params.append("to", f.to);
      if (f.username) params.append("username", f.username);

      const res = await api.get(`/donations/filter?${params.toString()}`);
      setDonations(res.data);
    } catch {
      setError("Failed to load donations.");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await api.get("/donations/stats");
      setStats(res.data);
    } catch {
      console.error("Stats load failed");
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    fetchDonations();
    fetchStats();
  }, []);

  // ── Actions ────────────────────────────────────────────
  const handleConfirm = async (id) => {
    setActionLoading(id);
    try {
      await api.patch(`/donations/${id}/confirm`);
      fetchDonations();
      fetchStats();
    } catch (err) {
      alert(err.response?.data || "Failed to confirm.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id) => {
    setActionLoading(id);
    try {
      await api.patch(`/donations/${id}/reject`);
      fetchDonations();
      fetchStats();
    } catch (err) {
      alert(err.response?.data || "Failed to reject.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleFilterChange = (e) =>
    setFilters({ ...filters, [e.target.name]: e.target.value });

  const handleSearch = () => fetchDonations(filters);

  const handleReset = () => {
    const reset = { status: "", type: "", from: "", to: "", username: "" };
    setFilters(reset);
    fetchDonations(reset);
  };

  // ── UI ─────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-7xl w-full mx-auto space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-800 pb-5">
          <div>
            <h1 className="text-2xl font-black bg-gradient-to-r from-rose-400 to-orange-400 bg-clip-text text-transparent">
              🛡️ Donation Management Panel
            </h1>
            <p className="text-xs text-gray-400 mt-1">
              Review, filter, and manage all community donations.
            </p>
          </div>
          <button
            onClick={() => navigate("/admin/dashboard")}
            className="bg-slate-900 hover:bg-slate-800 text-xs border border-slate-800 px-4 py-2 rounded-xl transition cursor-pointer"
          >
            ← Back to Dashboard
          </button>
        </div>

        {/* Summary Cards */}
        {!statsLoading && stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                label: "Total Donations",
                value: stats.totalDonations,
                color: "text-white",
              },
              {
                label: "Confirmed",
                value: stats.totalConfirmed,
                color: "text-emerald-400",
              },
              {
                label: "Pending",
                value: stats.totalPending,
                color: "text-amber-400",
              },
              {
                label: "Total Amount (MMK)",
                value: Number(stats.totalAmount || 0).toLocaleString(),
                color: "text-teal-400",
              },
            ].map((card) => (
              <div
                key={card.label}
                className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 space-y-1"
              >
                <p className="text-[10px] uppercase text-gray-500 tracking-wider">
                  {card.label}
                </p>
                <p className={`text-2xl font-black ${card.color}`}>
                  {card.value}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Charts Row */}
        {!statsLoading && stats && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Bar Chart — Monthly */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5">
              <h3 className="text-sm font-bold text-gray-300 mb-4">
                📊 Monthly Confirmed Donations (MMK)
              </h3>
              {stats.monthlyData?.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={stats.monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis
                      dataKey="month"
                      tick={{ fill: "#94a3b8", fontSize: 11 }}
                    />
                    <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0f172a",
                        border: "1px solid #1e293b",
                      }}
                      labelStyle={{ color: "#e2e8f0" }}
                    />
                    <Bar dataKey="total" fill="#14b8a6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-gray-500 text-xs text-center py-10">
                  No confirmed data yet.
                </p>
              )}
            </div>

            {/* Pie Chart — Type Breakdown */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5">
              <h3 className="text-sm font-bold text-gray-300 mb-4">
                🥧 Donation Type Breakdown
              </h3>
              {stats.typeData?.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={stats.typeData}
                      dataKey="count"
                      nameKey="type"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ type, percent }) =>
                        `${type} ${(percent * 100).toFixed(0)}%`
                      }
                    >
                      {stats.typeData.map((_, i) => (
                        <Cell
                          key={i}
                          fill={PIE_COLORS[i % PIE_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Legend
                      formatter={(v) => (
                        <span style={{ color: "#94a3b8", fontSize: 11 }}>
                          {v}
                        </span>
                      )}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0f172a",
                        border: "1px solid #1e293b",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-gray-500 text-xs text-center py-10">
                  No data yet.
                </p>
              )}
            </div>

            {/* Bar Chart — Top Campaigns */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 lg:col-span-2">
              <h3 className="text-sm font-bold text-gray-300 mb-4">
                🏆 Top Campaigns by Donation Amount (MMK)
              </h3>
              {stats.campaignData?.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={stats.campaignData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis
                      type="number"
                      tick={{ fill: "#94a3b8", fontSize: 11 }}
                    />
                    <YAxis
                      type="category"
                      dataKey="campaign"
                      tick={{ fill: "#94a3b8", fontSize: 10 }}
                      width={140}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0f172a",
                        border: "1px solid #1e293b",
                      }}
                    />
                    <Bar dataKey="total" fill="#6366f1" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-gray-500 text-xs text-center py-10">
                  No campaign data yet.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Filter Bar */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 space-y-4">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            🔍 Filter & Search
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            <input
              type="text"
              name="username"
              placeholder="Search username..."
              value={filters.username}
              onChange={handleFilterChange}
              className="bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none transition col-span-2 md:col-span-1"
            />
            <select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none transition"
            >
              <option value="">All Status</option>
              <option value="PENDING">PENDING</option>
              <option value="CONFIRMED">CONFIRMED</option>
              <option value="REJECTED">REJECTED</option>
            </select>
            <select
              name="type"
              value={filters.type}
              onChange={handleFilterChange}
              className="bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none transition"
            >
              <option value="">All Types</option>
              <option value="MONEY">MONEY</option>
              <option value="ITEMS">ITEMS</option>
            </select>
            <input
              type="date"
              name="from"
              value={filters.from}
              onChange={handleFilterChange}
              className="bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none transition"
            />
            <input
              type="date"
              name="to"
              value={filters.to}
              onChange={handleFilterChange}
              className="bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none transition"
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleSearch}
              className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold px-5 py-2 rounded-xl text-xs transition cursor-pointer"
            >
              Search
            </button>
            <button
              onClick={handleReset}
              className="bg-slate-800 hover:bg-slate-700 text-gray-300 px-5 py-2 rounded-xl text-xs transition cursor-pointer"
            >
              Reset
            </button>
          </div>
        </div>

        {loading && (
          <div className="text-center py-10 text-rose-400 animate-pulse text-xs">
            Loading donations...
          </div>
        )}
        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl text-center text-xs">
            {error}
          </div>
        )}

        {/* Donations Table */}
        {!loading && !error && donations.length > 0 && (
          <div className="bg-slate-900/30 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/60 text-[10px] uppercase font-mono tracking-wider text-gray-400">
                    <th className="p-4">Donor</th>
                    <th className="p-4">Campaign</th>
                    <th className="p-4">Type</th>
                    <th className="p-4">Contribution</th>
                    <th className="p-4">Receipt</th>
                    <th className="p-4">Date</th>
                    <th className="p-4 text-center">Status</th>
                    <th className="p-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50 text-xs text-gray-300">
                  {donations.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-900/20 transition"
                    >
                      <td className="p-4 font-bold text-white">
                        {item.donor?.username || "Anonymous"}
                      </td>
                      <td className="p-4 max-w-xs truncate text-gray-300">
                        {item.campaign?.title || `#${item.campaign?.id}`}
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                            item.donationType === "MONEY"
                              ? "bg-emerald-500/10 text-emerald-400"
                              : "bg-blue-500/10 text-blue-400"
                          }`}
                        >
                          {item.donationType}
                        </span>
                      </td>
                      <td className="p-4">
                        {item.donationType === "MONEY" ? (
                          <span className="font-bold text-emerald-400 font-mono">
                            {Number(item.amount).toLocaleString()} MMK
                          </span>
                        ) : (
                          <span>
                            {item.itemName} ({item.quantity} {item.unit})
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        <a
                          href={item.proofImageUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-teal-400 hover:underline font-mono text-[11px]"
                        >
                          🖼️ View
                        </a>
                      </td>
                      <td className="p-4 text-gray-400 font-mono">
                        {item.donatedAt
                          ? new Date(item.donatedAt).toLocaleDateString()
                          : "-"}
                      </td>
                      <td className="p-4 text-center">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-black font-mono ${
                            item.status === "CONFIRMED"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : item.status === "REJECTED"
                                ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                                : "bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse"
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className="p-4">
                        {item.status === "PENDING" && (
                          <div className="flex gap-2 justify-center">
                            <button
                              disabled={actionLoading !== null}
                              onClick={() => handleReject(item.id)}
                              className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 font-bold py-1.5 px-3 rounded-lg text-[10px] transition cursor-pointer disabled:opacity-40"
                            >
                              ❌ Reject
                            </button>
                            <button
                              disabled={actionLoading !== null}
                              onClick={() => handleConfirm(item.id)}
                              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-1.5 px-3 rounded-lg text-[10px] transition cursor-pointer disabled:opacity-40"
                            >
                              ✔ Approve
                            </button>
                          </div>
                        )}
                        {item.status !== "PENDING" && (
                          <span className="text-gray-600 text-[10px] text-center block">
                            —
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!loading && donations.length === 0 && (
          <div className="text-center py-20 bg-slate-900/20 border border-slate-800 border-dashed rounded-2xl">
            <p className="text-gray-400 text-xs">
              🎉 No donations found for the selected filters.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default ManageDonations;
