import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function Dashboard() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [role, setRole] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUsername = localStorage.getItem("username");
    const storedRole = localStorage.getItem("role");

    // Token မရှိရင် Login ကို ပြန်မောင်းထုတ်မယ်
    if (!token) {
      navigate("/login");
    } else {
      setUsername(storedUsername || "Brother");
      setRole(storedRole || "ROLE_PUBLIC");
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.clear(); // LocalStorage ထဲက data အကုန် ဖျက်ထုတ်ပစ်မယ်
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      {/* Navbar */}
      <nav className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800/60 px-6 py-4 flex justify-between items-center sticky top-0 z-50">
        <h1 className="text-xl font-bold bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent">
          Hnaung Kyoe Platform 🔗
        </h1>
        <div className="flex items-center gap-4">
          {/* User Role Badge လေး ပြပေးထားမယ် */}
          <span className="text-[10px] bg-teal-500/10 text-teal-400 border border-teal-500/20 px-2.5 py-1 rounded-full font-mono uppercase tracking-wider">
            {role.replace("ROLE_", "")}
          </span>
          <button
            onClick={handleLogout}
            className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 px-4 py-2 rounded-xl text-sm font-semibold transition cursor-pointer active:scale-95"
          >
            Logout
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex-1 p-6 max-w-6xl w-full mx-auto space-y-6">
        {/* Welcome Card */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-teal-950/20 border border-slate-800 p-6 rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/5 rounded-full blur-2xl"></div>
          <h2 className="text-2xl font-extrabold text-white">
            Welcome Back,{" "}
            <span className="text-teal-400 font-black">{username}</span>! 👋
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            Here is the update from Hnaung Kyoe platform for today.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Box 1: Aid Requests */}
          <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/80 p-6 rounded-2xl space-y-4 hover:border-slate-700 transition duration-300 flex flex-col justify-between">
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-emerald-400 flex items-center gap-2">
                🆘 Aid Requests
              </h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                View or create requests for emergency aid, supplies, and
                community support.
              </p>
            </div>
            <button
              onClick={() => navigate("/aid-requests")}
              className="w-full text-sm bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-2.5 rounded-xl transition shadow-lg shadow-emerald-500/10 cursor-pointer active:scale-98"
            >
              View Requests
            </button>
          </div>

          {/* Box 2: Campaigns & Donations */}
          <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/80 p-6 rounded-2xl space-y-4 hover:border-slate-700 transition duration-300 flex flex-col justify-between">
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-teal-400 flex items-center gap-2">
                💰 Donation Campaigns
              </h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Support verified donation programs and contribute to funding
                people in need.
              </p>
            </div>
            {/* Dashboard.jsx ထဲက Box 2 ရဲ့ ခလုတ်ကို ရှာပြီး ဒါလေး ပြင်ပေးပါ */}
            <button
              onClick={() => navigate("/campaigns")} // <--- လမ်းကြောင်း ညွှန်းပေးလိုက်ခြင်း ✨
              className="w-full text-sm bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold py-2.5 rounded-xl transition shadow-lg shadow-teal-500/10 cursor-pointer active:scale-98"
            >
              Browse Campaigns
            </button>
          </div>

          {/* Box 3: Volunteer Applications */}
          <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/80 p-6 rounded-2xl space-y-4 hover:border-slate-700 transition duration-300 flex flex-col justify-between">
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-blue-400 flex items-center gap-2">
                🤝 Volunteers
              </h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Join our team as a verified volunteer and participate in
                on-field aid activities.
              </p>
            </div>
            <button className="w-full text-sm bg-blue-500 hover:bg-blue-400 text-slate-950 font-bold py-2.5 rounded-xl transition shadow-lg shadow-blue-500/10 cursor-pointer active:scale-98">
              Apply Now
            </button>
          </div>
        </div>

        {/* Box 4: News Feed — အသစ် */}
        <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/80 p-6 rounded-2xl space-y-4 hover:border-slate-700 transition duration-300 flex flex-col justify-between">
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-orange-400 flex items-center gap-2">
              📰 News & Updates
            </h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              Stay updated with the latest news and announcements from the
              platform.
            </p>
          </div>
          <button
            onClick={() => navigate("/news")}
            className="w-full text-sm bg-orange-500 hover:bg-orange-400 text-slate-950 font-bold py-2.5 rounded-xl transition shadow-lg shadow-orange-500/10 cursor-pointer active:scale-98"
          >
            Read News
          </button>
        </div>

        {/* 👑 Admin Zone (Super Admin သို့မဟုတ် Sub Admin ဖြစ်မှ မြင်ရမယ့် နေရာ) */}
        {(role === "ROLE_SUPER_ADMIN" || role === "ROLE_SUB_ADMIN") && (
          <div className="bg-rose-500/5 border border-rose-500/20 p-6 rounded-2xl border-dashed">
            <h3 className="text-base font-bold text-rose-400 uppercase tracking-wider mb-2">
              🛡️ Administrative Controls
            </h3>
            <p className="text-xs text-gray-400 mb-4">
              This section is only visible to authorized administrators. You can
              approve pending items here.
            </p>
            <div className="flex gap-3">
              {/* Dashboard.jsx အောက်ခြေနားက Admin Zone ခလုတ်ကို ရှာပြီး ဒါလေး ပြင်ပါ */}
              <button
                onClick={() => navigate("/admin/dashboard")} // <--- အက်ဒမင် စာမျက်နှာသို့ ပို့ဆောင်ခြင်း ✨
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
        <button
          onClick={() => navigate("/donation-history")} // <--- အလှူမှတ်တမ်းသို့ ပို့ဆောင်ခြင်း ✨
          className="bg-teal-500/10 hover:bg-teal-500/20 text-teal-400 border border-teal-500/20 px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition"
        >
          📜 View My Donations
        </button>
      </div>
    </div>
  );
}

export default Dashboard;
