import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext";
import { useLanguage } from "../contexts/LanguageContext";
import api from "../api";
import { 
  Sun, 
  Moon, 
  Globe, 
  HeartHandshake, 
  Package, 
  ArrowRight,
  LogOut,
  LayoutDashboard,
  Newspaper,
  Flame, 
  Wind, 
  Activity, 
  Droplets, 
  ShieldAlert
} from "lucide-react";

const SURVIVAL_GUIDES = [
  {
    id: "earthquake",
    icon: Activity,
    titleEn: "Earthquake Survival",
    titleMy: "ငလျင်ဘေး အသိပညာပေး",
    color: "from-amber-500 to-orange-600",
    dosEn: ["Drop, Cover, and Hold On", "Stay away from glass & windows", "If outdoors, move to a clear area"],
    dosMy: ["ဝပ်နေပါ၊ ကာကွယ်ပါ၊ မြဲမြဲကိုင်ထားပါ", "မှန်တံခါး၊ ပြတင်းပေါက်များနှင့် ဝေးဝေးနေပါ", "အပြင်ရောက်နေပါက ကွင်းပြင်သို့သွားပါ"],
    dontsEn: ["Do not use elevators", "Do not run outside during shaking"],
    dontsMy: ["ဓာတ်လှေကား အသုံးမပြုရ", "ငလျင်လှုပ်နေစဉ် အပြင်သို့ မပြေးရ"]
  },
  {
    id: "flood",
    icon: Droplets,
    titleEn: "Flood Preparedness",
    titleMy: "ရေကြီးရေလျှံမှု အသိပညာပေး",
    color: "from-blue-500 to-cyan-600",
    dosEn: ["Move to higher ground immediately", "Turn off main power & gas", "Prepare an emergency go-bag"],
    dosMy: ["ကုန်းမြင့်ရာသို့ ချက်ချင်းပြောင်းရွှေ့ပါ", "လျှပ်စစ်နှင့် ဂက်စ်မီး ခလုတ်များ ပိတ်ထားပါ", "အရေးပေါ်သုံးပစ္စည်းများ ကြိုတင်ပြင်ဆင်ပါ"],
    dontsEn: ["Do not walk or drive through flood waters", "Avoid drinking tap water"],
    dontsMy: ["ရေကြီးနေသောနေရာတွင် လမ်းလျှောက်/ကားမောင်းခြင်း မပြုရ", "ရေဘုံဘိုင်ရေကို မကျိုချက်ဘဲ မသောက်ရ"]
  },
  {
    id: "fire",
    icon: Flame,
    titleEn: "Fire Emergency",
    titleMy: "မီးဘေးအန္တရာယ် အသိပညာပေး",
    color: "from-rose-500 to-red-600",
    dosEn: ["Crawl low under smoke", "Check doors for heat before opening", "Call emergency services (191) immediately"],
    dosMy: ["မီးခိုးငွေ့အောက်မှ တွားသွားပါ", "တံခါးမဖွင့်မီ ပူ/မပူ အရင်စမ်းပါ", "မီးသတ်ဌာန (၁၉၁) သို့ ချက်ချင်းအကြောင်းကြားပါ"],
    dontsEn: ["Do not go back inside for belongings", "Do not use water on electrical fires"],
    dontsMy: ["ပစ္စည်းယူရန် အိမ်ထဲသို့ ပြန်မဝင်ရ", "လျှပ်စစ်မီးလောင်မှုကို ရေဖြင့် မငြှိမ်းသတ်ရ"]
  },
  {
    id: "storm",
    icon: Wind,
    titleEn: "Cyclone & Storm",
    titleMy: "မုန်တိုင်းဘေး အသိပညာပေး",
    color: "from-indigo-500 to-purple-600",
    dosEn: ["Secure loose outdoor items", "Stay indoors away from windows", "Listen to official weather updates"],
    dosMy: ["အပြင်ရှိ လွင့်စင်နိုင်သော ပစ္စည်းများကို သိမ်းဆည်းပါ", "အိမ်တွင်း ပြတင်းပေါက်များနှင့် ဝေးရာတွင်နေပါ", "မိုးလေဝသ သတင်းများကို စောင့်ကြည့်ပါ"],
    dontsEn: ["Do not go outside during the calm eye of the storm", "Do not use landline phones"],
    dontsMy: ["မုန်တိုင်း မျက်စိဖြတ်သန်းချိန် လေငြိမ်သွားသော်လည်း အပြင်မထွက်ရ", "ကြိုးဖုန်းများကို အသုံးမပြုရ"]
  }
];

export default function HomePage() {
  const { theme, toggleTheme } = useTheme();
  const { lang, toggleLanguage, t } = useLanguage();
  const navigate = useNavigate();

  const [campaigns, setCampaigns] = useState([]);
  const [publicAidRequests, setPublicAidRequests] = useState([]);
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);

  // Check login state
  const isLoggedIn = !!localStorage.getItem("token");

  useEffect(() => {
    // Fetch campaigns, public aid requests & news
    const fetchData = async () => {
      try {
        const [campRes, aidRes, newsRes] = await Promise.all([
          api.get("/campaigns").catch(() => ({ data: [] })),
          api.get("/aid-requests").catch(() => ({ data: [] })),
          api.get("/posts").catch(() => ({ data: [] }))
        ]);
        setCampaigns(campRes.data.slice(0, 3));
        setPublicAidRequests(aidRes.data.slice(0, 3));
        setNews(newsRes.data.slice(0, 3));
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setTimeout(() => setLoading(false), 1500);
      }
    };
    fetchData();
  }, []);

  const handleAction = (path) => {
    if (!isLoggedIn) {
      navigate("/register");
    } else {
      navigate(path);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
    window.location.reload();
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-US", { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-sans transition-colors duration-300">
      
      {/* Navbar */}
      <nav className="sticky top-0 z-50 backdrop-blur-xl bg-white/70 dark:bg-slate-950/70 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.scrollTo(0,0)}>
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-teal-400 to-emerald-500 flex items-center justify-center">
                <HeartHandshake className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl bg-clip-text text-transparent bg-gradient-to-r from-teal-500 to-emerald-600 dark:from-teal-400 dark:to-emerald-400">
                Hnaung Kyoe
              </span>
            </div>
            
            <div className="flex items-center gap-4">
              <button 
                onClick={toggleLanguage}
                className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition flex items-center gap-2 text-sm font-medium"
              >
                <Globe className="w-4 h-4" />
                <span>{lang === "en" ? "MY" : "EN"}</span>
              </button>
              
              <button 
                onClick={toggleTheme}
                className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition"
              >
                {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>

              <div className="hidden sm:flex items-center gap-3 border-l pl-4 border-slate-200 dark:border-slate-700">
                {!isLoggedIn ? (
                  <>
                    <Link to="/login" className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-400 transition">
                      {t("login")}
                    </Link>
                    <Link to="/register" className="px-4 py-2 text-sm font-semibold bg-teal-500 hover:bg-teal-600 text-white rounded-lg transition shadow-md shadow-teal-500/20">
                      {t("register")}
                    </Link>
                  </>
                ) : (
                  <>
                    <Link to={localStorage.getItem("role") === "ROLE_SUPER_ADMIN" || localStorage.getItem("role") === "ROLE_SUB_ADMIN" ? "/admin/dashboard" : "/dashboard"} className="px-4 py-2 text-sm font-semibold bg-slate-800 dark:bg-white text-white dark:text-slate-900 rounded-lg transition hover:scale-105 active:scale-95 flex items-center gap-2">
                      <LayoutDashboard className="w-4 h-4" /> Dashboard
                    </Link>
                    <button onClick={handleLogout} className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition">
                      <LogOut className="w-5 h-5" />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-teal-500/10 dark:bg-teal-500/5 rounded-full blur-[100px] -z-10 pointer-events-none"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6">
            <span className="block text-slate-800 dark:text-slate-100">{t("heroTitle")}</span>
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-emerald-500 pb-2">
              Disaster Relief Network
            </span>
          </h1>
          <p className="mt-4 max-w-2xl text-lg md:text-xl text-slate-600 dark:text-slate-400 mx-auto mb-10">
            {t("heroSubtitle")}
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button 
              onClick={() => handleAction("/campaigns")}
              className="px-8 py-4 text-base font-bold text-white bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 rounded-xl shadow-xl shadow-teal-500/30 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
            >
              <HeartHandshake className="w-5 h-5" />
              {t("donateNow")}
            </button>
            <button 
              onClick={() => handleAction("/volunteer-apply")}
              className="px-8 py-4 text-base font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl shadow-lg transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
            >
              <Package className="w-5 h-5" />
              {t("volunteerNow")}
            </button>
          </div>
        </div>
      </section>

      {/* Survival Guides Section */}
      <section className="py-20 bg-slate-100 dark:bg-slate-900/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 flex items-center justify-center gap-3">
              <ShieldAlert className="w-8 h-8 text-amber-500" />
              {lang === "en" ? "Emergency Survival Guides" : "အရေးပေါ် အသက်ကယ် လမ်းညွှန်များ"}
            </h2>
            <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              {lang === "en" 
                ? "Essential do's and don'ts during major disasters. Hover over a card to read."
                : "အရေးပေါ်အခြေအနေများတွင် လိုက်နာရမည့်၊ ရှောင်ကြဉ်ရမည့် အချက်များ။ ဖတ်ရှုရန် ကတ်ပေါ်သို့ Mouse တင်ပါ။"}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {SURVIVAL_GUIDES.map((guide) => {
              const Icon = guide.icon;
              return (
                <div 
                  key={guide.id}
                  className="group relative bg-white dark:bg-slate-800 rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-lg hover:shadow-2xl transition-all duration-500 h-[380px]"
                >
                  {/* Default State (Front) */}
                  <div className="absolute inset-0 p-8 flex flex-col items-center justify-center text-center transition-opacity duration-500 group-hover:opacity-0">
                    <div className={`w-24 h-24 rounded-full mb-6 bg-gradient-to-br ${guide.color} p-1 shadow-lg`}>
                      <div className="w-full h-full bg-white dark:bg-slate-900 rounded-full flex items-center justify-center">
                        <Icon className="w-12 h-12 text-slate-800 dark:text-white" />
                      </div>
                    </div>
                    <h3 className="text-2xl font-bold mb-2 text-slate-800 dark:text-white">
                      {lang === "en" ? guide.titleEn : guide.titleMy}
                    </h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mt-4">
                      {lang === "en" ? "Hover to view guidelines" : "လမ်းညွှန်ချက်များ ဖတ်ရန်"} &rarr;
                    </p>
                  </div>

                  {/* Hover State (Details) */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${guide.color} p-6 flex flex-col justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500 text-white overflow-y-auto`}>
                    <h3 className="text-xl font-bold mb-4 text-center border-b border-white/20 pb-2">
                      {lang === "en" ? guide.titleEn : guide.titleMy}
                    </h3>
                    
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-bold text-emerald-200 mb-2 flex items-center gap-1 text-sm">
                          ✅ {lang === "en" ? "DO'S" : "လုပ်ရမည့်အချက်များ"}
                        </h4>
                        <ul className="text-xs space-y-1.5 pl-1">
                          {(lang === "en" ? guide.dosEn : guide.dosMy).map((item, i) => (
                            <li key={i} className="flex items-start gap-1.5 leading-snug">
                              <span className="text-emerald-300 mt-0.5">•</span> {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      <div>
                        <h4 className="font-bold text-rose-200 mb-2 flex items-center gap-1 text-sm">
                          ❌ {lang === "en" ? "DON'TS" : "ရှောင်ကြဉ်ရမည့်အချက်များ"}
                        </h4>
                        <ul className="text-xs space-y-1.5 pl-1">
                          {(lang === "en" ? guide.dontsEn : guide.dontsMy).map((item, i) => (
                            <li key={i} className="flex items-start gap-1.5 leading-snug">
                              <span className="text-rose-300 mt-0.5">•</span> {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Public Aid Requests (Transparency Section) */}
      <section className="py-20 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-3xl font-bold flex items-center gap-2">
                <span className="text-rose-500">🆘</span> Emergency Aid Requests
              </h2>
              <p className="text-sm text-slate-500 mt-2">See where our community needs help right now.</p>
              <div className="w-20 h-1 bg-rose-500 rounded-full mt-4"></div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow border border-slate-100 dark:border-slate-700 animate-pulse">
                  <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-1/2 mb-4"></div>
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full mb-2"></div>
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
                </div>
              ))
            ) : (
              publicAidRequests.length > 0 ? publicAidRequests.map(req => (
                <div key={req.id} className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow hover:shadow-lg transition border border-slate-100 dark:border-slate-700">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-bold text-lg line-clamp-1">{req.title}</h3>
                    <span className="text-xs px-2 py-1 bg-rose-100 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400 rounded-full font-mono">
                      {req.status}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 line-clamp-2">
                    {req.description}
                  </p>
                  <div className="text-xs font-mono text-slate-400 flex items-center gap-1">
                    📍 {req.township}, {req.wardOrVillage}
                  </div>
                </div>
              )) : (
                <div className="col-span-3 text-center py-10 text-slate-500">
                  No emergency requests at the moment.
                </div>
              )
            )}
          </div>
        </div>
      </section>

      {/* Current Campaigns */}
      <section className="py-20 bg-slate-100 dark:bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-3xl font-bold">{t("currentCampaigns")}</h2>
              <div className="w-20 h-1 bg-teal-500 rounded-full mt-4"></div>
            </div>
            <Link to="/campaigns" className="text-teal-600 dark:text-teal-400 font-semibold hover:underline flex items-center gap-1">
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-700 animate-pulse">
                  <div className="w-full h-48 bg-slate-200 dark:bg-slate-700 rounded-xl mb-4"></div>
                  <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-3"></div>
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full mb-2"></div>
                </div>
              ))
            ) : (
              campaigns.length > 0 ? campaigns.map(c => (
                <div key={c.id} className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-lg hover:shadow-xl transition-shadow border border-slate-100 dark:border-slate-700 flex flex-col">
                  {c.imageUrl ? (
                    <img src={c.imageUrl} alt={c.title} className="w-full h-48 object-cover rounded-xl mb-4" />
                  ) : (
                    <div className="w-full h-48 bg-slate-200 dark:bg-slate-700 rounded-xl mb-4 flex items-center justify-center">
                      <HeartHandshake className="w-10 h-10 text-slate-400" />
                    </div>
                  )}
                  <h3 className="text-xl font-bold mb-2 line-clamp-1">{c.title}</h3>
                  <p className="text-slate-600 dark:text-slate-400 text-sm mb-4 line-clamp-2 flex-grow">{c.description}</p>
                  <div className="flex justify-between items-center mt-auto pt-4 border-t border-slate-100 dark:border-slate-700">
                    <span className="text-sm font-semibold text-teal-600 dark:text-teal-400">Target: {c.targetAmount}</span>
                    <button 
                      onClick={() => handleAction(`/donate/${c.id}`)}
                      className="px-4 py-2 bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400 font-bold rounded-lg hover:bg-teal-100 dark:hover:bg-teal-500/20 transition"
                    >
                      Donate
                    </button>
                  </div>
                </div>
              )) : (
                <div className="col-span-3 text-center py-10 text-slate-500">
                  No active campaigns found.
                </div>
              )
            )}
          </div>
        </div>
      </section>

      {/* Latest News & Updates (NEW SECTION) */}
      <section className="py-20 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-3xl font-bold flex items-center gap-3">
                <Newspaper className="w-8 h-8 text-blue-500" /> Latest News & Updates
              </h2>
              <div className="w-20 h-1 bg-blue-500 rounded-full mt-4"></div>
            </div>
            <Link to="/news" className="text-blue-600 dark:text-blue-400 font-semibold hover:underline flex items-center gap-1">
              Read All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700 animate-pulse">
                  <div className="w-16 h-4 bg-slate-200 dark:bg-slate-700 rounded mb-4"></div>
                  <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-full mb-3"></div>
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
                </div>
              ))
            ) : (
              news.length > 0 ? news.map(post => (
                <div key={post.id} className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow hover:shadow-xl transition border border-slate-100 dark:border-slate-700 flex flex-col cursor-pointer" onClick={() => navigate(`/news/${post.id}`)}>
                  {post.imageUrl && (
                    <img src={post.imageUrl} alt={post.title} className="w-full h-40 object-cover rounded-xl mb-4" />
                  )}
                  <span className="text-xs font-semibold text-blue-500 dark:text-blue-400 mb-2">{formatDate(post.createdAt)}</span>
                  <h3 className="text-lg font-bold mb-3 line-clamp-2 hover:text-blue-500 transition">{post.title}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-3 mb-4">{post.content}</p>
                  <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-700 text-sm font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                    Read More <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              )) : (
                <div className="col-span-3 text-center py-10 text-slate-500">
                  No recent news updates.
                </div>
              )
            )}
          </div>
        </div>
      </section>

      {/* Donation Channels */}
      <section className="py-20 bg-slate-100 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">{t("donationChannels")}</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-12 max-w-2xl mx-auto">
            We accept both financial contributions and essential items to support our relief efforts.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="bg-gradient-to-br from-teal-500 to-emerald-600 p-8 rounded-3xl text-white shadow-xl shadow-teal-500/20 transform transition hover:-translate-y-2">
              <HeartHandshake className="w-12 h-12 mb-6 mx-auto" />
              <h3 className="text-2xl font-bold mb-4">{t("moneyDonation")}</h3>
              <p className="text-teal-50 mb-6">Support via KBZPay, WaveMoney, or direct bank transfer to our official accounts.</p>
              <button 
                onClick={() => handleAction("/campaigns")}
                className="bg-white text-teal-600 px-6 py-3 rounded-xl font-bold w-full hover:bg-teal-50 transition"
              >
                Donate Funds
              </button>
            </div>
            
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-8 rounded-3xl shadow-xl transform transition hover:-translate-y-2">
              <Package className="w-12 h-12 text-blue-500 mb-6 mx-auto" />
              <h3 className="text-2xl font-bold mb-4 text-slate-900 dark:text-white">{t("itemDonation")}</h3>
              <p className="text-slate-600 dark:text-slate-400 mb-6">Donate clothes, food, or medical supplies. Drop off or request a volunteer pickup.</p>
              <button 
                onClick={() => handleAction("/my-item-donations")}
                className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-3 rounded-xl font-bold w-full hover:bg-slate-800 dark:hover:bg-slate-100 transition"
              >
                Donate Items
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 border-t border-slate-200 dark:border-slate-800 text-center text-slate-500 dark:text-slate-400 text-sm">
        <p>&copy; {new Date().getFullYear()} Hnaung Kyoe. All rights reserved.</p>
      </footer>
    </div>
  );
}
