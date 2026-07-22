import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

export default function VolunteerAidRequests() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("available"); // 'available' or 'mine'
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    fetchRequests();
  }, [activeTab]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const endpoint = activeTab === "available"
        ? "/aid-requests/volunteer/available"
        : "/aid-requests/volunteer/my-assignments";
      const res = await api.get(endpoint);
      setRequests(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptTask = async (id) => {
    setActionLoading(id);
    try {
      await api.post(`/aid-requests/${id}/volunteer-accept`);
      // ✅ Success — switch to "My Assignments" tab
      setActiveTab("mine");
    } catch (err) {
      const errMsg = err.response?.data || err.message || "";
      // ✅ Race condition: another volunteer already accepted
      if (
        typeof errMsg === "string" &&
        errMsg.toLowerCase().includes("only verified")
      ) {
        alert(
          "⚠️ This task was just accepted by another volunteer.\nThe list has been refreshed."
        );
        fetchRequests(); // auto-refresh to remove already-taken task
      } else {
        alert("❌ Failed to accept task: " + errMsg);
      }
    } finally {
      setActionLoading(null);
    }
  };

  const categoryEmoji = (cat) => {
    const map = { FOOD: "🍚", MEDICINE: "💊", WATER: "💧", CLOTHING: "👕", SHELTER: "🏠", OTHER: "📦" };
    return map[cat] || "📦";
  };

  const statusBadge = (status) => {
    const map = {
      VERIFIED:    { label: "Awaiting Volunteer", cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
      IN_PROGRESS: { label: "In Progress",        cls: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
      RESOLVED:    { label: "Resolved ✅",         cls: "bg-slate-700/50 text-slate-400 border-slate-700" },
    };
    return map[status] || { label: status, cls: "bg-slate-800 text-slate-400 border-slate-700" };
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/dashboard")}
              className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer"
            >
              ← Back
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white">🆘 Aid Request Tasks</h1>
              <p className="text-xs text-slate-400 mt-0.5">View and accept emergency aid requests in your township.</p>
            </div>
          </div>
          <button
            onClick={fetchRequests}
            className="text-xs text-teal-400 border border-teal-500/30 bg-teal-500/10 px-3 py-1.5 rounded-lg hover:bg-teal-500/20 transition cursor-pointer"
          >
            🔄 Refresh
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          {[
            { key: "available", label: "📋 Available Tasks" },
            { key: "mine",      label: "📌 My Assignments" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-6 py-2 rounded-xl font-bold text-sm transition cursor-pointer ${
                activeTab === tab.key
                  ? "bg-teal-500 text-slate-950"
                  : "bg-slate-900 text-slate-400 hover:bg-slate-800 border border-slate-800"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Race condition info banner */}
        {activeTab === "available" && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-2.5 text-xs text-amber-300 flex items-center gap-2">
            <span>⚡</span>
            <span>Tasks are shown to all volunteers in your township. <strong>First to accept gets assigned</strong> — others will see the task disappear automatically.</span>
          </div>
        )}

        {/* List */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full" />
          </div>
        ) : requests.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center">
            <div className="text-4xl mb-3">{activeTab === "available" ? "🎉" : "📭"}</div>
            <p className="text-white font-semibold text-lg mb-1">
              {activeTab === "available" ? "No new tasks right now" : "No assignments yet"}
            </p>
            <p className="text-slate-500 text-sm">
              {activeTab === "available"
                ? "All aid requests in your township have been handled. Check back soon."
                : "Accept a task from the Available Tasks tab to get started."}
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {requests.map((req) => {
              const badge = statusBadge(req.status);
              return (
                <div key={req.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 hover:border-slate-700 transition">
                  <div className="flex flex-col sm:flex-row justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {/* Title + Status badge */}
                      <div className="flex items-start gap-2 flex-wrap mb-2">
                        <h3 className="text-base font-bold text-white">{req.title}</h3>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badge.cls}`}>
                          {badge.label}
                        </span>
                      </div>

                      {/* Categories */}
                      {req.categories?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {req.categories.map((cat) => (
                            <span key={cat} className="text-[11px] bg-slate-800 border border-slate-700 text-slate-300 px-2 py-0.5 rounded-md">
                              {categoryEmoji(cat)} {cat}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Location & Contact */}
                      <div className="flex flex-wrap gap-2 text-xs text-slate-400 mb-3">
                        <span className="bg-slate-800 px-2 py-1 rounded-md">📍 {req.township}</span>
                        <span className="bg-slate-800 px-2 py-1 rounded-md">🏠 {req.wardOrVillage}</span>
                        <span className="bg-slate-800 px-2 py-1 rounded-md text-teal-400 font-bold">📞 {req.contactPhone}</span>
                      </div>

                      <p className="text-sm text-slate-300 leading-relaxed">{req.description}</p>

                      {/* Items requested */}
                      {req.items?.length > 0 && (
                        <div className="mt-3 bg-slate-950/50 border border-slate-800 rounded-xl p-3">
                          <span className="text-[11px] font-bold text-teal-400 uppercase tracking-wider block mb-1">
                            📦 Items Needed / လိုအပ်သော ပစ္စည်းများ:
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {req.items.map((it, idx) => (
                              <span key={idx} className="text-xs bg-slate-800 text-slate-200 px-2.5 py-1 rounded-lg border border-slate-700 font-mono">
                                {it.itemName}: <strong className="text-teal-300">{it.quantity} {it.unit}</strong>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action */}
                    <div className="flex flex-col justify-center sm:min-w-[160px] gap-2">
                      {activeTab === "available" && (
                        <>
                          <button
                            onClick={() => handleAcceptTask(req.id)}
                            disabled={actionLoading !== null}
                            className="w-full bg-teal-500 hover:bg-teal-400 active:scale-95 text-slate-950 font-bold py-3 px-4 rounded-xl transition cursor-pointer disabled:opacity-50"
                          >
                            {actionLoading === req.id ? (
                              <span className="flex items-center justify-center gap-1">
                                <span className="animate-spin w-3 h-3 border-2 border-slate-950 border-t-transparent rounded-full inline-block" />
                                Accepting...
                              </span>
                            ) : "✅ Accept Task"}
                          </button>
                          <p className="text-[10px] text-slate-500 text-center">First to accept gets assigned</p>
                        </>
                      )}

                      {activeTab === "mine" && req.status === "IN_PROGRESS" && (
                        <div className="space-y-2">
                          <div className="w-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold py-2 px-3 rounded-xl text-center text-xs">
                            🔄 In Progress
                          </div>
                          <button
                            onClick={() => navigate(`/volunteer/delivery-report/${req.id}`)}
                            className="w-full bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold py-2.5 px-3 rounded-xl text-xs transition cursor-pointer shadow-lg shadow-teal-500/20 flex items-center justify-center gap-1.5"
                          >
                            <span>📦</span>
                            <span>Submit Delivery Report</span>
                          </button>
                        </div>
                      )}
                      {activeTab === "mine" && req.status === "RESOLVED" && (
                        <div className="w-full bg-slate-800 text-emerald-400 font-bold py-2.5 px-4 rounded-xl text-center text-sm">
                          ✅ Completed
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
