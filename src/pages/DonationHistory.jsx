import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

function DonationHistory() {
  const [moneyDonations, setMoneyDonations] = useState([]);
  const [itemDonations, setItemDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("all"); // "all" | "money" | "item"
  const navigate = useNavigate();

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const [moneyRes, itemRes] = await Promise.all([
          api.get("/donations/my"),
          api.get("/item-donations/my").catch(() => ({ data: [] })),
        ]);
        setMoneyDonations(Array.isArray(moneyRes.data) ? moneyRes.data : []);
        setItemDonations(Array.isArray(itemRes.data) ? itemRes.data : []);
      } catch (err) {
        console.error(err);
        setError("Failed to fetch your donation history. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  // Tab အလိုက် filter လုပ်တယ်
  const filteredMoney =
    activeTab === "item" ? [] : moneyDonations;
  const filteredItem =
    activeTab === "money" ? [] : itemDonations;
  const totalCount = moneyDonations.length + itemDonations.length;

  const itemStatusConfig = {
    PENDING_VOLUNTEER: { label: "PENDING", color: "bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse" },
    VOLUNTEER_RECEIVED: { label: "RECEIVED", color: "bg-teal-500/10 text-teal-400 border-teal-500/20" },
    STORED_IN_STOCK: { label: "STORED", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
    REJECTED: { label: "REJECTED", color: "bg-rose-500/10 text-rose-400 border-rose-500/20" },
  };

  const moneyStatusColor = (status) => {
    if (status === "CONFIRMED") return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
    if (status === "REJECTED") return "bg-rose-500/10 text-rose-400 border border-rose-500/20";
    return "bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse";
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-5xl w-full mx-auto space-y-6">

        {/* Header */}
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

        {/* Tabs */}
        <div className="flex gap-2">
          {[
            { key: "all", label: `All (${totalCount})` },
            { key: "money", label: `💰 Money (${moneyDonations.length})` },
            { key: "item", label: `📦 Items (${itemDonations.length})` },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-1.5 rounded-xl text-xs font-mono font-bold transition cursor-pointer border ${
                activeTab === tab.key
                  ? "bg-teal-500/20 text-teal-400 border-teal-500/40"
                  : "bg-slate-900/50 text-gray-500 border-slate-800 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
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

        {/* Money Donations Table */}
        {!loading && !error && filteredMoney.length > 0 && (
          <div>
            {activeTab === "all" && (
              <p className="text-[10px] text-gray-500 font-mono uppercase tracking-wider mb-2">
                💰 Money Donations
              </p>
            )}
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
                    {filteredMoney.map((item) => (
                      <tr key={`money-${item.id}`} className="hover:bg-slate-900/20 transition">
                        <td className="p-4 font-bold text-white max-w-xs truncate">
                          {item.campaign?.title || `Campaign #${item.campaignId || 1}`}
                        </td>
                        <td className="p-4 font-mono">
                          <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400">
                            MONEY
                          </span>
                        </td>
                        <td className="p-4">
                          <span className="font-bold text-emerald-400 font-mono">
                            {item.amount?.toLocaleString()} MMK
                          </span>
                        </td>
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
                        <td className="p-4 text-gray-400 font-mono">
                          {item.donatedAt
                            ? new Date(item.donatedAt).toLocaleDateString()
                            : new Date().toLocaleDateString()}
                        </td>
                        <td className="p-4 text-center">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black font-mono tracking-wide border ${moneyStatusColor(item.status)}`}>
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Item Donations Table */}
        {!loading && !error && filteredItem.length > 0 && (
          <div>
            {activeTab === "all" && (
              <p className="text-[10px] text-gray-500 font-mono uppercase tracking-wider mb-2 mt-4">
                📦 Item Donations
              </p>
            )}
            <div className="bg-slate-900/30 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-900/60 text-[10px] uppercase font-mono tracking-wider text-gray-400">
                      <th className="p-4">Item Name</th>
                      <th className="p-4">Type</th>
                      <th className="p-4">Quantity</th>
                      <th className="p-4">Campaign</th>
                      <th className="p-4">Handover Date</th>
                      <th className="p-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50 text-xs text-gray-300">
                    {filteredItem.map((item) => {
                      const s = itemStatusConfig[item.status] || {
                        label: item.status,
                        color: "bg-slate-500/10 text-slate-400 border-slate-500/20",
                      };
                      return (
                        <tr key={`item-${item.id}`} className="hover:bg-slate-900/20 transition">
                          <td className="p-4 font-bold text-white">
                            {item.itemName}
                          </td>
                          <td className="p-4 font-mono">
                            <span className="px-2 py-0.5 rounded text-[10px] bg-cyan-500/10 text-cyan-400">
                              ITEM
                            </span>
                          </td>
                          <td className="p-4 font-mono text-cyan-300">
                            {item.quantity} {item.unit}
                          </td>
                          <td className="p-4 text-teal-400">
                            {item.campaign?.title || "—"}
                          </td>
                          <td className="p-4 text-gray-400 font-mono">
                            {item.handoverDate || "—"}
                          </td>
                          <td className="p-4 text-center">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black font-mono tracking-wide border ${s.color}`}>
                              {s.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filteredMoney.length === 0 && filteredItem.length === 0 && (
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
