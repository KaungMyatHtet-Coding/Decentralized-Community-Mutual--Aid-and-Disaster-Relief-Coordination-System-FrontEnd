import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api";

function VolunteerAssignments() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [donation, setDonation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [note, setNote] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchDonation = async () => {
      try {
        const res = await api.get(`/item-donations/${id}`);
        setDonation(res.data);
      } catch (err) {
        console.error("Failed to fetch assignment", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDonation();
  }, [id]);

  const handleConfirm = async () => {
    setConfirming(true);
    try {
      await api.patch(`/item-donations/${id}/volunteer-confirm`, {
        note: note,
        confirmPhotoUrl: "",
      });
      setSuccess(true);
    } catch (err) {
      console.error("Confirm failed", err);
    } finally {
      setConfirming(false);
    }
  };

  const statusTimeline = [
    { key: "PENDING_VOLUNTEER", label: "Pending", icon: "⏳" },
    { key: "VOLUNTEER_RECEIVED", label: "Received", icon: "📦" },
    { key: "STORED_IN_STOCK", label: "Stored", icon: "🏪" },
  ];

  const currentStatusIndex = statusTimeline.findIndex(
    (s) => s.key === donation?.status,
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <p className="text-slate-400 animate-pulse font-mono text-sm">
          Loading assignment...
        </p>
      </div>
    );
  }

  if (!donation) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <p className="text-rose-400 font-mono text-sm">Assignment not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Navbar */}
      <nav className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800/60 px-6 py-4 flex justify-between items-center sticky top-0 z-50">
        <h1 className="text-xl font-bold bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent">
          📦 Volunteer Assignment
        </h1>
        <button
          onClick={() => navigate("/volunteer/assignments")}
          className="text-sm text-slate-400 hover:text-white transition cursor-pointer"
        >
          ← Back
        </button>
      </nav>

      <div className="max-w-2xl mx-auto p-6 space-y-6">
        {/* Status Timeline */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5">
          <h2 className="text-xs text-gray-500 uppercase tracking-wider font-mono mb-4">
            📊 Status Timeline
          </h2>
          <div className="flex items-center justify-between">
            {statusTimeline.map((s, i) => (
              <div key={s.key} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-base border-2 ${
                      i <= currentStatusIndex
                        ? "bg-teal-500/20 border-teal-500 text-teal-400"
                        : "bg-slate-800 border-slate-700 text-slate-500"
                    }`}
                  >
                    {s.icon}
                  </div>
                  <p
                    className={`text-[10px] mt-1 font-mono ${
                      i <= currentStatusIndex
                        ? "text-teal-400"
                        : "text-slate-600"
                    }`}
                  >
                    {s.label}
                  </p>
                </div>
                {i < statusTimeline.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-2 mb-4 ${
                      i < currentStatusIndex ? "bg-teal-500" : "bg-slate-700"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Item Details */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 space-y-3">
          <h2 className="text-xs text-gray-500 uppercase tracking-wider font-mono mb-2">
            📦 Item Details
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[10px] text-gray-500 font-mono">Item Name</p>
              <p className="text-sm font-bold text-white">
                {donation.itemName}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-gray-500 font-mono">Quantity</p>
              <p className="text-sm font-bold text-white">
                {donation.quantity} {donation.unit}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-gray-500 font-mono">Condition</p>
              <p className="text-sm font-bold text-white">
                {donation.condition || "—"}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-gray-500 font-mono">
                Handover Date
              </p>
              <p className="text-sm font-bold text-teal-400">
                {donation.handoverDate}
              </p>
            </div>
          </div>
        </div>

        {/* Handover Instructions */}
        <div
          className={`border rounded-2xl p-5 space-y-2 ${
            donation.handoverType === "PICKUP"
              ? "bg-amber-500/5 border-amber-500/30"
              : "bg-blue-500/5 border-blue-500/30"
          }`}
        >
          <h2
            className="text-xs uppercase tracking-wider font-mono mb-2 ${
            donation.handoverType === 'PICKUP' ? 'text-amber-400' : 'text-blue-400'
          }"
          >
            {donation.handoverType === "PICKUP"
              ? "📍 PICKUP Instructions"
              : "📦 DELIVER Instructions"}
          </h2>
          {donation.handoverType === "PICKUP" ? (
            <div className="space-y-2">
              <p className="text-sm text-gray-300">Donor ဆီ သွားယူပါ။</p>
              <div className="grid grid-cols-2 gap-3 mt-2">
                <div>
                  <p className="text-[10px] text-gray-500 font-mono">Donor</p>
                  <p className="text-sm font-bold text-white">
                    {donation.donor?.username}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 font-mono">Phone</p>
                  <p className="text-sm font-bold text-amber-400">
                    📞 {donation.donorPhone}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 font-mono">
                    Township
                  </p>
                  <p className="text-sm font-bold text-white">
                    {donation.donorTownship}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-gray-300">
                Donor က မင်းဆီ item ပို့လာမယ်။
              </p>
              <div className="grid grid-cols-2 gap-3 mt-2">
                <div>
                  <p className="text-[10px] text-gray-500 font-mono">Donor</p>
                  <p className="text-sm font-bold text-white">
                    {donation.donor?.username}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 font-mono">Phone</p>
                  <p className="text-sm font-bold text-blue-400">
                    📞 {donation.donorPhone}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Campaign */}
        {donation.campaign && (
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5">
            <p className="text-[10px] text-gray-500 font-mono">Campaign</p>
            <p className="text-sm font-bold text-teal-400 mt-1">
              🎯 {donation.campaign.title}
            </p>
          </div>
        )}

        {/* Mark as Received */}
        {donation.status === "PENDING_VOLUNTEER" && !success && (
          <div className="bg-slate-900/50 border border-emerald-500/20 rounded-2xl p-5 space-y-3">
            <h2 className="text-xs text-emerald-400 uppercase tracking-wider font-mono">
              ✅ Mark as Received
            </h2>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Note ထည့်နိုင်တယ် (optional)..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 resize-none focus:outline-none focus:border-emerald-500 transition"
              rows={3}
            />
            <button
              onClick={handleConfirm}
              disabled={confirming}
              className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:bg-emerald-500/30 text-slate-950 font-bold py-3 rounded-xl text-sm transition cursor-pointer"
            >
              {confirming ? "Confirming..." : "✅ Confirm Received"}
            </button>
          </div>
        )}

        {/* Success */}
        {success && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-5 text-center">
            <p className="text-emerald-400 font-bold text-lg">🎉 Confirmed!</p>
            <p className="text-sm text-gray-400 mt-1">
              Item လက်ခံပြီဆိုတာ အတည်ပြုပြီးပြီ။
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default VolunteerAssignments;
