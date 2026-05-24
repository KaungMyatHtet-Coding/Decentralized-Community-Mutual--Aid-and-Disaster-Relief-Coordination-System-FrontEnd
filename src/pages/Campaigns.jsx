import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

function Campaigns() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        const response = await api.get("/campaigns");
        setCampaigns(response.data);
      } catch (err) {
        setError("Failed to load campaigns. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchCampaigns();
  }, []);

  // ညီလေးရဲ့ 1.jpg ကနေ 13.jpg ပုံတွေကို id အလိုက် auto ခွဲပေးမယ့် function
  const getCampaignImage = (id) => {
    const imageNumber = (id % 13) + 1; // 1 မှ 13 ကြား ပတ်လည်ထွက်ပေးမယ်
    return `/src/assets/${imageNumber}.jpg`;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-6xl w-full mx-auto space-y-6">
        {/* Header အပိုင်း */}
        <div className="flex justify-between items-center border-b border-slate-800 pb-5">
          <div>
            <h1 className="text-3xl font-extrabold bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent">
              Donation Campaigns 💰
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              Support verified donation programs to help people in need.
            </p>
          </div>
          <button
            onClick={() => navigate("/dashboard")}
            className="bg-slate-900 hover:bg-slate-800 text-sm border border-slate-800 px-4 py-2 rounded-xl transition cursor-pointer"
          >
            ← Back to Dashboard
          </button>
        </div>

        {/* Error သို့မဟုတ် Loading ပြသခြင်း */}
        {loading && (
          <div className="text-center py-10 text-teal-400 animate-pulse text-sm">
            Loading active campaigns...
          </div>
        )}
        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl text-center text-sm">
            {error}
          </div>
        )}

        {/* Campaigns Grid ကတ်ပြားများ */}
        {!loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {campaigns.map((campaign) => {
              // Progress ရာခိုင်နှုန်း တွက်ချက်ခြင်း
              const progress =
                campaign.targetAmount > 0
                  ? Math.min(
                      (campaign.currentAmount / campaign.targetAmount) * 100,
                      100,
                    ).toFixed(1)
                  : 0;

              return (
                <div
                  key={campaign.id}
                  className="bg-slate-900/50 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl hover:border-slate-700/80 transition duration-300 flex flex-col justify-between"
                >
                  {/* Campaign Image */}
                  <div className="h-48 w-full overflow-hidden relative bg-slate-950">
                    <img
                      src={getCampaignImage(campaign.id)}
                      alt={campaign.title}
                      className="w-full h-full object-cover opacity-80 hover:scale-105 transition duration-500"
                    />
                    <span className="absolute top-3 right-3 text-[10px] bg-teal-500 text-slate-950 font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">
                      {campaign.status}
                    </span>
                  </div>

                  {/* Campaign Details */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <h3 className="text-lg font-bold text-white line-clamp-1">
                        {campaign.title}
                      </h3>
                      <p className="text-xs text-gray-400 line-clamp-3 leading-relaxed">
                        {campaign.description}
                      </p>
                    </div>

                    {/* Progress Bar & Amounts */}
                    <div className="space-y-2 pt-2">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-gray-400">
                          Raised:{" "}
                          <span className="text-teal-400">
                            {campaign.currentAmount} MMK
                          </span>
                        </span>
                        <span className="text-gray-500">{progress}%</span>
                      </div>
                      {/* Progress Bar Line */}
                      <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                        <div
                          className="bg-gradient-to-r from-teal-500 to-emerald-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                      <div className="text-[11px] text-gray-500 text-right">
                        Target: {campaign.targetAmount} MMK
                      </div>
                    </div>

                    {/* Action Button */}
                    <button
                      onClick={() => navigate(`/donate/${campaign.id}`)}
                      className="w-full bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-slate-950 font-black py-2.5 rounded-xl text-sm transition shadow-lg shadow-teal-500/5 active:scale-98 cursor-pointer mt-2"
                    >
                      Donate Now
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ကမ်ပိန်းမရှိသေးရင် ပြမယ့်ပုံစံ */}
        {!loading && campaigns.length === 0 && (
          <div className="text-center py-20 bg-slate-900/20 border border-slate-800 border-dashed rounded-2xl">
            <p className="text-gray-400 text-sm">
              No active donation campaigns found at the moment.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Campaigns;
