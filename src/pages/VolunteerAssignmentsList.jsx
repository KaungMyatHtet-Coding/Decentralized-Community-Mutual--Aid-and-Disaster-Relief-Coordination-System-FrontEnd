import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

function VolunteerAssignmentsList() {
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        const res = await api.get("/item-donations/assigned");
        setAssignments(res.data || []);
      } catch (err) {
        console.error("Failed to fetch assignments", err);
        setError("Assignments ဆွဲယူလို့ မရဘူး။");
      } finally {
        setLoading(false);
      }
    };
    fetchAssignments();
  }, []);

  const statusConfig = {
    PENDING_VOLUNTEER: {
      label: "Pending",
      icon: "⏳",
      color: "text-amber-400",
      bg: "bg-amber-500/10",
      border: "border-amber-500/30",
    },
    VOLUNTEER_RECEIVED: {
      label: "Received",
      icon: "📦",
      color: "text-teal-400",
      bg: "bg-teal-500/10",
      border: "border-teal-500/30",
    },
    STORED_IN_STOCK: {
      label: "Stored",
      icon: "🏪",
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/30",
    },
    REJECTED: {
      label: "Rejected",
      icon: "❌",
      color: "text-rose-400",
      bg: "bg-rose-500/10",
      border: "border-rose-500/30",
    },
  };

  const getStatus = (status) =>
    statusConfig[status] || {
      label: status,
      icon: "🔔",
      color: "text-gray-400",
      bg: "bg-slate-500/10",
      border: "border-slate-500/30",
    };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <p className="text-slate-400 animate-pulse font-mono text-sm">
          Loading assignments...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Navbar */}
      <nav className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800/60 px-6 py-4 flex justify-between items-center sticky top-0 z-50">
        <h1 className="text-xl font-bold bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent">
          🤝 My Assignments
        </h1>
        <button
          onClick={() => navigate("/dashboard")}
          className="text-sm text-slate-400 hover:text-white transition cursor-pointer"
        >
          ← Back
        </button>
      </nav>

      <div className="max-w-2xl mx-auto p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-gray-500 font-mono uppercase tracking-wider">
            📋 Total: {assignments.length} assignments
          </p>
          {assignments.filter((a) => a.status === "PENDING_VOLUNTEER").length >
            0 && (
            <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded font-mono animate-pulse">
              {
                assignments.filter((a) => a.status === "PENDING_VOLUNTEER")
                  .length
              }{" "}
              pending
            </span>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-4">
            <p className="text-rose-400 text-sm">{error}</p>
          </div>
        )}

        {/* Empty State */}
        {!error && assignments.length === 0 && (
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-10 text-center">
            <p className="text-4xl mb-3">📭</p>
            <p className="text-gray-400 text-sm">Assignment မရှိသေးဘူး။</p>
            <p className="text-gray-600 text-xs mt-1">
              Admin က assignment ပေးမှ ဒီမှာ ပေါ်မယ်။
            </p>
          </div>
        )}

        {/* Assignment Cards */}
        {assignments.map((a) => {
          const s = getStatus(a.status);
          return (
            <div
              key={a.id}
              onClick={() => navigate(`/volunteer/assignments/${a.id}`)}
              className="bg-slate-900/50 border border-slate-800 hover:border-teal-500/40 rounded-2xl p-5 cursor-pointer transition group"
            >
              <div className="flex items-start justify-between gap-3">
                {/* Left */}
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <p className="text-base font-bold text-white group-hover:text-teal-400 transition">
                      {a.itemName}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-3 text-xs text-gray-500 font-mono">
                    <span>
                      📦 {a.quantity} {a.unit}
                    </span>
                    {a.condition && <span>🔍 {a.condition}</span>}
                    {a.handoverDate && <span>📅 {a.handoverDate}</span>}
                    {a.handoverType && (
                      <span
                        className={
                          a.handoverType === "PICKUP"
                            ? "text-amber-400"
                            : "text-blue-400"
                        }
                      >
                        {a.handoverType === "PICKUP"
                          ? "📍 Pickup"
                          : "🚚 Delivery"}
                      </span>
                    )}
                  </div>

                  {a.campaign && (
                    <p className="text-[11px] text-teal-400 font-mono">
                      🎯 {a.campaign.title}
                    </p>
                  )}
                </div>

                {/* Right — Status Badge */}
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <span
                    className={`text-[10px] px-2.5 py-1 rounded-full border font-mono ${s.color} ${s.bg} ${s.border}`}
                  >
                    {s.icon} {s.label}
                  </span>
                  <span className="text-slate-600 text-xs group-hover:text-slate-400 transition">
                    →
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default VolunteerAssignmentsList;
