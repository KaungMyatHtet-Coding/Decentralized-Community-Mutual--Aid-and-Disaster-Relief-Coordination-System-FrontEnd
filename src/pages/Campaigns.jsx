import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { useLanguage } from "../contexts/LanguageContext";
import { Share2, AlertCircle, Calendar } from "lucide-react";

function Campaigns() {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { lang } = useLanguage();
  const [tab, setTab] = useState("ACTIVE");

  useEffect(() => {
    api
      .get("/campaigns")
      .then((res) => setCampaigns(res.data.filter(c => c.status !== "PENDING" && c.status !== "REJECTED")))
      .catch(() => setError("Failed to load campaigns."))
      .finally(() => setLoading(false));
  }, []);

  const getProgress = (current, target) => {
    if (!target || target === 0) return 0;
    return Math.min(Math.round((current / target) * 100), 100);
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat("my-MM").format(amount) + " ks";
  };

  const handleShare = (e, id) => {
    e.stopPropagation();
    navigator.clipboard.writeText(`${window.location.origin}/donate/${id}`);
    alert("Campaign link copied to clipboard!");
  };

  const activeCampaigns = campaigns.filter(c => c.status === "ACTIVE");
  const pastCampaigns = campaigns.filter(c => c.status === "COMPLETED" || c.status === "CANCELLED");
  const displayedCampaigns = tab === "ACTIVE" ? activeCampaigns : pastCampaigns;

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 sm:p-6 pb-24">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 border-b border-slate-800 pb-5">
          <div>
            <h1 className="text-3xl font-black bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent">
              💰 {lang === "en" ? "Donation Campaigns" : "အလှူခံပရောဂျက်များ"}
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              {lang === "en" 
                ? "Help us make a difference by supporting these causes." 
                : "အကူအညီလိုအပ်နေသူများကို ကူညီပေးနိုင်ရန် ဤပရောဂျက်များကို ပံ့ပိုးပေးပါ။"}
            </p>
          </div>
          <button
            onClick={() => navigate("/dashboard")}
            className="bg-slate-900 hover:bg-slate-800 text-sm font-semibold border border-slate-800 px-5 py-2.5 rounded-xl transition cursor-pointer"
          >
            ← {lang === "en" ? "Back" : "နောက်သို့"}
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-3">
          <button
            onClick={() => setTab("ACTIVE")}
            className={`px-5 py-2 rounded-xl text-sm font-bold border transition cursor-pointer ${
              tab === "ACTIVE"
                ? "bg-teal-500 text-slate-950 border-teal-500 shadow-lg shadow-teal-500/20"
                : "bg-slate-900 text-gray-400 border-slate-800 hover:border-slate-600"
            }`}
          >
            {lang === "en" ? `🟢 Active (${activeCampaigns.length})` : `🟢 လက်ရှိပရောဂျက်များ (${activeCampaigns.length})`}
          </button>
          <button
            onClick={() => setTab("PAST")}
            className={`px-5 py-2 rounded-xl text-sm font-bold border transition cursor-pointer ${
              tab === "PAST"
                ? "bg-blue-500 text-white border-blue-500 shadow-lg shadow-blue-500/20"
                : "bg-slate-900 text-gray-400 border-slate-800 hover:border-slate-600"
            }`}
          >
            {lang === "en" ? `📁 Past Campaigns (${pastCampaigns.length})` : `📁 ပြီးစီးသွားသော ပရောဂျက်များ (${pastCampaigns.length})`}
          </button>
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl text-sm text-center font-semibold">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-16 text-teal-400 animate-pulse text-sm font-bold">
            {lang === "en" ? "Loading campaigns..." : "ကမ်ပိန်းများ ရှာဖွေနေပါသည်..."}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayedCampaigns.map((c) => {
              const progress = getProgress(c.currentAmount, c.targetAmount);
              const title = (lang === "my" && c.titleMy) ? c.titleMy : c.title;
              const description = (lang === "my" && c.descriptionMy) ? c.descriptionMy : c.description;

              return (
                <div
                  key={c.id}
                  className="group bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden hover:border-teal-500/50 hover:shadow-xl hover:shadow-teal-500/10 transition-all duration-300 flex flex-col"
                >
                  {/* Hero Image */}
                  <div className="relative h-48 w-full bg-slate-800 overflow-hidden">
                    {c.imageUrl ? (
                      <img 
                        src={c.imageUrl} 
                        alt={title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-600">
                        <AlertCircle className="w-8 h-8 opacity-50" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent"></div>
                    
                    {/* Tags overlay */}
                    <div className="absolute top-3 left-3 flex flex-wrap gap-2">
                      {c.category && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider bg-rose-500 text-white shadow-lg flex items-center gap-1 uppercase">
                          🔥 {c.category}
                        </span>
                      )}
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase border shadow-lg ${
                        c.status === "ACTIVE" ? "bg-emerald-500/90 text-white border-emerald-400" :
                        "bg-slate-800/90 text-gray-300 border-slate-600"
                      }`}>
                        {c.status}
                      </span>
                    </div>

                    <button 
                      onClick={(e) => handleShare(e, c.id)}
                      className="absolute top-3 right-3 p-2 rounded-full bg-black/50 hover:bg-teal-500 text-white backdrop-blur transition border border-white/10"
                      title="Share Campaign"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Content */}
                  <div className="p-5 flex flex-col flex-1 gap-4">
                    <div>
                      <h3 className="font-bold text-white text-lg leading-tight mb-2 group-hover:text-teal-400 transition-colors">
                        {title}
                      </h3>
                      <p className="text-sm text-gray-400 leading-relaxed line-clamp-3">
                        {description}
                      </p>
                    </div>

                    {/* Progress */}
                    <div className="space-y-2 mt-auto">
                      <div className="flex justify-between text-[11px] font-bold">
                        <span className="text-teal-400">{formatAmount(c.currentAmount)}</span>
                        <span className="text-gray-500">{c.targetAmount ? formatAmount(c.targetAmount) : "Flexible Goal"}</span>
                      </div>
                      {c.targetAmount > 0 && (
                        <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-teal-500 to-emerald-400 h-full rounded-full transition-all duration-1000 relative"
                            style={{ width: `${progress}%` }}
                          >
                            <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-gray-500 font-medium">
                      <Calendar className="w-3.5 h-3.5" />
                      {c.endDate ? `Ends: ${new Date(c.endDate).toLocaleDateString()}` : "No End Date"}
                    </div>

                    {/* Action */}
                    {c.status === "ACTIVE" && (
                      <button
                        onClick={() => navigate(`/donate/${c.id}`)}
                        className="w-full bg-teal-500 hover:bg-teal-400 hover:-translate-y-0.5 text-slate-950 font-black py-3 rounded-xl transition-all shadow-lg shadow-teal-500/20 text-sm mt-2 flex items-center justify-center gap-2 sticky bottom-4 z-10"
                      >
                        💚 {lang === "en" ? "Donate Now" : "ယခုလှူဒါန်းမည်"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
            
            {displayedCampaigns.length === 0 && (
              <div className="col-span-full text-center py-20 bg-slate-900/20 border border-slate-800 border-dashed rounded-3xl">
                <p className="text-gray-400 text-sm font-medium">
                  {lang === "en" ? "No campaigns available in this category." : "ဤကဏ္ဍတွင် ပရောဂျက်များ မရှိသေးပါ။"}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Campaigns;
