import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

function DonationHistory() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        // Backend ရဲ့ /api/donations/my ဆီကနေ ဒေတာလှမ်းတောင်းခြင်း
        const response = await api.get("/donations/my");
        console.log("🚀 My Donation Logs:", response.data); // Console မှာ ဒေတာစစ်လို့ရအောင် ထုတ်ကြည့်ခြင်း

        // Response က ကွက်တိ Array ဖြစ်နေကြောင်း သေချာစေရန်
        setHistory(Array.isArray(response.data) ? response.data : []);
      } catch (err) {
        console.error(err);
        setError("Failed to fetch your donation history. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-5xl w-full mx-auto space-y-6">
        {/* Header Section */}
        <div className="flex justify-between items-center border-b border-slate-800 pb-5">
          <div>
            <h1 className="text-2xl font-black bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent">
              💝 My Donation History
            </h1>
            <p className="text-xs text-gray-400 mt-1">
              Track and review your noble contributions to ongoing relief causes.
            </p>
          </div>
          <button
            onClick={() => navigate("/dashboard")}
            className="bg-slate-900 hover:bg-slate-800 text-xs border border-slate-800 px-4 py-2 rounded-xl transition cursor-pointer"
          >
            ← Back to Dashboard
          </button>
        </div>

        {loading && (
          <div className="text-center py-10 text-teal-400 animate-pulse text-xs">
            Loading your history logs...
          </div>
        )}
        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl text-center text-xs">
            {error}
          </div>
        )}

        {/* History Table / Lists */}
        {!loading && !error && history.length > 0 && (
          <div className="bg-slate-900/30 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/60 text-[10px] uppercase font-mono tracking-wider text-gray-400">
                    <th className="p-4">Event / Campaign</th>
                    <th className="p-4">Type</th>
                    <th className="p-4">Contribution</th>
                    <th className="p-4">Receipt</th>
                    <th className="p-4">Submitted Date</th>
                    <th className="p-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50 text-xs text-gray-300">
                  {history.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-900/20 transition"
                    >
                      {/* Event Name */}
                      <td className="p-4 font-bold text-white max-w-xs truncate">
                        {item.campaign?.title || `Campaign ID: #${item.campaignId || item.campaign_id || 1}`}
                      </td>

                      {/* Donation Type */}
                      <td className="p-4 font-mono">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] ${
                            item.donationType === "MONEY" || item.donation_type === "MONEY"
                              ? "bg-emerald-500/10 text-emerald-400"
                              : "bg-blue-500/10 text-blue-400"
                          }`}
                        >
                          {item.donationType || item.donation_type}
                        </span>
                      </td>

                      {/* Amount or Item Details */}
                      <td className="p-4">
                        {(item.donationType === "MONEY" || item.donation_type === "MONEY") ? (
                          <span className="font-bold text-emerald-400 font-mono">
                            {(item.amount)?.toLocaleString()} MMK
                          </span>
                        ) : (
                          <span className="text-gray-200">
                            {item.itemName || item.item_name} ({item.quantity} {item.unit})
                          </span>
                        )}
                      </td>

                      {/* Receipt Screenshot Link */}
                      <td className="p-4">
                        <a
                          href={item.proofImageUrl || item.proof_image_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-teal-400 hover:underline font-mono text-[11px] flex items-center gap-1"
                        >
                          🖼️ View Slip
                        </a>
                      </td>

                      {/* Created Date (DB ထဲက ကော်လံ donated_at သို့မဟုတ် donatedAt ကို ကွက်တိ ပြောင်းယူခြင်း) ✨ */}
                      <td className="p-4 text-gray-400 font-mono">
                        {item.donatedAt || item.donated_at
                          ? new Date(item.donatedAt || item.donated_at).toLocaleDateString()
                          : new Date().toLocaleDateString()}
                      </td>

                      {/* Status Badge */}
                      <td className="p-4 text-center">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-black font-mono tracking-wide ${
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* မှတ်တမ်းမရှိရင် ပြမယ့် ပုံစံ */}
        {!loading && history.length === 0 && (
          <div className="text-center py-20 bg-slate-900/20 border border-slate-800 border-dashed rounded-2xl">
            <p className="text-gray-400 text-xs">
              🌱 You haven't made any donations yet. Be the light in someone's darkness!
            </p>
            <button
              onClick={() => navigate("/campaigns")}
              className="mt-4 bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 font-black px-4 py-2 rounded-xl text-xs hover:opacity-90 transition cursor-pointer"
            >
              Browse Campaigns
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default DonationHistory;
