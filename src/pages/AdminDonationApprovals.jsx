import { useEffect, useState } from "react";
import api from "../api";

export default function AdminDonationApprovals() {
  const [pendingDonations, setPendingDonations] = useState([]); // Pending တွေပဲ သိမ်းမယ့်နေရာ
  const [volunteers, setVolunteers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 💡 SKIP & GO နည်းလမ်း: All Donations ခေါ်တဲ့ path အတိုင်း ပြောင်းခေါ်လိုက်ပါတယ်
      const [allDonationsRes, volunteersRes] = await Promise.all([
        api.get("/item-donations"), // အားလုံးပေါ်တဲ့ table က path အတိုင်း ခေါ်လိုက်တာပါ
        api.get("/users/volunteers"),
      ]);

      // 🎯 Frontend ဘက်ကနေမှ PENDING_ADMIN ဖြစ်နေတဲ့ကောင်တွေကိုပဲ ဇကာတင် စစ်ထုတ်လိုက်ပါတယ်
      const rawData = allDonationsRes.data || [];
      const filteredPending = rawData.filter(
        (item) => item.status === "PENDING_ADMIN",
      );

      setPendingDonations(filteredPending);
      setVolunteers(volunteersRes.data || []);
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (donationId) => {
    const volunteerList = volunteers
      .map(
        (v) =>
          `${v.id} - ${v.fullName || v.username} (${v.township || "No Township"})`,
      )
      .join("\n");

    const volunteerId = prompt(
      `Choose Volunteer ID to assign:\n\n${volunteerList}\n\nEnter Volunteer ID:`,
    );

    if (!volunteerId) return;

    setActionLoading(donationId);
    try {
      await api.patch(
        `/item-donations/${donationId}/approve?volunteerId=${volunteerId}`,
      );
      alert("✅ Donation Approved and Assigned Successfully!");
      fetchData(); // စာရင်းကို refresh ပြန်လုပ်မယ်
    } catch (err) {
      alert("Failed to approve donation.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (donationId) => {
    const reason = prompt("Please enter reject reason:");
    if (!reason) return;

    setActionLoading(donationId);
    try {
      await api.patch(`/item-donations/${donationId}/admin-reject`, { reason });
      alert("❌ Donation Rejected");
      fetchData(); // စာရင်းကို refresh ပြန်လုပ်မယ်
    } catch (err) {
      alert("Failed to reject.");
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="p-10 text-center text-white">
        Loading pending donations...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">
          📋 Pending Donations for Review
        </h1>
        <p className="text-slate-400 mb-8">Admin Review Queue</p>

        <div className="grid gap-6">
          {pendingDonations.map((donation, index) => (
            // 💡 Key error မတက်အောင် donation.id အပြင် index ပါ တွဲသုံးထားပါတယ်
            <div
              key={`${donation.id}-${index}`}
              className="bg-slate-900 rounded-3xl p-6 border border-slate-700 hover:border-amber-500/50 transition"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-2xl font-bold">{donation.itemName}</h3>
                  <p className="text-teal-400 text-xl">
                    {donation.quantity} {donation.unit}
                  </p>
                  {/* 💡 Campaign ပြဿနာအတွက်: ပါလာတဲ့ campaign title ကို ပြပေးပါမယ် */}
                  <p className="text-xs text-slate-500 mt-1">
                    Campaign:{" "}
                    <span className="text-slate-300 font-semibold">
                      {donation.campaign?.title || "General/No Title"}
                    </span>
                  </p>
                </div>
                <span className="px-4 py-2 bg-amber-500/10 text-amber-400 rounded-2xl text-sm font-medium">
                  PENDING REVIEW
                </span>
              </div>

              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                <div>
                  <p className="text-slate-400">Donor</p>
                  <p className="font-medium">
                    {donation.donor?.fullName ||
                      donation.donor?.username ||
                      "Anonymous"}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400">Township</p>
                  <p className="font-medium">
                    {donation.donorTownship || "Not Specified"}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400">Handover Type</p>
                  <p>
                    {donation.handoverType === "PICKUP"
                      ? "Pickup by Volunteer"
                      : "Donor Delivery"}
                  </p>
                </div>
              </div>

              {/* Item Photo Url ရှိရင် ပုံပါ တစ်ခါတည်း ပြပေးမယ့် အပိုင်း */}
              {donation.itemPhotoUrl && (
                <div className="mt-4">
                  <p className="text-slate-400 text-sm mb-1">Item Photo:</p>
                  <a
                    href={donation.itemPhotoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-teal-400 underline break-all"
                  >
                    {donation.itemPhotoUrl}
                  </a>
                </div>
              )}

              <div className="mt-8 flex gap-4">
                <button
                  onClick={() => handleApprove(donation.id)}
                  disabled={actionLoading === donation.id}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 py-4 rounded-2xl font-bold text-lg transition disabled:opacity-70"
                >
                  {actionLoading === donation.id
                    ? "Assigning..."
                    : "✅ Approve & Assign Volunteer"}
                </button>

                <button
                  onClick={() => handleReject(donation.id)}
                  disabled={actionLoading === donation.id}
                  className="flex-1 bg-red-600 hover:bg-red-500 py-4 rounded-2xl font-bold text-lg transition disabled:opacity-70"
                >
                  Reject
                </button>
              </div>
            </div>
          ))}

          {pendingDonations.length === 0 && (
            <div className="text-center py-20 bg-slate-900 rounded-3xl">
              <p className="text-5xl mb-4">🎉</p>
              <p className="text-xl text-slate-400">
                No pending donations for review
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
