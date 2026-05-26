import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import NotificationBell from "../components/NotificationBell";

function Dashboard() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [role, setRole] = useState("");
  const [stats, setStats] = useState(null);
  const [recentNotifs, setRecentNotifs] = useState([]);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUsername = localStorage.getItem("username");
    const storedRole = localStorage.getItem("role");
    const userId = localStorage.getItem("userId");

    if (!token) {
      navigate("/login");
      return;
    }

    setUsername(storedUsername || "Friend");
    setRole(storedRole || "ROLE_PUBLIC");

    // Personal stats fetch
    const fetchStats = async () => {
      try {
        // ← item-donations/my ထည့်လိုက်တယ်
        const [donationsRes, itemDonationsRes, aidRes, notiRes] =
          await Promise.all([
            api.get("/donations/my"),
            api.get("/item-donations/my").catch(() => ({ data: [] })), // ← NEW
            api.get("/aid-requests/my").catch(() => ({ data: [] })),
            api.get("/notifications/my").catch(() => ({ data: [] })),
          ]);

        const donations = donationsRes.data || [];
        const itemDonations = itemDonationsRes.data || []; // ← NEW
        const aidRequests = aidRes.data || [];
        const notifs = notiRes.data || [];

        setStats({
          // ← money + item ပေါင်းထည့်လိုက်တယ်
          totalDonations: donations.length + itemDonations.length, // ← CHANGED
          pendingDonations:
            donations.filter((d) => d.status === "PENDING").length +
            itemDonations.filter((d) => d.status === "PENDING_VOLUNTEER")
              .length, // ← CHANGED
          confirmedDonations:
            donations.filter((d) => d.status === "CONFIRMED").length +
            itemDonations.filter((d) => d.status === "STORED_IN_STOCK").length, // ← CHANGED

          // ← ဒါတွေ မထိဘဲ ထားတယ်
          totalAidRequests: aidRequests.length,
          pendingAidRequests: aidRequests.filter((a) => a.status === "PENDING")
            .length,
          unreadNotifs: notifs.filter((n) => !n.read).length,
        });

        // Recent 4 notifications
        const sorted = notifs.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
        );
        setRecentNotifs(sorted.slice(0, 4));
      } catch (err) {
        console.error("Stats fetch failed", err);
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

  const timeAgo = (dateStr) => {
    if (!dateStr) return "—";
    const diff = Math.floor((new Date() - new Date(dateStr)) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const notiIcon = (type) => {
    const map = {
      REQUEST_CREATED: "🆘",
      STATUS_CHANGED: "🔄",
      DONATION_RECEIVED: "💚",
      CAMPAIGN_COMPLETED: "🎉",
      VOLUNTEER_APPROVED: "✅",
      VOLUNTEER_REJECTED: "❌",
    };
    return map[type] || "🔔";
  };

  const StatCard = ({ icon, label, value, color, sub }) => (
    <div
      className={`bg-slate-900/50 border ${color} rounded-2xl p-4 flex items-center gap-3`}
    >
      <span className="text-2xl">{icon}</span>
      <div>
        <p className="text-[10px] text-gray-500 uppercase tracking-wider font-mono">
          {label}
        </p>
        <p className="text-xl font-black text-white">
          {statsLoading ? (
            <span className="text-slate-600 animate-pulse">—</span>
          ) : (
            (value ?? 0)
          )}
        </p>
        {sub && <p className="text-[10px] text-gray-600 mt-0.5">{sub}</p>}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      {/* Navbar */}
      <nav className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800/60 px-6 py-4 flex justify-between items-center sticky top-0 z-50">
        <h1 className="text-xl font-bold bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent">
          Hnaung Kyoe Platform 🔗
        </h1>
        <div className="flex items-center gap-4">
          <NotificationBell />
          <span className="text-[10px] bg-teal-500/10 text-teal-400 border border-teal-500/20 px-2.5 py-1 rounded-full font-mono uppercase tracking-wider">
            {role.replace("ROLE_", "")}
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
        {/* Welcome Card */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-teal-950/20 border border-slate-800 p-6 rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/5 rounded-full blur-2xl" />
          <h2 className="text-2xl font-extrabold text-white">
            Welcome Back,{" "}
            <span className="text-teal-400 font-black">{username}</span>! 👋
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            Here is your personal update from Hnaung Kyoe platform.
          </p>
        </div>

        {/* ✅ Personal Stats */}
        <div>
          <h3 className="text-xs text-gray-500 uppercase tracking-wider font-mono mb-3">
            📊 My Activity
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <StatCard
              icon="💰"
              label="Total Donations"
              value={stats?.totalDonations}
              color="border-teal-500/20"
            />
            <StatCard
              icon="⏳"
              label="Pending"
              value={stats?.pendingDonations}
              color="border-amber-500/20"
              sub="donations"
            />
            <StatCard
              icon="✅"
              label="Confirmed"
              value={stats?.confirmedDonations}
              color="border-emerald-500/20"
              sub="donations"
            />
            <StatCard
              icon="🆘"
              label="Aid Requests"
              value={stats?.totalAidRequests}
              color="border-rose-500/20"
            />
            <StatCard
              icon="🔄"
              label="Pending Aid"
              value={stats?.pendingAidRequests}
              color="border-orange-500/20"
              sub="requests"
            />
            <StatCard
              icon="🔔"
              label="Unread Notifs"
              value={stats?.unreadNotifs}
              color="border-purple-500/20"
            />
          </div>
        </div>

        {/* Main Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Aid Requests */}
          <div className="bg-slate-900/40 border border-slate-800/80 p-6 rounded-2xl space-y-4 hover:border-slate-700 transition flex flex-col justify-between">
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-emerald-400">
                🆘 Aid Requests
              </h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                View or create requests for emergency aid, supplies, and
                community support.
              </p>
              {stats?.pendingAidRequests > 0 && (
                <span className="inline-block text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded font-mono animate-pulse">
                  {stats.pendingAidRequests} pending
                </span>
              )}
            </div>
            <button
              onClick={() => navigate("/aid-requests")}
              className="w-full text-sm bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-2.5 rounded-xl transition cursor-pointer"
            >
              View Requests
            </button>
          </div>

          {/* Campaigns */}
          <div className="bg-slate-900/40 border border-slate-800/80 p-6 rounded-2xl space-y-4 hover:border-slate-700 transition flex flex-col justify-between">
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-teal-400">
                💰 Donation Campaigns
              </h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Support verified donation programs and contribute to funding
                people in need.
              </p>
            </div>
            <button
              onClick={() => navigate("/campaigns")}
              className="w-full text-sm bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold py-2.5 rounded-xl transition cursor-pointer"
            >
              Browse Campaigns
            </button>
          </div>

          {/* Volunteers */}
          <div className="bg-slate-900/40 border border-slate-800/80 p-6 rounded-2xl space-y-4 hover:border-slate-700 transition flex flex-col justify-between">
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-blue-400">🤝 Volunteers</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Join our team as a verified volunteer and participate in
                on-field aid activities.
              </p>
              {role === "ROLE_VOLUNTEER" && (
                <span className="inline-block text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-mono">
                  ✅ You are a volunteer
                </span>
              )}
            </div>
            <button
              onClick={() =>
                role === "ROLE_VOLUNTEER"
                  ? navigate("/volunteer/assignments")
                  : navigate("/volunteer-apply")
              }
              className="w-full text-sm bg-blue-500 hover:bg-blue-400 text-slate-950 font-bold py-2.5 rounded-xl transition cursor-pointer"
            >
              {role === "ROLE_VOLUNTEER" ? "View Assignments" : "Apply Now"}
            </button>
          </div>

          {/* ✅ My Donations — proper card now */}
          <div className="bg-slate-900/40 border border-slate-800/80 p-6 rounded-2xl space-y-4 hover:border-slate-700 transition flex flex-col justify-between">
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-purple-400">
                📜 My Donations
              </h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                View your full donation history, track status, and see confirmed
                contributions.
              </p>
              {stats?.pendingDonations > 0 && (
                <span className="inline-block text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded font-mono animate-pulse">
                  {stats.pendingDonations} pending review
                </span>
              )}
            </div>
            <button
              onClick={() => navigate("/donation-history")}
              className="w-full text-sm bg-purple-500 hover:bg-purple-400 text-slate-950 font-bold py-2.5 rounded-xl transition cursor-pointer"
            >
              View My Donations
            </button>
          </div>

          {/* ✅ News — compact card */}
          <div className="bg-slate-900/40 border border-slate-800/80 p-6 rounded-2xl space-y-4 hover:border-slate-700 transition flex flex-col justify-between">
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-orange-400">
                📰 News & Updates
              </h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Stay updated with the latest news and announcements from the
                platform.
              </p>
            </div>
            <button
              onClick={() => navigate("/news")}
              className="w-full text-sm bg-orange-500 hover:bg-orange-400 text-slate-950 font-bold py-2.5 rounded-xl transition cursor-pointer"
            >
              Read News
            </button>
          </div>

          {/* ✅ Item Donations card */}
          <div className="bg-slate-900/40 border border-slate-800/80 p-6 rounded-2xl space-y-4 hover:border-slate-700 transition flex flex-col justify-between">
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-cyan-400">
                📦 Item Donations
              </h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Donate physical items like food, clothing, or supplies to those
                in need.
              </p>
            </div>
            <button
              onClick={() => navigate("/my-item-donations")}
              className="w-full text-sm bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold py-2.5 rounded-xl transition cursor-pointer"
            >
              View Your Donated Items
            </button>
          </div>
        </div>

        {/* ✅ Recent Activity Feed */}
        {recentNotifs.length > 0 && (
          <div>
            <h3 className="text-xs text-gray-500 uppercase tracking-wider font-mono mb-3">
              🕐 Recent Activity
            </h3>
            <div className="bg-slate-900/30 border border-slate-800 rounded-2xl overflow-hidden">
              {recentNotifs.map((n, i) => (
                <div
                  key={n.id}
                  className={`flex items-start gap-3 px-5 py-3.5 ${
                    i !== recentNotifs.length - 1
                      ? "border-b border-slate-800/50"
                      : ""
                  } ${!n.read ? "bg-teal-500/5" : ""}`}
                >
                  <span className="text-base mt-0.5">{notiIcon(n.type)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-white">{n.title}</p>
                    <p className="text-[11px] text-gray-500 truncate">
                      {n.message}
                    </p>
                  </div>
                  <span className="text-[10px] text-gray-600 font-mono shrink-0">
                    {timeAgo(n.createdAt)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Admin Zone */}
        {(role === "ROLE_SUPER_ADMIN" || role === "ROLE_SUB_ADMIN") && (
          <div className="bg-rose-500/5 border border-rose-500/20 p-6 rounded-2xl border-dashed">
            <h3 className="text-base font-bold text-rose-400 uppercase tracking-wider mb-2">
              🛡️ Administrative Controls
            </h3>
            <p className="text-xs text-gray-400 mb-4">
              This section is only visible to authorized administrators.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => navigate("/admin/dashboard")}
                className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition"
              >
                Manage Content
              </button>
              <button
                onClick={() => navigate("/admin/posts")}
                className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition"
              >
                Manage Posts
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
