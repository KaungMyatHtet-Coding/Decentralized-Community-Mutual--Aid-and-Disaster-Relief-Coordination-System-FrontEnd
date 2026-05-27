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

const PIE_COLORS = ["#14b8a6", "#3b82f6", "#f59e0b", "#ef4444", "#6366f1"];

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
    username: "",
  });

  // ── Data fetching ──────────────────────────────────────
  const fetchDonations = async (f = filters) => {
    setLoading(true);
    try {
      // 💡 အကယ်၍ Filter က Status: PENDING_ADMIN ဆိုရင် သီးသန့်ဆောက်ထားတဲ့ /pending Endpoint ကို ခေါ်ပါမယ်
      let url = "/api/item-donations";
      if (f.status === "PENDING_ADMIN") {
        url = "/api/item-donations/pending";
      }

      const res = await api.get(url);

      // Client-side Frontend filtering For Client Search (Username ဖြင့် ရှာဖွေရန်)
      let data = res.data;
      if (f.username) {
        data = data.filter(item =>
          item.donor?.fullName?.toLowerCase().includes(f.username.toLowerCase()) ||
          item.donor?.username?.toLowerCase().includes(f.username.toLowerCase())
        );
      }

      // Status matching for general dropdown filter (PENDING_ADMIN မဟုတ်တဲ့ တခြား status စစ်ထုတ်ရန်)
      if (f.status && f.status !== "PENDING_ADMIN") {
        data = data.filter(item => item.status === f.status);
      }

      setDonations(data);
    } catch (err) {
      setError("Failed to load donations.");
    } finally {
      setLoading(false);
    }
  };

  // Item Donation အတွက် အံဝင်ခွင်ကျဖြစ်မယ့် Mock/Dynamic Stats တွက်ချက်ခြင်း
  const calculateStats = (allDonations) => {
    const total = allDonations.length;
    const pending = allDonations.filter(d => d.status === "PENDING_ADMIN").length;
    const stored = allDonations.filter(d => d.status === "STORED_IN_STOCK").length;
    const activeAssigned = allDonations.filter(d => d.status === "ASSIGNED_TO_VOLUNTEER" || d.status === "VOLUNTEER_ACCEPTED").length;

    // Chart Data Breakdown
    const statusCounts = {};
    allDonations.forEach(d => {
      statusCounts[d.status] = (statusCounts[d.status] || 0) + 1;
    });
    const typeData = Object.keys(statusCounts).map(key => ({
      type: key.replace("_", " "),
      count: statusCounts[key]
    }));

    setStats({
      totalDonations: total,
      totalPending: pending,
      totalStored: stored,
      totalActiveAssigned: activeAssigned,
      typeData: typeData
    });
    setStatsLoading(false);
  };

 useEffect(() => {
    const fetchPendingDonations = async () => {
      try {
        // 💡 မူလက getByStatus API သုံးထားမိပါက Admin Review Pending ဖြစ်နေသော သန့်ရှင်းသည့် စာရင်းထွက်ရန် ပြောင်းလဲခြင်း
        const response = await api.get("/item-donations/my");
        // ⚠️ ညီလေးရဲ့ Admin Pending Item Donations ခေါ်တဲ့ Endpoint URL အမှန်ကို ဒီနေရာမှာ ထည့်ပေးပါဗျာ (ဥပမာ- /api/item-donations/pending)
        setDonations(response.data);
      } catch (error) {
        console.error("Error fetching pending donations:", error);
      }
    };
    fetchPendingDonations();
  }, []);

  // ── Actions ────────────────────────────────────────────
  // 💡 Admin က အတည်ပြုပြီး အနီးစပ်ဆုံး Volunteer ထံ စနစ်တကျ Auto Assign ချပေးမည့် လုပ်ဆောင်ချက်
  const handleApproveAuto = async (id) => {
    if (!window.confirm("ဒီအလှူပစ္စည်းကို အတည်ပြုပြီး အနီးစပ်ဆုံး Volunteer ထံ စနစ်တကျ တာဝန်ပေးအပ်မှာ သေချာပါသလား?")) return;
    setActionLoading(id);
    try {
      await api.patch(`/api/item-donations/${id}/approve-auto`);
      alert("✅ Donation approved and auto-assigned to nearest volunteer successfully!");
      const res = await api.get("/api/item-donations");
      setDonations(res.data);
      calculateStats(res.data);
    } catch (err) {
      alert(err.response?.data || "Failed to auto-assign volunteer. Ensure volunteers are registered.");
    } finally {
      setActionLoading(null);
    }
  };

  // 💡 Admin Reject လုပ်ပြီး အကြောင်းပြချက် ပို့ပေးမည့် လုပ်ဆောင်ချက်
  const handleReject = async (id) => {
    const reason = window.prompt("ငြင်းပယ်ရခြင်း အကြောင်းရင်းကို ထည့်သွင်းပေးပါ (Reason for rejection):");
    if (reason === null) return; // Cancel နှိပ်ရင် ဘာမှမလုပ်ဘူး

    setActionLoading(id);
    try {
      await api.patch(`/api/item-donations/${id}/admin-reject`, { reason: reason || "Does not meet guidelines." });
      alert("❌ Donation rejected and donor notified.");
      const res = await api.get("/api/item-donations");
      setDonations(res.data);
      calculateStats(res.data);
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
    const reset = { status: "", username: "" };
    setFilters(reset);
    fetchDonations(reset);
  };

  // Helper function to color code badges nicely
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "STORED_IN_STOCK":
        return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
      case "ADMIN_REJECTED":
      case "VOLUNTEER_REJECTED":
        return "bg-rose-500/10 text-rose-400 border border-rose-500/20";
      case "PENDING_ADMIN":
        return "bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse";
      case "ASSIGNED_TO_VOLUNTEER":
      case "VOLUNTEER_ACCEPTED":
        return "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20";
      case "VOLUNTEER_RECEIVED":
        return "bg-teal-500/10 text-teal-400 border border-teal-500/20";
      default:
        return "bg-slate-500/10 text-slate-400 border border-slate-800";
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-7xl w-full mx-auto space-y-8">

        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-800 pb-5">
          <div>
            <h1 className="text-2xl font-black bg-gradient-to-r from-rose-400 to-orange-400 bg-clip-text text-transparent">
              🛡️ Item Donation Management Panel
            </h1>
            <p className="text-xs text-gray-400 mt-1">
              Review, auto-assign volunteers, and manage all item contributions.
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
              { label: "Total Item Logs", value: stats.totalDonations, color: "text-white" },
              { label: "Stored in Stock", value: stats.totalStored, color: "text-emerald-400" },
              { label: "Pending Review", value: stats.totalPending, color: "text-amber-400" },
              { label: "Active Deliveries", value: stats.totalActiveAssigned, color: "text-indigo-400" },
            ].map((card) => (
              <div key={card.label} className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 space-y-1">
                <p className="text-[10px] uppercase text-gray-500 tracking-wider">{card.label}</p>
                <p className={`text-2xl font-black ${card.color}`}>{card.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Charts Row */}
        {!statsLoading && stats && (
          <div className="grid grid-cols-1 gap-6">
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5">
              <h3 className="text-sm font-bold text-gray-300 mb-4">🥧 Real-time Item Status Breakdown</h3>
              {stats.typeData?.length > 0 ? (
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie
                      data={stats.typeData}
                      dataKey="count"
                      nameKey="type"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ type, percent }) => `${type} ${(percent * 100).toFixed(0)}%`}
                    >
                      {stats.typeData.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Legend formatter={(v) => <span style={{ color: "#94a3b8", fontSize: 11 }}>{v}</span>} />
                    <Tooltip contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #1e293b" }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-gray-500 text-xs text-center py-10">No status data map available.</p>
              )}
            </div>
          </div>
        )}

        {/* Filter Bar */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 space-y-4">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">🔍 Filter & Search</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="text"
              name="username"
              placeholder="Search donor name or username..."
              value={filters.username}
              onChange={handleFilterChange}
              className="bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none transition"
            />
            <select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none transition"
            >
              <option value="">All Custom Status</option>
              <option value="PENDING_ADMIN">PENDING ADMIN</option>
              <option value="ASSIGNED_TO_VOLUNTEER">ASSIGNED TO VOLUNTEER</option>
              <option value="VOLUNTEER_ACCEPTED">VOLUNTEER ACCEPTED</option>
              <option value="VOLUNTEER_RECEIVED">VOLUNTEER RECEIVED</option>
              <option value="STORED_IN_STOCK">STORED IN STOCK</option>
              <option value="ADMIN_REJECTED">ADMIN REJECTED</option>
            </select>
          </div>
          <div className="flex gap-3">
            <button onClick={handleSearch} className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold px-5 py-2 rounded-xl text-xs transition cursor-pointer">
              Apply Filters
            </button>
            <button onClick={handleReset} className="bg-slate-800 hover:bg-slate-700 text-gray-300 px-5 py-2 rounded-xl text-xs transition cursor-pointer">
              Reset
            </button>
          </div>
        </div>

        {loading && <div className="text-center py-10 text-rose-400 animate-pulse text-xs">Loading item logs...</div>}
        {error && <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl text-center text-xs">{error}</div>}

        {/* Donations Table */}
        {!loading && !error && donations.length > 0 && (
          <div className="bg-slate-900/30 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/60 text-[10px] uppercase font-mono tracking-wider text-gray-400">
                    <th className="p-4">Donor</th>
                    <th className="p-4">Campaign</th>
                    <th className="p-4">Item & Quantity</th>
                    <th className="p-4">Handover Info</th>
                    <th className="p-4">Photo</th>
                    <th className="p-4 text-center">Status</th>
                    <th className="p-4 text-center">Management Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50 text-xs text-gray-300">
                  {donations.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-900/20 transition">
                      <td className="p-4">
                        <div className="font-bold text-white">{item.isAnonymous ? "🔒 Anonymous" : (item.donor?.fullName || item.donor?.username || "Unknown Donor")}</div>
                        <div className="text-[10px] text-gray-500 font-mono">{item.donorPhone}</div>
                      </td>
                      <td className="p-4 max-w-xs truncate text-gray-300 font-semibold">
                        {item.campaign?.title || `Campaign ID: #${item.campaign?.id || 'N/A'}`}
                      </td>
                      <td className="p-4">
                        <span className="font-bold text-teal-400">{item.itemName}</span>
                        <div className="text-[10px] text-slate-400 mt-0.5">{item.quantity} {item.unit} ({item.condition})</div>
                      </td>
                      <td className="p-4">
                        <div>📍 {item.donorTownship}</div>
                        <div className="text-[10px] text-gray-500">Method: {item.handoverType}</div>
                      </td>
                      <td className="p-4">
                        {item.itemPhotoUrl ? (
                          <a href={item.itemPhotoUrl} target="_blank" rel="noreferrer" className="text-teal-400 hover:underline font-mono text-[11px]">
                            🖼️ View Item
                          </a>
                        ) : (
                          <span className="text-gray-600 font-mono text-[11px]">No Photo</span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black font-mono ${getStatusBadgeClass(item.status)}`}>
                          {item.status ? item.status.replace("_", " ") : "UNKNOWN"}
                        </span>
                      </td>
                      <td className="p-4">
                        {item.status === "PENDING_ADMIN" ? (
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
                              onClick={() => handleApproveAuto(item.id)}
                              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-1.5 px-3 rounded-lg text-[10px] transition cursor-pointer disabled:opacity-40 shadow-lg shadow-emerald-500/10"
                            >
                              ⚡ Auto Assign
                            </button>
                          </div>
                        ) : (
                          <div className="text-center text-gray-500 text-[11px]">
                            {item.assignedVolunteer ? `👤 Assigned: ${item.assignedVolunteer.fullName || item.assignedVolunteer.username}` : "Processed — No action needed"}
                          </div>
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
            <p className="text-gray-400 text-xs">🎉 No item donations found in the system matching criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default ManageDonations;
