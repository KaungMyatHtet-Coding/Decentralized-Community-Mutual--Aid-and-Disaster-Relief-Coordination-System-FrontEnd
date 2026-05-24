import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api";

function DonateForm() {
  const { campaignId } = useParams();
  const navigate = useNavigate();

  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    donationType: "MONEY",
    amount: "",
    itemName: "",
    quantity: "",
    unit: "",
    isAnonymous: false,
    proofImageUrl:
      "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=500",
  });

  useEffect(() => {
    const fetchCampaignDetails = async () => {
      try {
        const response = await api.get(`/campaigns/${campaignId}`);
        setCampaign(response.data);
      } catch (err) {
        setError("Failed to fetch campaign details.");
      } finally {
        setLoading(false);
      }
    };
    fetchCampaignDetails();
  }, [campaignId]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setMessage("");

    // ✨ Login.jsx မှာ သိမ်းထားတဲ့ userId ကို တိုက်ရိုက် ယူလိုက်တာ — clean & simple
    const currentUserId = localStorage.getItem("userId");

    const payload = {
      campaign: { id: parseInt(campaignId) },
      donationType: formData.donationType,
      proofImageUrl: formData.proofImageUrl,
      isAnonymous: formData.isAnonymous,
      amount:
        formData.donationType === "MONEY" ? parseFloat(formData.amount) : null,
      itemName: formData.donationType === "ITEMS" ? formData.itemName : null,
      quantity:
        formData.donationType === "ITEMS"
          ? parseFloat(formData.quantity)
          : null,
      unit: formData.donationType === "ITEMS" ? formData.unit : null,
      donor: { id: parseInt(currentUserId) }, // ✨ မှန်ကန်တဲ့ userId သုံးလိုက်တာ
    };

    try {
      await api.post("/donations", payload);
      setMessage(
        "🎉 Donation recorded successfully! Waiting for admin confirmation.",
      );
      setTimeout(() => {
        navigate("/campaigns");
      }, 2000);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data ||
          "Failed to submit donation.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading)
    return (
      <div className="text-center py-20 text-teal-400 animate-pulse text-sm">
        Loading form details...
      </div>
    );

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 flex justify-center items-center">
      <div className="max-w-md w-full bg-slate-900/50 border border-slate-800 p-6 rounded-2xl space-y-6 shadow-2xl relative overflow-hidden">
        <div className="space-y-1">
          <span className="text-[10px] bg-teal-500/10 text-teal-400 border border-teal-500/20 px-2 py-0.5 rounded font-mono uppercase tracking-wider">
            Contributing to
          </span>
          <h2 className="text-xl font-bold text-white line-clamp-1">
            {campaign?.title}
          </h2>
          <p className="text-xs text-gray-400 leading-relaxed line-clamp-2">
            {campaign?.description}
          </p>
        </div>

        {message && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 rounded-xl text-xs text-center font-medium animate-pulse">
            {message}
          </div>
        )}
        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3 rounded-xl text-xs text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
              Donation Type
            </label>
            <select
              name="donationType"
              value={formData.donationType}
              onChange={handleChange}
              className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-xl p-3 text-sm text-white focus:outline-none transition"
            >
              <option value="MONEY">💰 MONEY (ငွေကြေးလှူဒါန်းမှု)</option>
              <option value="ITEMS">📦 ITEMS (ပစ္စည်းအလှူဒါန်းမှု)</option>
            </select>
          </div>

          {formData.donationType === "MONEY" && (
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                Amount (MMK)
              </label>
              <input
                type="number"
                name="amount"
                required
                placeholder="Enter amount to donate"
                value={formData.amount}
                onChange={handleChange}
                className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-xl p-3 text-sm text-white focus:outline-none transition"
              />
            </div>
          )}

          {formData.donationType === "ITEMS" && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                  Item Name
                </label>
                <input
                  type="text"
                  name="itemName"
                  required
                  placeholder="e.g. Rice, Cooking Oil, Medicine"
                  value={formData.itemName}
                  onChange={handleChange}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-xl p-3 text-sm text-white focus:outline-none transition"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                    Quantity
                  </label>
                  <input
                    type="number"
                    name="quantity"
                    required
                    placeholder="e.g. 5, 10"
                    value={formData.quantity}
                    onChange={handleChange}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-xl p-3 text-sm text-white focus:outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                    Unit
                  </label>
                  <input
                    type="text"
                    name="unit"
                    required
                    placeholder="e.g. Bags, Bottles"
                    value={formData.unit}
                    onChange={handleChange}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-xl p-3 text-sm text-white focus:outline-none transition"
                  />
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
              Proof of Donation (Image URL)
            </label>
            <input
              type="text"
              name="proofImageUrl"
              required
              placeholder="Paste transfer receipt image URL"
              value={formData.proofImageUrl}
              onChange={handleChange}
              className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-xl p-3 text-sm text-white focus:outline-none transition text-xs font-mono"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="isAnonymous"
              name="isAnonymous"
              checked={formData.isAnonymous}
              onChange={handleChange}
              className="w-4 h-4 rounded border-slate-800 bg-slate-950 text-teal-500 focus:ring-teal-500 focus:ring-offset-slate-950 transition accent-teal-500 cursor-pointer"
            />
            <label
              htmlFor="isAnonymous"
              className="text-xs text-gray-400 cursor-pointer select-none"
            >
              🤫 Hide my identity (အမည်မဖော်လိုပါ)
            </label>
          </div>

          <div className="flex gap-4 pt-2">
            <button
              type="button"
              onClick={() => navigate("/campaigns")}
              className="w-1/3 bg-slate-950 hover:bg-slate-800 border border-slate-800 font-semibold py-3 rounded-xl text-sm transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="w-2/3 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-slate-950 font-black py-3 rounded-xl text-sm transition shadow-lg shadow-teal-500/10 disabled:opacity-50 cursor-pointer"
            >
              {submitting ? "Submitting..." : "Confirm Donation"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default DonateForm;
