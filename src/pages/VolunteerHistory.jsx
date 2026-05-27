import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

export default function VolunteerHistory() {
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");

  useEffect(() => {
    fetchHistory();
  }, [filter]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      // Backend ကနေ History တွေ တိုက်ရိုက်ယူမယ်
      const res = await api.get("/item-donations/assigned?type=history");
      let data = res.data || [];

      // Frontend မှာ ထပ်စစ်ဆေး (Filter Tabs အတွက်)
      if (filter !== "ALL") {
        data = data.filter((item) => {
          if (filter === "RECEIVED")
            return item.status === "VOLUNTEER_RECEIVED";
          if (filter === "STORED") return item.status === "STORED_IN_STOCK";
          if (filter === "REJECTED")
            return (
              item.status === "VOLUNTEER_REJECTED" ||
              item.status === "ADMIN_REJECTED"
            );
          return true;
        });
      }

      setHistory(data);
    } catch (err) {
      console.error("Failed to load history", err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "VOLUNTEER_RECEIVED":
        return "border-teal-500 text-teal-400";
      case "STORED_IN_STOCK":
        return "border-emerald-500 text-emerald-400";
      case "VOLUNTEER_REJECTED":
      case "ADMIN_REJECTED":
        return "border-red-500 text-red-400";
      default:
        return "border-slate-500 text-slate-400";
    }
  };

  const getStatusLabel = (status) => {
    return status.replace(/_/g, " ");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <nav className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-5 py-5 flex items-center justify-between">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            📜 My History
          </h1>
          <button
            onClick={() => navigate("/volunteer/assignments")}
            className="text-slate-400 hover:text-white transition px-4 py-2 rounded-xl border border-slate-700"
          >
            ← Active Assignments
          </button>
        </div>
      </nav>

      {/* Filter Tabs */}
      <div className="max-w-3xl mx-auto px-5 pt-4 flex gap-2 border-b border-slate-800 pb-4 overflow-x-auto">
        {[
          { key: "ALL", label: "All" },
          { key: "RECEIVED", label: "Received" },
          { key: "STORED", label: "Stored" },
          { key: "REJECTED", label: "Rejected" },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-6 py-2.5 rounded-2xl font-medium whitespace-nowrap transition-all ${
              filter === f.key
                ? "bg-teal-500 text-black shadow-lg"
                : "bg-slate-800 text-slate-400 hover:bg-slate-700"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="max-w-3xl mx-auto px-5 pt-6">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full" />
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-6xl mb-4">📭</p>
            <p className="text-slate-400">No history found yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {history.map((item) => (
              <div
                key={item.id}
                onClick={() => navigate(`/volunteer/assignments/${item.id}`)}
                className="bg-slate-900 border border-slate-700 hover:border-slate-500 rounded-3xl p-6 cursor-pointer transition-all"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="text-xl font-bold mb-1">{item.itemName}</p>
                    <p className="text-teal-400 text-lg">
                      {item.quantity} {item.unit}
                    </p>
                  </div>

                  <div
                    className={`px-4 py-1.5 text-xs rounded-2xl self-start font-medium border ${getStatusColor(item.status)}`}
                  >
                    {getStatusLabel(item.status)}
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-400 text-xs">Donor</p>
                    <p className="font-medium">
                      {item.donor?.fullName || item.donor?.username}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs">Township</p>
                    <p className="font-medium">{item.donorTownship}</p>
                  </div>
                </div>

                <div className="mt-4 text-xs text-slate-500 flex items-center gap-2">
                  {item.handoverType === "PICKUP" ? "📍 Pickup" : "🚚 Delivery"}
                  <span className="text-slate-600">•</span>
                  {new Date(item.createdAt).toLocaleDateString()}
                </div>

                {item.volunteerNote && (
                  <div className="mt-4 text-sm text-slate-400 border-l-2 border-slate-700 pl-3 italic">
                    "{item.volunteerNote}"
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
