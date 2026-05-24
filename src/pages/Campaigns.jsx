import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

function Campaigns() {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/campaigns")
      .then((res) => setCampaigns(res.data))
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

  const statusColor = (status) => {
    switch (status) {
      case "ACTIVE":
        return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
      case "COMPLETED":
        return "text-blue-400 bg-blue-500/10 border-blue-500/20";
      default:
        return "text-gray-400 bg-gray-500/10 border-gray-500/20";
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-800 pb-5">
          <div>
            <h1 className="text-2xl font-black bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">
              💰 Donation Campaigns
            </h1>
            <p className="text-xs text-gray-400 mt-1">
              {campaigns.length} active campaign
              {campaigns.length !== 1 ? "s" : ""}
            </p>
          </div>
          <button
            onClick={() => navigate("/dashboard")}
            className="bg-slate-900 hover:bg-slate-800 text-sm border border-slate-800 px-4 py-2 rounded-xl transition cursor-pointer"
          >
            ← Back
          </button>
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3 rounded-xl text-sm text-center">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-10 text-teal-400 animate-pulse text-sm">
            Loading campaigns...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {campaigns.map((c) => {
              const progress = getProgress(c.currentAmount, c.targetAmount);
              return (
                <div
                  key={c.id}
                  className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex justify-between items-start gap-2">
                      <h3 className="font-bold text-white text-sm leading-snug">
                        {c.title}
                      </h3>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-mono border shrink-0 ${statusColor(c.status)}`}
                      >
                        {c.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 leading-relaxed">
                      {c.description}
                    </p>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[11px] text-gray-400">
                      <span>
                        Raised:{" "}
                        <span className="text-teal-400 font-bold">
                          {formatAmount(c.currentAmount)}
                        </span>
                      </span>
                      <span>
                        Goal:{" "}
                        <span className="text-white font-bold">
                          {formatAmount(c.targetAmount)}
                        </span>
                      </span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-teal-500 to-emerald-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <div className="text-right text-[10px] text-gray-500 font-mono">
                      {progress}% funded
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-[11px] text-gray-500">
                    <span>
                      🗓 Ends:{" "}
                      {c.endDate
                        ? new Date(c.endDate).toLocaleDateString()
                        : "—"}
                    </span>
                  </div>

                  {c.status === "ACTIVE" && (
                    <button
                      onClick={() => navigate(`/donate/${c.id}`)}
                      className="w-full bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold py-2.5 rounded-xl transition cursor-pointer text-sm"
                    >
                      💚 Donate Now
                    </button>
                  )}
                </div>
              );
            })}
            {campaigns.length === 0 && (
              <div className="col-span-2 text-center py-20 bg-slate-900/20 border border-slate-800 border-dashed rounded-2xl">
                <p className="text-gray-400 text-sm">No campaigns available.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Campaigns;
