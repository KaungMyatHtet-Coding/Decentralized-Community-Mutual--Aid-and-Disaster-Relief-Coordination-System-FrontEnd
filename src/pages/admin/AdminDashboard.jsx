import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../../api";
import NotificationBell from "../../components/NotificationBell";
import { useTheme } from "../../contexts/ThemeContext";
import { useLanguage } from "../../contexts/LanguageContext";
import { 
  ShieldCheck, 
  Settings, 
  LogOut, 
  Home, 
  Sun, 
  Moon, 
  Globe, 
  User,
  HeartHandshake,
  Package,
  AlertCircle,
  FileText,
  Users,
  CheckCircle,
  Shield,
  Bell,
  ArrowRight
} from "lucide-react";

// Animated counter hook
function useCountUp(target, duration = 1200, start = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start || target == null) return;
    let startTime = null;
    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, start]);
  return count;
}

const ACTION_CARDS_CONFIG = [
  {
    key: "campaigns",
    icon: HeartHandshake,
    titleKey: "manageCampaignsTitle",
    descKey: "manageCampaignsDesc",
    colorClass: "text-teal-500",
    bgClass: "bg-teal-100 dark:bg-teal-500/10",
    borderClass: "border-teal-200 dark:border-teal-500/20",
    route: "/admin/campaigns",
    superAdminOnly: true,
  },
  {
    key: "volunteers",
    icon: Users,
    titleKey: "volunteerListTitle",
    descKey: "volunteerListDesc",
    colorClass: "text-blue-500",
    bgClass: "bg-blue-100 dark:bg-blue-500/10",
    borderClass: "border-blue-200 dark:border-blue-500/20",
    route: "/admin/volunteers",
    badge: (stats) => stats?.activeVolunteers > 0 ? `${stats.activeVolunteers} active` : null,
    superAdminOnly: false,
  },
  {
    key: "applications",
    icon: FileText,
    titleKey: "applicationsTitle",
    descKey: "applicationsDesc",
    colorClass: "text-orange-500",
    bgClass: "bg-orange-100 dark:bg-orange-500/10",
    borderClass: "border-orange-200 dark:border-orange-500/20",
    route: "/admin/applications",
    badge: (stats) => stats?.pendingApplications > 0 ? `${stats.pendingApplications} pending` : null,
    pulse: true,
    superAdminOnly: false,
  },
  {
    key: "posts",
    icon: Bell, // News icon alternative
    titleKey: "managePostsTitle",
    descKey: "managePostsDesc",
    colorClass: "text-purple-500",
    bgClass: "bg-purple-100 dark:bg-purple-500/10",
    borderClass: "border-purple-200 dark:border-purple-500/20",
    route: "/admin/posts",
    superAdminOnly: true,
  },
  {
    key: "donations",
    icon: Package,
    titleKey: "manageDonationsTitle",
    descKey: "manageDonationsDesc",
    colorClass: "text-emerald-500",
    bgClass: "bg-emerald-100 dark:bg-emerald-500/10",
    borderClass: "border-emerald-200 dark:border-emerald-500/20",
    route: "/admin/donations",
    badge: (stats) => stats?.pendingDonations > 0 ? `${stats.pendingDonations} pending` : null,
    pulse: true,
    superAdminOnly: false,
  },
  {
    key: "approvals",
    icon: CheckCircle,
    titleKey: "donationApprovalsTitle",
    descKey: "donationApprovalsDesc",
    colorClass: "text-emerald-500",
    bgClass: "bg-emerald-100 dark:bg-emerald-500/10",
    borderClass: "border-emerald-200 dark:border-emerald-500/20",
    route: "/admin/donation-approvals",
    badge: (stats) => stats?.pendingDonations > 0 ? `${stats.pendingDonations} pending` : null,
    pulse: true,
    superAdminOnly: false,
  },
  {
    key: "aid",
    icon: AlertCircle,
    titleKey: "aidRequestsTitle",
    descKey: "aidRequestsDesc",
    colorClass: "text-rose-500",
    bgClass: "bg-rose-100 dark:bg-rose-500/10",
    borderClass: "border-rose-200 dark:border-rose-500/20",
    route: "/admin/aid-requests",
    superAdminOnly: false,
  },
  {
    key: "store",
    icon: Home, // Store icon alternative
    titleKey: "storeInventoryTitle",
    descKey: "storeInventoryDesc",
    colorClass: "text-rose-500",
    bgClass: "bg-rose-100 dark:bg-rose-500/10",
    borderClass: "border-rose-200 dark:border-rose-500/20",
    route: "/admin/store",
    superAdminOnly: false,
  },
  {
    key: "audit",
    icon: ShieldCheck,
    titleKey: "auditLogsTitle",
    descKey: "auditLogsDesc",
    colorClass: "text-slate-500",
    bgClass: "bg-slate-100 dark:bg-slate-500/10",
    borderClass: "border-slate-200 dark:border-slate-500/20",
    route: "/admin/audit-logs",
    superAdminOnly: true,
  },
  {
    key: "users",
    icon: User,
    titleKey: "userManagementTitle",
    descKey: "userManagementDesc",
    colorClass: "text-violet-500",
    bgClass: "bg-violet-100 dark:bg-violet-500/10",
    borderClass: "border-violet-200 dark:border-violet-500/20",
    route: "/admin/users",
    superAdminOnly: true,
  }
];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { lang, toggleLanguage, t } = useLanguage();

  const [username, setUsername] = useState("");
  const [role, setRole] = useState("");
  const [township, setTownship] = useState("");
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [counterStarted, setCounterStarted] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedRole = localStorage.getItem("role");

    if (!token) {
      navigate("/login");
      return;
    }

    if (storedRole !== "ROLE_SUPER_ADMIN" && storedRole !== "ROLE_SUB_ADMIN") {
      navigate("/dashboard");
      return;
    }

    setUsername(localStorage.getItem("username") || "Admin");
    setRole(storedRole);
    setTownship(localStorage.getItem("township") || "");

    const fetchStats = async () => {
      try {
        const res = await api.get("/admin/stats");
        setStats(res.data);
      } catch (err) {
        console.error("Stats fetch failed:", err);
      } finally {
        setTimeout(() => setStatsLoading(false), 500);
        setTimeout(() => setCounterStarted(true), 600);
      }
    };
    fetchStats();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const isSuperAdmin = role === "ROLE_SUPER_ADMIN";
  const displayedCards = ACTION_CARDS_CONFIG.filter(c => isSuperAdmin || !c.superAdminOnly);

  const SkeletonCard = () => (
    <div className="bg-white dark:bg-slate-900/50 backdrop-blur border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm animate-pulse">
      <div className="flex justify-between items-start mb-4">
        <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-800"></div>
        <div className="w-10 h-8 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
      </div>
      <div className="w-24 h-4 bg-slate-200 dark:bg-slate-800 rounded"></div>
    </div>
  );

  const StatCard = ({ icon: Icon, label, value, colorClass, bgClass, borderClass, delay = 0 }) => {
    const animated = useCountUp(value ?? 0, 1400, counterStarted);
    return (
      <div className={`bg-white dark:bg-slate-900/50 backdrop-blur border ${borderClass} rounded-2xl p-5 shadow-sm flex flex-col justify-between hover:-translate-y-1 hover:shadow-lg transition-all duration-300`}>
        <div className="flex justify-between items-start mb-4">
          <div className={`p-2 rounded-xl ${bgClass} ${colorClass}`}>
            <Icon className="w-5 h-5" />
          </div>
          <span className="text-2xl font-black text-slate-800 dark:text-white">
            {value == null ? "—" : animated}
          </span>
        </div>
        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{label}</p>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-sans transition-colors duration-300 flex flex-col">
      
      {/* Top Navbar */}
      <nav className="sticky top-0 z-50 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 py-4 flex flex-wrap justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-lg transition cursor-pointer shrink-0 ${isSuperAdmin ? 'bg-gradient-to-tr from-rose-400 to-orange-500 shadow-rose-500/20' : 'bg-gradient-to-tr from-teal-400 to-blue-500 shadow-teal-500/20'}`}>
            <Shield className="w-4 h-4 text-white" />
          </div>
          <h1 className={`text-xl font-bold bg-gradient-to-r bg-clip-text text-transparent hidden sm:block ${isSuperAdmin ? 'from-rose-500 to-orange-600 dark:from-rose-400 dark:to-orange-400' : 'from-teal-500 to-blue-600 dark:from-teal-400 dark:to-blue-400'}`}>
            {t("commandCenter")}
          </h1>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono border bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            {role.replace("ROLE_", "")}
          </span>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-4">
          <Link to="/" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-sm font-semibold transition text-slate-600 dark:text-slate-300">
            <Home className="w-4 h-4" /> <span className="hidden md:block">{t("mainPage")}</span>
          </Link>

          <button onClick={toggleLanguage} className="p-2 rounded-full hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition flex items-center gap-1.5 text-sm font-medium border border-transparent dark:border-slate-700">
            <Globe className="w-4 h-4" />
            <span className="hidden sm:block">{lang === "en" ? "MY" : "EN"}</span>
          </button>
          
          <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition border border-transparent dark:border-slate-700">
            {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          <NotificationBell />
          
          <div className="hidden sm:block h-6 w-px bg-slate-200 dark:bg-slate-700"></div>
          
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-300">
            <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
            <span className="hidden md:block truncate max-w-[100px]">{username}</span>
          </div>

          <button
            onClick={handleLogout}
            className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition"
            title="Logout"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-8 relative z-10">
        
        {/* Welcome Banner */}
        <div className={`relative overflow-hidden bg-gradient-to-br rounded-3xl p-8 sm:p-10 text-white shadow-xl ${isSuperAdmin ? 'from-rose-500 via-orange-500 to-rose-700 shadow-rose-500/20 border border-rose-400/30' : 'from-teal-500 via-emerald-500 to-teal-700 shadow-teal-500/20 border border-teal-400/30'}`}>
          <div className="relative z-10">
            <h2 className="text-3xl sm:text-4xl font-extrabold mb-2">
              {t("welcomeBack")}, <br className="sm:hidden"/> {username}!
            </h2>
            <p className="text-white/90 max-w-lg mt-3 text-sm sm:text-base opacity-90">
              {t("adminDashboardDesc")}
            </p>
            {!isSuperAdmin && township && (
              <div className="mt-6 inline-flex items-center gap-2 text-sm font-bold bg-white/20 backdrop-blur border border-white/20 px-4 py-2 rounded-xl">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Managing: {township}
              </div>
            )}

            {/* Quick Actions for Admins */}
            <div className={`flex flex-wrap gap-3 ${!isSuperAdmin && township ? 'mt-4' : 'mt-6'}`}>
                <button onClick={() => navigate("/campaigns")} className={`px-5 py-2.5 bg-white font-bold rounded-xl shadow-md hover:scale-105 transition flex items-center gap-2 ${isSuperAdmin ? 'text-rose-600' : 'text-teal-600'}`}>
                  <HeartHandshake className="w-5 h-5" /> Donate Now
                </button>
                <button onClick={() => navigate("/aid-requests")} className="px-5 py-2.5 bg-black/20 backdrop-blur border border-white/20 text-white font-bold rounded-xl hover:bg-black/30 transition flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" /> Request Aid
                </button>
            </div>
          </div>
          <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-[400px] h-[400px] bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
        </div>

        {/* Live Metrics */}
        <div>
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Settings className="w-5 h-5 text-slate-400" /> {t("liveMetrics")}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {statsLoading ? (
              <>
                <SkeletonCard /> <SkeletonCard /> <SkeletonCard /> <SkeletonCard />
                {isSuperAdmin && <SkeletonCard />}
              </>
            ) : (
              <>
                <StatCard 
                  icon={Users} 
                  label={t("totalVolunteers")} 
                  value={stats?.totalVolunteers} 
                  colorClass="text-blue-500 dark:text-blue-400" 
                  bgClass="bg-blue-100 dark:bg-blue-500/20" 
                  borderClass="border-blue-100 dark:border-blue-500/20" 
                />
                {isSuperAdmin && (
                  <StatCard 
                    icon={HeartHandshake} 
                    label={t("totalCampaigns")} 
                    value={stats?.totalCampaigns} 
                    colorClass="text-teal-500 dark:text-teal-400" 
                    bgClass="bg-teal-100 dark:bg-teal-500/20" 
                    borderClass="border-teal-100 dark:border-teal-500/20" 
                  />
                )}
                {isSuperAdmin && (
                  <StatCard 
                    icon={ShieldCheck} 
                    label={t("totalAdmins")} 
                    value={stats?.totalAdmins} 
                    colorClass="text-purple-500 dark:text-purple-400" 
                    bgClass="bg-purple-100 dark:bg-purple-500/20" 
                    borderClass="border-purple-100 dark:border-purple-500/20" 
                  />
                )}
                <StatCard 
                  icon={Package} 
                  label={t("pendingDonations")} 
                  value={stats?.pendingDonations} 
                  colorClass="text-orange-500 dark:text-orange-400" 
                  bgClass="bg-orange-100 dark:bg-orange-500/20" 
                  borderClass="border-orange-100 dark:border-orange-500/20" 
                />
                <StatCard 
                  icon={AlertCircle} 
                  label={t("pendingAidReq")} 
                  value={stats?.pendingAidRequests} 
                  colorClass="text-rose-500 dark:text-rose-400" 
                  bgClass="bg-rose-100 dark:bg-rose-500/20" 
                  borderClass="border-rose-100 dark:border-rose-500/20" 
                />
              </>
            )}
          </div>
        </div>

        {/* Operations & Actions */}
        <div>
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-slate-400" /> {t("operationsActions")}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {displayedCards.map((card) => {
              const Icon = card.icon;
              const badgeContent = card.badge ? card.badge(stats) : null;
              
              return (
                <div 
                  key={card.key}
                  onClick={() => navigate(card.route)}
                  className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 hover:shadow-lg hover:-translate-y-1 hover:border-slate-300 dark:hover:border-slate-600 transition-all group cursor-pointer flex flex-col"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl transition-transform group-hover:scale-110 ${card.bgClass} ${card.colorClass}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <h4 className="font-bold">{t(card.titleKey)}</h4>
                    </div>
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 flex-1">
                    {t(card.descKey)}
                  </p>
                  
                  <div className="flex items-center justify-between mt-auto">
                    {badgeContent ? (
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md border ${card.pulse ? 'animate-pulse' : ''} ${card.colorClass} ${card.bgClass} ${card.borderClass}`}>
                        {badgeContent}
                      </span>
                    ) : (
                      <span></span>
                    )}
                    <div className="text-slate-600 dark:text-slate-400 font-semibold text-sm flex items-center gap-1 group-hover:gap-2 transition-all">
                      {t("manageAction")} <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
