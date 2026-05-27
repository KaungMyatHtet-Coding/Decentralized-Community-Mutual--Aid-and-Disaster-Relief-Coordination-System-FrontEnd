import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

export default function VolunteerAssignmentsList() {
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActiveAssignments();
  }, []);

   const fetchActiveAssignments = async () => {
     setLoading(true);
     try {
       const res = await api.get("/item-donations/assigned"); // Active only
       setAssignments(res.data || []);
     } catch (err) {
       console.error("Failed to load assignments", err);
     } finally {
       setLoading(false);
     }
   };

  const getStatusColor = (status) => {
    switch (status) {
      case "ASSIGNED_TO_VOLUNTEER":
        return "border-amber-500 text-amber-400";
      case "VOLUNTEER_ACCEPTED":
        return "border-blue-500 text-blue-400";
      default:
        return "border-teal-500 text-teal-400";
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
            🤝 My Active Assignments
          </h1>
          <div className="flex gap-3">
            <button
              onClick={() => navigate("/volunteer/history")}
              className="text-slate-400 hover:text-white transition px-4 py-2 rounded-xl border border-slate-700"
            >
              📜 History
            </button>
            <button
              onClick={() => navigate("/dashboard")}
              className="text-slate-400 hover:text-white transition"
            >
              ← Dashboard
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-5 pt-6">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full" />
          </div>
        ) : assignments.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-6xl mb-4">📭</p>
            <p className="text-slate-400">No active assignments at the moment</p>
            <p className="text-slate-500 mt-2">New assignments will appear here</p>
          </div>
        ) : (
          <div className="space-y-4">
            {assignments.map((item) => (
              <div
                key={item.id}
                onClick={() => navigate(`/volunteer/assignments/${item.id}`)}
                className="bg-slate-900 border border-slate-700 hover:border-teal-500 rounded-3xl p-6 cursor-pointer transition-all active:scale-[0.98]"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="text-xl font-bold mb-1">{item.itemName}</p>
                    <p className="text-teal-400 text-lg">
                      {item.quantity} {item.unit}
                    </p>
                  </div>

                  <div className={`px-4 py-1.5 text-xs rounded-2xl self-start font-medium border ${getStatusColor(item.status)}`}>
                    {getStatusLabel(item.status)}
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-400 text-xs">Donor</p>
                    <p className="font-medium">{item.donor?.fullName || item.donor?.username}</p>
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
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
