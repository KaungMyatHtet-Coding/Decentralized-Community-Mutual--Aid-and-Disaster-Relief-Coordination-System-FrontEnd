import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api";
import NotificationBell from "../components/NotificationBell";
import { useTheme } from "../contexts/ThemeContext";
import { useLanguage } from "../contexts/LanguageContext";
import { 
  HeartHandshake, 
  Package, 
  AlertCircle,
  Bell,
  Clock,
  CheckCircle,
  ArrowRight,
  User,
  Shield,
  FileText,
  LogOut,
  Settings,
  LayoutDashboard,
  Home,
  Sun,
  Moon,
  Globe
} from "lucide-react";

export default function Dashboard() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { lang, toggleLanguage, t } = useLanguage();
  
  const [username, setUsername] = useState("");
  const [role, setRole] = useState("");
  const [stats, setStats] = useState(null);
  const [recentNotifs, setRecentNotifs] = useState([]);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUsername = localStorage.getItem("username");
    const storedRole = localStorage.getItem("role");

    if (!token) {
      navigate("/login");
      return;
    }

    setUsername(storedUsername || "Friend");
    setRole(storedRole || "ROLE_PUBLIC");

    const fetchStats = async () => {
      try {
        const [donationsRes, itemDonationsRes, aidRes, notiRes] = await Promise.all([
          api.get("/donations/my").catch(() => ({ data: [] })),
          api.get("/item-donations/my").catch(() => ({ data: [] })),
          api.get("/aid-requests/my").catch(() => ({ data: [] })),
          api.get("/notifications/my").catch(() => ({ data: [] })),
        ]);

        const donations = donationsRes.data || [];
        const itemDonations = itemDonationsRes.data || [];
        const aidRequests = aidRes.data || [];
        const notifs = notiRes.data || [];

        setStats({
          totalDonations: donations.length + itemDonations.length,
          pendingDonations:
            donations.filter((d) => d.status === "PENDING").length +
            itemDonations.filter((d) => d.status === "PENDING_VOLUNTEER" || d.status === "PENDING_ADMIN").length,
          confirmedDonations:
            donations.filter((d) => d.status === "CONFIRMED").length +
            itemDonations.filter((d) => d.status === "STORED_IN_STOCK" || d.status === "COMPLETED").length,
          totalAidRequests: aidRequests.length,
          pendingAidRequests: aidRequests.filter((a) => a.status === "PENDING" || a.status === "VERIFIED" || a.status === "IN_PROGRESS").length,
          unreadNotifs: notifs.filter((n) => !n.read).length,
        });

        const sorted = notifs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setRecentNotifs(sorted.slice(0, 4));
      } catch (err) {
        console.error("Stats fetch failed", err);
      } finally {
        setTimeout(() => setStatsLoading(false), 800);
      }
    };

    fetchStats();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
    window.location.reload();
  };

  const timeAgo = (dateStr) => {
    if (!dateStr) return "—";
    const diff = Math.floor((new Date() - new Date(dateStr)) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const handleSOSTrigger = async () => {
    const msg = prompt("🚨 URGENT: Enter your SOS emergency message:");
    if (msg === null) return;
    try {
      const res = await api.post("/notifications/sos", { message: msg });
      alert(res.data.message || "✅ SOS sent successfully!");
    } catch (err) {
      alert("❌ " + (err.response?.data?.error || err.response?.data || "Failed to trigger SOS."));
    }
  };

  const SkeletonCard = () => (
    <div className="bg-white dark:bg-slate-900/50 backdrop-blur border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm animate-pulse">
      <div className="flex justify-between items-start mb-4">
        <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-800"></div>
        <div className="w-10 h-8 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
      </div>
      <div className="w-24 h-4 bg-slate-200 dark:bg-slate-800 rounded"></div>
    </div>
  );

  const StatCard = ({ icon: Icon, label, value, colorClass, borderClass }) => (
    <div className={`bg-white dark:bg-slate-900/50 backdrop-blur border ${borderClass} rounded-2xl p-5 shadow-sm flex flex-col justify-between hover:-translate-y-1 transition-transform duration-300`}>
      <div className="flex justify-between items-start mb-4">
        <div className={`p-2 rounded-xl ${colorClass}`}>
          <Icon className="w-5 h-5" />
        </div>
        <span className="text-2xl font-black text-slate-800 dark:text-white">
          {value ?? 0}
        </span>
      </div>
      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{label}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-sans transition-colors duration-300 flex flex-col">
      
      {/* Top Navbar */}
      <nav className="sticky top-0 z-50 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 py-4 flex flex-wrap justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <Link to="/" className="w-8 h-8 rounded-full bg-gradient-to-tr from-teal-400 to-emerald-500 flex items-center justify-center shadow-lg shadow-teal-500/20 hover:scale-105 transition cursor-pointer shrink-0">
            <HeartHandshake className="w-5 h-5 text-white" />
          </Link>
          <h1 className="text-xl font-bold bg-gradient-to-r from-teal-500 to-emerald-600 dark:from-teal-400 dark:to-emerald-400 bg-clip-text text-transparent hidden sm:block">
            {t("dashboardTitle")}
          </h1>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-4">
          <Link to="/" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-sm font-semibold transition text-slate-600 dark:text-slate-300">
            <Home className="w-4 h-4" /> <span className="hidden md:block">{t("mainPage")}</span>
          </Link>

          <button onClick={toggleLanguage} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition flex items-center gap-1.5 text-sm font-medium">
            <Globe className="w-4 h-4" />
            <span className="hidden sm:block">{lang === "en" ? "MY" : "EN"}</span>
          </button>
          
          <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition">
            {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          <NotificationBell />
          
          <div className="hidden sm:block h-6 w-px bg-slate-200 dark:bg-slate-700"></div>
          
          <button
            onClick={() => {
              const isComplete = localStorage.getItem("profileCompleted") === "true";
              navigate(isComplete ? "/profile/view" : "/profile");
            }}
            className="flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-teal-500 transition"
          >
            <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
            <span className="hidden md:block truncate max-w-[100px]">{username}</span>
          </button>

          <button
            onClick={handleLogout}
            className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition"
            title="Logout"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </nav>

      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col lg:flex-row gap-8">
        
        {/* Main Content Area */}
        <div className="flex-1 space-y-8">
          
          {/* Welcome Banner */}
          <div className="relative overflow-hidden bg-gradient-to-br from-teal-500 via-emerald-500 to-teal-700 rounded-3xl p-8 sm:p-10 text-white shadow-xl shadow-teal-500/20 border border-teal-400/30">
            <div className="relative z-10">
              <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur rounded-full text-xs font-bold tracking-wider mb-4 border border-white/20">
                {role.replace("ROLE_", "")}
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold mb-2">
                {t("welcomePrefix")}, <br className="sm:hidden"/> {username}!
              </h2>
              <p className="text-teal-50 max-w-lg mt-3 text-sm sm:text-base opacity-90">
                {t("dashboardDesc")}
              </p>
              
              {/* Quick Actions */}
              <div className="mt-6 flex flex-wrap gap-3">
                <button onClick={() => navigate("/campaigns")} className="px-5 py-2.5 bg-white text-teal-600 font-bold rounded-xl shadow-md hover:scale-105 transition flex items-center gap-2">
                  <HeartHandshake className="w-5 h-5" /> Donate Now
                </button>
                <button onClick={() => navigate("/aid-requests")} className="px-5 py-2.5 bg-teal-800/40 backdrop-blur border border-teal-400/30 text-white font-bold rounded-xl hover:bg-teal-800/60 transition flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" /> Request Aid
                </button>
              </div>
            </div>
            <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-[400px] h-[400px] bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute bottom-0 left-10 translate-y-1/2 w-[200px] h-[200px] bg-emerald-400/20 rounded-full blur-2xl pointer-events-none"></div>
          </div>

          {/* Stats Grid */}
          <div>
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <LayoutDashboard className="w-5 h-5 text-teal-500" /> {t("myOverview")}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {statsLoading ? (
                <>
                  <SkeletonCard /> <SkeletonCard /> <SkeletonCard />
                  <SkeletonCard /> <SkeletonCard /> <SkeletonCard />
                </>
              ) : (
                <>
                  <StatCard icon={HeartHandshake} label={t("totalDonations")} value={stats?.totalDonations} colorClass="bg-teal-100 text-teal-600 dark:bg-teal-500/20 dark:text-teal-400" borderClass="border-teal-100 dark:border-teal-500/20" />
                  <StatCard icon={Clock} label={t("pendingItems")} value={stats?.pendingDonations} colorClass="bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400" borderClass="border-amber-100 dark:border-amber-500/20" />
                  <StatCard icon={CheckCircle} label={t("confirmed")} value={stats?.confirmedDonations} colorClass="bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400" borderClass="border-emerald-100 dark:border-emerald-500/20" />
                  <StatCard icon={AlertCircle} label={t("aidRequests")} value={stats?.totalAidRequests} colorClass="bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400" borderClass="border-rose-100 dark:border-rose-500/20" />
                  <StatCard icon={Clock} label={t("pendingAid")} value={stats?.pendingAidRequests} colorClass="bg-orange-100 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400" borderClass="border-orange-100 dark:border-orange-500/20" />
                  <StatCard icon={Bell} label={t("unreadNotifs")} value={stats?.unreadNotifs} colorClass="bg-purple-100 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400" borderClass="border-purple-100 dark:border-purple-500/20" />
                </>
              )}
            </div>
          </div>

          {/* Quick Actions Grid */}
          <div>
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-teal-500" /> {t("actionsModules")}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 hover:shadow-lg hover:-translate-y-1 hover:border-slate-300 dark:hover:border-slate-600 transition-all group cursor-pointer" onClick={() => navigate("/aid-requests")}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-rose-100 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-xl group-hover:scale-110 transition-transform">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold">{t("myAidRequestsTitle")}</h4>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">{t("myAidRequestsDesc")}</p>
                <div className="text-rose-600 dark:text-rose-400 font-semibold text-sm flex items-center gap-1 group-hover:gap-2 transition-all">
                  {t("manageRequests")} <ArrowRight className="w-4 h-4" />
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 hover:shadow-lg hover:-translate-y-1 hover:border-slate-300 dark:hover:border-slate-600 transition-all group cursor-pointer" onClick={() => navigate("/campaigns")}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-teal-100 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400 rounded-xl group-hover:scale-110 transition-transform">
                    <HeartHandshake className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold">{t("donationCampTitle")}</h4>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">{t("donationCampDesc")}</p>
                <div className="text-teal-600 dark:text-teal-400 font-semibold text-sm flex items-center gap-1 group-hover:gap-2 transition-all">
                  {t("browseCampaigns")} <ArrowRight className="w-4 h-4" />
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 hover:shadow-lg hover:-translate-y-1 hover:border-slate-300 dark:hover:border-slate-600 transition-all group cursor-pointer" onClick={() => navigate("/my-item-donations")}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-cyan-100 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 rounded-xl group-hover:scale-110 transition-transform">
                    <Package className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold">{t("myItemDonationsTitle")}</h4>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">{t("myItemDonationsDesc")}</p>
                <div className="text-cyan-600 dark:text-cyan-400 font-semibold text-sm flex items-center gap-1 group-hover:gap-2 transition-all">
                  {t("viewItems")} <ArrowRight className="w-4 h-4" />
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 hover:shadow-lg hover:-translate-y-1 hover:border-slate-300 dark:hover:border-slate-600 transition-all group cursor-pointer" onClick={() => navigate("/donation-history")}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-purple-100 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-xl group-hover:scale-110 transition-transform">
                    <FileText className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold">{t("financialDonationsTitle")}</h4>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">{t("financialDonationsDesc")}</p>
                <div className="text-purple-600 dark:text-purple-400 font-semibold text-sm flex items-center gap-1 group-hover:gap-2 transition-all">
                  {t("viewHistory")} <ArrowRight className="w-4 h-4" />
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:w-80 space-y-6">
          
          {/* 🚨 SOS Trigger Widget */}
          <div className="bg-rose-500/10 border border-rose-500/50 rounded-2xl p-6 relative overflow-hidden">
            <h4 className="font-bold text-rose-600 dark:text-rose-400 mb-2 flex items-center gap-2 relative z-10">
              <AlertCircle className="w-6 h-6 text-rose-500 animate-pulse" /> Emergency SOS
            </h4>
            <p className="text-sm text-rose-700 dark:text-rose-300 mb-4 relative z-10">
              Need immediate assistance? Alert all admins and volunteers in your township.
            </p>
            <button 
              onClick={handleSOSTrigger} 
              className="w-full py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold transition shadow-lg shadow-rose-500/30 relative z-10 flex items-center justify-center gap-2"
            >
              <AlertCircle className="w-5 h-5" /> TRIGGER SOS
            </button>
          </div>

          {/* Volunteer Status Widget */}
          {!(role === "ROLE_SUPER_ADMIN" || role === "ROLE_SUB_ADMIN") && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-2xl p-6 relative overflow-hidden">
              <div className="absolute -right-4 -top-4 text-blue-500/10 dark:text-blue-500/5 rotate-12 pointer-events-none">
                <Shield className="w-32 h-32" />
              </div>
              <h4 className="font-bold text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2 relative z-10">
                <Shield className="w-5 h-5 text-blue-500" /> {t("volunteerCenter")}
              </h4>
              {role.includes("VOLUNTEER") ? (
                <div className="relative z-10 flex flex-col gap-2">
                  <p className="text-sm text-blue-700 dark:text-blue-300 mb-2">{t("volunteerActiveDesc")}</p>
                  <button onClick={() => navigate("/volunteer/assignments")} className="w-full py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-semibold transition shadow-md shadow-blue-500/20">
                    {t("viewAssignments")}
                  </button>
                  <button onClick={() => navigate("/volunteer/aid-tasks")} className="w-full py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-xl font-semibold transition shadow-md shadow-teal-500/20">
                    Aid Request Tasks
                  </button>
                </div>
              ) : (
                <div className="relative z-10">
                  <p className="text-sm text-blue-700 dark:text-blue-300 mb-4">{t("volunteerApplyDesc")}</p>
                  <button onClick={() => navigate("/volunteer-apply")} className="w-full py-2 bg-white dark:bg-blue-800 text-blue-600 dark:text-white border border-blue-200 dark:border-blue-700 rounded-xl font-semibold hover:bg-blue-50 dark:hover:bg-blue-700 transition">
                    {t("applyNow")}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Recent Notifications Widget */}
          <div className="bg-white dark:bg-slate-900/50 backdrop-blur border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
            <h4 className="font-bold mb-4 flex items-center gap-2">
              <Bell className="w-5 h-5 text-amber-500" /> {t("recentActivity")}
            </h4>
            {statsLoading ? (
              <div className="space-y-4 animate-pulse">
                <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded"></div>
                <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded"></div>
              </div>
            ) : recentNotifs.length > 0 ? (
              <div className="space-y-4">
                {recentNotifs.map((n) => (
                  <div key={n.id} className="flex gap-3">
                    <div className="mt-1.5 w-2 h-2 rounded-full bg-amber-500 shrink-0"></div>
                    <div>
                      <p className={`text-sm ${!n.read ? 'font-bold text-slate-800 dark:text-white' : 'font-medium text-slate-600 dark:text-slate-300'}`}>{n.title}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{n.message}</p>
                      <p className="text-[10px] text-slate-400 mt-1">{timeAgo(n.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">{t("noRecentActivity")}</p>
            )}
          </div>

          {/* Admin Controls Widget (Conditional) */}
          {(role === "ROLE_SUPER_ADMIN" || role === "ROLE_SUB_ADMIN") && (
            <div className="bg-slate-900 dark:bg-slate-950 border border-slate-800 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-rose-500/10 to-transparent pointer-events-none"></div>
              <h4 className="font-bold mb-2 flex items-center gap-2 relative z-10">
                <Settings className="w-5 h-5 text-rose-500" /> {t("adminControls")}
              </h4>
              <p className="text-xs text-slate-400 mb-4 relative z-10">{t("adminDesc")}</p>
              <div className="space-y-2 relative z-10">
                <button onClick={() => navigate("/admin/dashboard")} className="w-full py-2 bg-slate-800/80 hover:bg-slate-700 border border-slate-700/50 rounded-lg text-sm font-semibold transition text-left px-4 flex justify-between items-center group">
                  {t("systemSettings")} <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
                </button>
                <button onClick={() => navigate("/admin/posts")} className="w-full py-2 bg-slate-800/80 hover:bg-slate-700 border border-slate-700/50 rounded-lg text-sm font-semibold transition text-left px-4 flex justify-between items-center group">
                  {t("manageContent")} <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
