import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

function MyItemDonations() {
  const navigate = useNavigate();
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("ALL");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
    fetchMyDonations();
  }, [navigate]);

  const fetchMyDonations = async () => {
    setLoading(true);
    try {
      const res = await api.get("/item-donations/my");
      const sorted = res.data.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
      );
      setDonations(sorted);
    } catch (err) {
      setError("Failed to load your item donations.");
    } finally {
      setLoading(false);
    }
  };

  // ── Status Timeline ──────────────────────────────────
  const statusSteps = [
    { key: "PENDING_VOLUNTEER", label: "Submitted", icon: "📝" },
    { key: "VOLUNTEER_RECEIVED", label: "Volunteer Received", icon: "🤝" },
    { key: "STORED_IN_STOCK", label: "Stored in Stock", icon: "📦" },
  ];

  const getStepIndex = (status) => {
    if (status === "REJECTED") return -1;
    return statusSteps.findIndex((s) => s.key === status);
  };

  const statusColor = (status) => {
    const map = {
      PENDING_VOLUNTEER: "bg-amber-500/10 text-amber-400 border-amber-500/20",
      VOLUNTEER_RECEIVED: "bg-blue-500/10 text-blue-400 border-blue-500/20",
      STORED_IN_STOCK:
        "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      REJECTED: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    };
    return map[status] || "bg-slate-500/10 text-slate-400 border-slate-500/20";
  };

  const statusLabel = (status) => {
    const map = {
      PENDING_VOLUNTEER: "⏳ Pending Volunteer",
      VOLUNTEER_RECEIVED: "🤝 Volunteer Received",
      STORED_IN_STOCK: "📦 Stored in Stock",
      REJECTED: "❌ Rejected",
    };
    return map[status] || status;
  };

  const conditionColor = (condition) => {
    const map = {
      NEW: "text-emerald-400",
      GOOD: "text-teal-400",
      FAIR: "text-amber-400",
    };
    return map[condition] || "text-gray-400";
  };

  const timeAgo = (dateStr) => {
    if (!dateStr) return "—";
    const diff = Math.floor((new Date() - new Date(dateStr)) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const filtered = donations.filter((d) =>
    filter === "ALL" ? true : d.status === filter,
  );

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 border-b border-slate-800 pb-5">
          <div>
            <h1 className="text-2xl font-black bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent">
              📦 My Item Donations
            </h1>
            <p className="text-xs text-gray-500 mt-1 font-mono">
              {donations.length} total donations
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => navigate("/campaigns")}
              className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs px-4 py-2 rounded-xl transition cursor-pointer"
            >
              + Donate Items
            </button>
            <button
              onClick={() => navigate("/dashboard")}
              className="bg-slate-900 hover:bg-slate-800 text-xs border border-slate-800 px-4 py-2 rounded-xl transition cursor-pointer"
            >
              ← Back
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3 rounded-xl text-sm text-center">
            {error}
          </div>
        )}

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2">
          {[
            { key: "ALL", label: "All" },
            { key: "PENDING_VOLUNTEER", label: "⏳ Pending" },
            { key: "VOLUNTEER_RECEIVED", label: "🤝 Received" },
            { key: "STORED_IN_STOCK", label: "📦 Stored" },
            { key: "REJECTED", label: "❌ Rejected" },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                filter === f.key
                  ? "bg-cyan-500 text-slate-950 border-cyan-500"
                  : "bg-slate-900 text-gray-400 border-slate-800 hover:border-slate-600"
              }`}
            >
              {f.label}
              {f.key !== "ALL" && (
                <span className="ml-1 opacity-60">
                  ({donations.filter((d) => d.status === f.key).length})
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="text-center py-16 text-cyan-400 animate-pulse text-sm">
            Loading your donations...
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-slate-900/20 border border-slate-800 border-dashed rounded-2xl">
            <p className="text-4xl mb-3">📦</p>
            <p className="text-gray-400 text-sm">No item donations found.</p>
            <button
              onClick={() => navigate("/campaigns")}
              className="mt-4 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs px-4 py-2 rounded-xl cursor-pointer transition"
            >
              Donate Items Now
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((d) => {
              const stepIndex = getStepIndex(d.status);
              return (
                <div
                  key={d.id}
                  className={`bg-slate-900/40 border rounded-2xl p-5 space-y-4 ${
                    d.status === "REJECTED"
                      ? "border-rose-500/20"
                      : "border-slate-800/80"
                  }`}
                >
                  {/* Card Header */}
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-black text-white">
                          {d.itemName}
                        </h3>
                        <span className="text-xs text-gray-400 font-mono">
                          {d.quantity} {d.unit}
                        </span>
                        <span
                          className={`text-[10px] font-mono ${conditionColor(d.condition)}`}
                        >
                          [{d.condition}]
                        </span>
                        {d.isAnonymous && (
                          <span className="text-[10px] bg-slate-700 text-slate-400 px-1.5 py-0.5 rounded font-mono">
                            anonymous
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5 font-mono">
                        #{d.id} · {timeAgo(d.createdAt)} ·{" "}
                        {d.campaign?.title || "—"}
                      </p>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-black font-mono border shrink-0 ${statusColor(d.status)}`}
                    >
                      {statusLabel(d.status)}
                    </span>
                  </div>

                  {/* Status Timeline */}
                  {d.status !== "REJECTED" && (
                    <div className="flex items-center gap-0">
                      {statusSteps.map((step, i) => (
                        <div
                          key={step.key}
                          className="flex items-center flex-1"
                        >
                          <div className="flex flex-col items-center">
                            <div
                              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs border-2 transition ${
                                i <= stepIndex
                                  ? "bg-cyan-500 border-cyan-500 text-slate-950"
                                  : "bg-slate-900 border-slate-700 text-gray-600"
                              }`}
                            >
                              {i <= stepIndex ? "✓" : step.icon}
                            </div>
                            <p
                              className={`text-[9px] mt-1 font-mono text-center w-16 leading-tight ${
                                i <= stepIndex
                                  ? "text-cyan-400"
                                  : "text-gray-600"
                              }`}
                            >
                              {step.label}
                            </p>
                          </div>
                          {i < statusSteps.length - 1 && (
                            <div
                              className={`flex-1 h-0.5 mb-4 mx-1 ${
                                i < stepIndex ? "bg-cyan-500" : "bg-slate-700"
                              }`}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Handover Info */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                    <div className="bg-slate-900/60 rounded-xl p-3">
                      <p className="text-gray-500 font-mono text-[10px] uppercase">
                        Handover
                      </p>
                      <p className="text-white font-bold mt-0.5">
                        {d.handoverType === "DELIVER"
                          ? "🚚 I Deliver"
                          : "📍 Pickup"}
                      </p>
                    </div>
                    <div className="bg-slate-900/60 rounded-xl p-3">
                      <p className="text-gray-500 font-mono text-[10px] uppercase">
                        Township
                      </p>
                      <p className="text-white font-bold mt-0.5">
                        🏘️ {d.donorTownship}
                      </p>
                    </div>
                    {d.handoverDate && (
                      <div className="bg-slate-900/60 rounded-xl p-3">
                        <p className="text-gray-500 font-mono text-[10px] uppercase">
                          Date
                        </p>
                        <p className="text-white font-bold mt-0.5">
                          📅 {new Date(d.handoverDate).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* ✅ Volunteer Details */}
                  {d.assignedVolunteer ? (
                    <div
                      className={`rounded-xl p-4 border space-y-2 ${
                        d.handoverType === "DELIVER"
                          ? "bg-teal-500/5 border-teal-500/20"
                          : "bg-blue-500/5 border-blue-500/20"
                      }`}
                    >
                      <p className="text-[10px] font-mono uppercase tracking-wider text-gray-400">
                        {d.handoverType === "DELIVER"
                          ? "📍 Deliver to this Volunteer"
                          : "🚗 Volunteer will Pickup"}
                      </p>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                        <div className="flex-1 space-y-1">
                          <p className="text-sm font-bold text-white">
                            👤 {d.assignedVolunteer.username}
                          </p>
                          {d.assignedVolunteer.phoneNumber && (
                            <p className="text-xs text-gray-400">
                              📞 {d.assignedVolunteer.phoneNumber}
                            </p>
                          )}
                          <p className="text-xs text-gray-400">
                            🏘️ {d.donorTownship}
                          </p>
                        </div>
                        {/* Copy phone button */}
                        {d.assignedVolunteer.phoneNumber && (
                          <button
                            onClick={() =>
                              copyToClipboard(d.assignedVolunteer.phoneNumber)
                            }
                            className="bg-slate-800 hover:bg-slate-700 text-gray-300 border border-slate-700 text-[10px] px-3 py-1.5 rounded-lg font-mono transition cursor-pointer shrink-0"
                          >
                            📋 Copy Phone
                          </button>
                        )}
                      </div>

                      {/* Volunteer confirm details */}
                      {d.volunteerReceivedAt && (
                        <div className="mt-2 pt-2 border-t border-slate-700/50">
                          <p className="text-[10px] text-emerald-400 font-mono">
                            ✅ Received at:{" "}
                            {new Date(d.volunteerReceivedAt).toLocaleString()}
                          </p>
                          {d.volunteerNote && (
                            <p className="text-[10px] text-gray-400 mt-1">
                              📝 Note: {d.volunteerNote}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  ) : d.status === "PENDING_VOLUNTEER" ? (
                    <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-3">
                      <p className="text-xs text-amber-400 animate-pulse">
                        ⏳ မင်းရဲ့ township မှာ volunteer ရှာနေပါတယ်...
                      </p>
                    </div>
                  ) : null}

                  {/* Item Photo */}
                  {d.itemPhotoUrl && (
                    <div>
                      <a
                        href={d.itemPhotoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-cyan-400 hover:underline font-mono"
                      >
                        🖼️ View Item Photo
                      </a>
                    </div>
                  )}

                  {/* Rejected reason */}
                  {d.status === "REJECTED" && (
                    <div className="bg-rose-500/5 border border-rose-500/20 rounded-xl p-3">
                      <p className="text-xs text-rose-400">
                        ❌ မင်းရဲ့ donation ငြင်းပယ်ခံရပြီ။ နောက်တစ်ကြိမ်
                        ထပ်လှူနိုင်ပါတယ်။
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default MyItemDonations;
