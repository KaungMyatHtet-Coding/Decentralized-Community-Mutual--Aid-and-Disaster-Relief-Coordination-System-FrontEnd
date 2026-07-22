import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api";

export default function VolunteerAssignmentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [donation, setDonation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [note, setNote] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchDonation();
  }, [id]);

  const fetchDonation = async () => {
    try {
      const res = await api.get(`/item-donations/${id}`);
      setDonation(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Photo Upload
  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await api.post("/upload/photo", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      setPhotoUrl(res.data.url);
      alert("✅ ဓာတ်ပုံ တင်ပြီးပါပြီ!");
    } catch (err) {
      console.error(err);
      alert("❌ ဓာတ်ပုံ တင်ရာတွင် အမှားရှိနေပါတယ်");
    } finally {
      setUploading(false);
    }
  };

  // Accept Assignment
  const handleAccept = async () => {
    setActionLoading(true);
    try {
      await api.patch(`/item-donations/${id}/accept`);
      alert("✅ Assignment Accepted Successfully!");
      fetchDonation(); // Refresh data
    } catch (err) {
      alert("Failed to accept assignment.");
    } finally {
      setActionLoading(false);
    }
  };

  // Reject Assignment
  const handleReject = async () => {
    const reason = prompt("Why are you rejecting this assignment?");
    if (!reason) return;

    setActionLoading(true);
    try {
      await api.patch(`/item-donations/${id}/reject`, { reason });
      alert("Assignment rejected successfully.");
      navigate("/volunteer/assignments");
    } catch (err) {
      alert("Failed to reject assignment.");
    } finally {
      setActionLoading(false);
    }
  };

  // Confirm Receipt
  const handleConfirmReceipt = async () => {
    if (!note.trim()) {
      alert("ကျေးဇူးပြု၍ မှတ်ချက်ရေးပေးပါ။");
      return;
    }
    if (!photoUrl) {
      alert("ကျေးဇူးပြု၍ ဓာတ်ပုံ တင်ပေးပါ။");
      return;
    }

    setActionLoading(true);
    try {
      await api.patch(`/item-donations/${id}/volunteer-confirm`, {
        note: note,
        confirmPhotoUrl: photoUrl,
      });

      setSuccess(true);
      setTimeout(() => navigate("/volunteer/assignments"), 2000);
    } catch (err) {
      console.error(err);
      alert("Confirmation failed: " + (err.response?.data?.message || err.message));
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!donation) {
    return <div className="text-red-400 p-6">Assignment not found.</div>;
  }

  const isAssigned = donation.status === "ASSIGNED_TO_VOLUNTEER";
  const isAccepted = donation.status === "VOLUNTEER_ACCEPTED";
  const isReceived = donation.status === "VOLUNTEER_RECEIVED";

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-12">
      <nav className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50">
        <div className="max-w-2xl mx-auto px-5 py-4 flex justify-between items-center">
          <button
            onClick={() => navigate("/volunteer/assignments")}
            className="text-slate-400 hover:text-white flex items-center gap-2"
          >
            ← Back to Assignments
          </button>
          <h1 className="text-xl font-bold">Assignment Detail</h1>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-5 pt-6 space-y-6">

        {/* Status */}
        <div className="bg-slate-900 rounded-3xl p-6">
          <p className="text-xs uppercase tracking-widest text-slate-400 mb-2">Current Status</p>
          <p className={`text-2xl font-bold ${
            isReceived ? "text-emerald-400" :
            isAccepted ? "text-blue-400" :
            isAssigned ? "text-amber-400" : "text-teal-400"
          }`}>
            {donation.status.replace(/_/g, " ")}
          </p>
        </div>

        {/* Item Information */}
        <div className="bg-slate-900 rounded-3xl p-6">
          <h2 className="text-teal-400 uppercase text-xs tracking-widest mb-4">📦 Item Information</h2>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-slate-400">Item</span>
              <span className="font-bold">{donation.itemName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Quantity</span>
              <span className="font-bold">{donation.quantity} {donation.unit}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Condition</span>
              <span>{donation.condition}</span>
            </div>
          </div>
        </div>

        {/* Donor Information */}
        <div className="bg-slate-900 rounded-3xl p-6 space-y-4 border border-slate-800">
          <h2 className="text-teal-400 uppercase text-xs tracking-widest font-bold flex items-center gap-2">
            <span>👤 Donor & Pickup Address Information</span>
          </h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center border-b border-slate-800/80 pb-2">
              <span className="text-slate-400">Name</span>
              <span className="font-semibold text-white">{donation.donor?.fullName || donation.donor?.username || "Anonymous"}</span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-800/80 pb-2">
              <span className="text-slate-400">Handover Type</span>
              <span className={`font-bold px-2.5 py-0.5 rounded-full text-xs border ${
                donation.handoverType === "PICKUP"
                  ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                  : "bg-teal-500/10 text-teal-400 border-teal-500/20"
              }`}>
                {donation.handoverType === "PICKUP" ? "🚚 Pickup Requested" : "🏢 Direct Drop-off"}
              </span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-800/80 pb-2">
              <span className="text-slate-400">Contact Phone</span>
              <span className="text-amber-400 font-bold font-mono text-base">📞 {donation.donorPhone}</span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-800/80 pb-2">
              <span className="text-slate-400">Township</span>
              <span className="font-semibold text-white">📍 {donation.donorTownship}</span>
            </div>
            {donation.streetAddress && (
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 space-y-1">
                <span className="text-xs text-amber-400 font-bold block uppercase tracking-wider">
                  🏠 Pickup Street Address / ယူဆောင်ပေးရမည့် လိပ်စာ:
                </span>
                <p className="text-sm font-semibold text-white leading-relaxed">
                  {donation.streetAddress}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* New Assignment Actions */}
        {isAssigned && (
          <div className="bg-slate-900 border border-amber-500/30 rounded-3xl p-6">
            <h2 className="text-amber-400 font-semibold mb-4">📍 New Assignment</h2>
            <p className="text-slate-300 mb-6">
              Do you want to accept this pickup/delivery assignment?
            </p>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={handleReject}
                disabled={actionLoading}
                className="bg-red-600/80 hover:bg-red-600 py-4 rounded-2xl font-bold transition"
              >
                Reject
              </button>
              <button
                onClick={handleAccept}
                disabled={actionLoading}
                className="bg-emerald-500 hover:bg-emerald-400 py-4 rounded-2xl font-bold transition"
              >
                {actionLoading ? "Processing..." : "✅ Accept Assignment"}
              </button>
            </div>
          </div>
        )}

        {/* Confirm Receipt */}
        {isAccepted && !success && (
          <div className="bg-slate-900 border border-emerald-500/30 rounded-3xl p-6">
            <h2 className="text-emerald-400 font-semibold mb-4">✅ Confirm Receipt</h2>

            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="ပစ္စည်း အခြေအနေ၊ အရေအတွက် စသည်တို့ကို မှတ်ချက်ရေးပါ..."
              className="w-full bg-slate-800 border border-slate-700 rounded-2xl p-4 text-sm min-h-[120px] focus:border-emerald-500 outline-none"
            />

            {/* Photo Upload */}
            <div className="mt-6">
              <p className="text-xs text-slate-400 mb-2">📸 ဓာတ်ပုံ တင်ပါ (လိုအပ်ပါသည်)</p>
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                disabled={uploading}
                className="w-full bg-slate-800 border border-slate-700 rounded-2xl p-4 text-sm cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-teal-500 file:text-black hover:file:bg-teal-400"
              />

              {uploading && <p className="text-amber-400 text-sm mt-2">Uploading photo...</p>}

              {photoUrl && (
                <div className="mt-3">
                  <img
                    src={photoUrl}
                    alt="proof"
                    className="max-h-56 w-full object-cover rounded-2xl border border-slate-700"
                  />
                </div>
              )}
            </div>

            <button
              onClick={handleConfirmReceipt}
              disabled={actionLoading || !note.trim() || !photoUrl}
              className="mt-6 w-full bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-700 text-black font-bold py-4 rounded-2xl transition"
            >
              {actionLoading ? "Confirming..." : "✅ I Have Received This Item"}
            </button>
          </div>
        )}

        {/* Success */}
        {success && (
          <div className="bg-emerald-500/10 border border-emerald-500 rounded-3xl p-8 text-center">
            <p className="text-4xl mb-3">🎉</p>
            <p className="text-emerald-400 text-xl font-bold">Confirmation Successful!</p>
            <p className="text-slate-400 mt-2">Thank you for your service.</p>
          </div>
        )}

        {/* Already Received */}
        {isReceived && (
          <div className="bg-emerald-500/10 border border-emerald-500 rounded-3xl p-6 text-center">
            <p className="text-emerald-400 text-xl font-bold">✅ Item Received Successfully</p>
          </div>
        )}
      </div>
    </div>
  );
}
