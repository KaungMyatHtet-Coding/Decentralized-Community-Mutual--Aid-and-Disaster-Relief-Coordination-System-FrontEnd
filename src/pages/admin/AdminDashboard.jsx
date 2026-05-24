import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api";

function AdminDashboard() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [role, setRole] = useState("");
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedRole = localStorage.getItem("role");

    if (!token) {
      navigate("/login");
      return;
    }

    // Admin မဟုတ်ရင် user dashboard ကို redirect
    if (storedRole !== "ROLE_SUPER_ADMIN" && storedRole !== "ROLE_SUB_ADMIN") {
      navigate("/dashboard");
      return;
    }

    setUsername(localStorage.getItem("username") || "Admin");
    setRole(storedRole);

    // Stats fetch
    const fetchStats = async () => {
      try {
        const res = await api.get("/admin/stats");
        setStats(res.data);
      } catch (err) {
        console.error("Stats fetch failed:", err);
      } finally {
        setStatsLoading(false);
      }
    };
    fetchStats();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const StatCard = ({ label, value, color, icon }) => (
    <div
      className={`bg-slate-900/50 border ${color} rounded-2xl p-5 flex items-center gap-4`}
    >
      <div className="text-3xl">{icon}</div>
      <div>
        <p className="text-xs text-gray-400 uppercase tracking-wider font-mono">
          {label}
        </p>
        <p className="text-2xl font-black text-white mt-0.5">
          {statsLoading ? (
            <span className="text-slate-600 animate-pulse">—</span>
          ) : (
            (value ?? 0)
          )}
        </p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      {/* Navbar */}
      <nav className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800/60 px-6 py-4 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold bg-gradient-to-r from-rose-400 to-orange-400 bg-clip-text text-transparent">
            🛡️ Admin Panel
          </h1>
          <span className="text-[10px] text-slate-500 font-mono hidden sm:block">
            Hnaung Kyoe Platform
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-[10px] bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2.5 py-1 rounded-full font-mono uppercase tracking-wider">
            {role.replace("ROLE_", "")}
          </span>
          <span className="text-sm text-gray-300 hidden sm:block">
            {username}
          </span>
          <button
            onClick={handleLogout}
            className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 px-4 py-2 rounded-xl text-sm font-semibold transition cursor-pointer"
          >
            Logout
          </button>
        </div>
      </nav>

      <div className="flex-1 p-6 max-w-6xl w-full mx-auto space-y-6">
        {/* Welcome */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-rose-950/20 border border-slate-800 p-6 rounded-2xl">
          <h2 className="text-2xl font-extrabold text-white">
            Welcome, <span className="text-rose-400">{username}</span> 👋
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            Admin Control Panel — Hnaung Kyoe Platform
          </p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatCard
            label="Total Donations"
            value={stats?.totalDonations}
            color="border-teal-500/20"
            icon="💰"
          />
          <StatCard
            label="Pending Donations"
            value={stats?.pendingDonations}
            color="border-amber-500/20"
            icon="⏳"
          />
          <StatCard
            label="Active Campaigns"
            value={stats?.activeCampaigns}
            color="border-emerald-500/20"
            icon="📋"
          />
          <StatCard
            label="Total Users"
            value={stats?.totalUsers}
            color="border-blue-500/20"
            icon="👥"
          />
          <StatCard
            label="Pending Applications"
            value={stats?.pendingApplications}
            color="border-orange-500/20"
            icon="📝"
          />
          <StatCard
            label="Active Volunteers"
            value={stats?.activeVolunteers}
            color="border-purple-500/20"
            icon="🤝"
          />
        </div>

        {/* Main Action Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Manage Campaigns */}
          <div className="bg-slate-900/40 border border-slate-800/80 p-6 rounded-2xl space-y-4 hover:border-slate-700 transition flex flex-col justify-between">
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-teal-400">
                📋 Manage Campaigns
              </h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Create, edit, and delete donation campaigns. Control which
                campaigns are active.
              </p>
            </div>
            <button
              onClick={() => navigate("/admin/campaigns")}
              className="w-full text-sm bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold py-2.5 rounded-xl transition cursor-pointer"
            >
              Manage Campaigns
            </button>
          </div>

          {/* Volunteer List */}
          <div className="bg-slate-900/40 border border-slate-800/80 p-6 rounded-2xl space-y-4 hover:border-slate-700 transition flex flex-col justify-between">
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-blue-400">
                ✅ Volunteer List
              </h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                View all active volunteers. Search by name, filter by status,
                and remove volunteers.
              </p>
              {stats?.activeVolunteers > 0 && (
                <span className="inline-block text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded font-mono">
                  {stats.activeVolunteers} active
                </span>
              )}
            </div>
            <button
              onClick={() => navigate("/admin/volunteers")}
              className="w-full text-sm bg-blue-500 hover:bg-blue-400 text-slate-950 font-bold py-2.5 rounded-xl transition cursor-pointer"
            >
              View Volunteers
            </button>
          </div>

          {/* Volunteer Applications */}
          <div className="bg-slate-900/40 border border-slate-800/80 p-6 rounded-2xl space-y-4 hover:border-slate-700 transition flex flex-col justify-between">
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-orange-400">
                📝 Applications
              </h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Review pending volunteer applications. Approve or reject
                applicants.
              </p>
              {stats?.pendingApplications > 0 && (
                <span className="inline-block text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded font-mono animate-pulse">
                  {stats.pendingApplications} pending
                </span>
              )}
            </div>
            <button
              onClick={() => navigate("/admin/applications")}
              className="w-full text-sm bg-orange-500 hover:bg-orange-400 text-slate-950 font-bold py-2.5 rounded-xl transition cursor-pointer"
            >
              Review Applications
            </button>
          </div>

          {/* Manage Posts */}
          <div className="bg-slate-900/40 border border-slate-800/80 p-6 rounded-2xl space-y-4 hover:border-slate-700 transition flex flex-col justify-between">
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-purple-400">
                📰 Manage Posts
              </h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Write and publish news posts and platform announcements.
              </p>
            </div>
            <button
              onClick={() => navigate("/admin/posts")}
              className="w-full text-sm bg-purple-500 hover:bg-purple-400 text-slate-950 font-bold py-2.5 rounded-xl transition cursor-pointer"
            >
              Manage Posts
            </button>
          </div>

          {/* Manage Donations */}
          <div className="bg-slate-900/40 border border-slate-800/80 p-6 rounded-2xl space-y-4 hover:border-slate-700 transition flex flex-col justify-between">
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-emerald-400">
                💰 Manage Donations
              </h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Confirm or reject donation submissions. View all donation
                records.
              </p>
              {stats?.pendingDonations > 0 && (
                <span className="inline-block text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded font-mono animate-pulse">
                  {stats.pendingDonations} pending
                </span>
              )}
            </div>
            <button
              onClick={() => navigate("/admin/donations")}
              className="w-full text-sm bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-2.5 rounded-xl transition cursor-pointer"
            >
              Manage Donations
            </button>
          </div>

          {/* Aid Requests — Admin manage only */}
          <div className="bg-slate-900/40 border border-slate-800/80 p-6 rounded-2xl space-y-4 hover:border-slate-700 transition flex flex-col justify-between">
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-rose-400">
                🆘 Aid Requests
              </h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Review aid requests submitted by users. Approve or reject each
                request.
              </p>
            </div>
            <button
              onClick={() => navigate("/admin/aid-requests")}
              className="w-full text-sm bg-rose-500 hover:bg-rose-400 text-slate-950 font-bold py-2.5 rounded-xl transition cursor-pointer"
            >
              Review Requests
            </button>
          </div>
        </div>

        {/* SUPER_ADMIN Only — Audit Logs */}
        {role === "ROLE_SUPER_ADMIN" && (
          <div className="bg-slate-900/30 border border-slate-700/50 border-dashed p-5 rounded-2xl">
            <div className="flex items-center gap-2 mb-3">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
                🔍 Super Admin Zone
              </h3>
              <span className="text-[9px] bg-slate-700 text-slate-400 px-2 py-0.5 rounded font-mono">
                SUPER_ADMIN ONLY
              </span>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => navigate("/admin/audit-logs")}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition"
              >
                📋 Audit Logs
              </button>
              <button
                onClick={() => navigate("/admin/users")}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition"
              >
                👥 Manage Users
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;
