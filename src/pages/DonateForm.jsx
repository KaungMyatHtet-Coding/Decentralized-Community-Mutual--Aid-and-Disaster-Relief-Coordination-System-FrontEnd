import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api";

const TOWNSHIPS = [
  "Yangon", "Mandalay", "Naypyidaw", "Bago",
  "Mawlamyine", "Pathein", "Meiktila", "Myingyan", "Other"
];

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
    condition: "GOOD",
    donorTownship: "",
    donorPhone: "",
    handoverType: "DELIVER",
    handoverDate: "",
    isAnonymous: false,
    proofImageUrl: "",
  });

  useEffect(() => {
    api.get(`/campaigns/${campaignId}`)
      .then((res) => setCampaign(res.data))
      .catch(() => setError("Failed to fetch campaign details."))
      .finally(() => setLoading(false));
  }, [campaignId]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === "checkbox" ? checked : value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setMessage("");

    try {
      if (formData.donationType === "MONEY") {
        // ✅ Money donation — existing endpoint
        const payload = {
          campaign: { id: parseInt(campaignId) },
          donationType: "MONEY",
          amount: parseFloat(formData.amount),
          proofImageUrl: formData.proofImageUrl,
          isAnonymous: formData.isAnonymous,
        };
        await api.post("/donations", payload);

      } else {
        // ✅ Items donation — new endpoint
        const payload = {
          campaign: { id: parseInt(campaignId) },
          itemName: formData.itemName,
          quantity: parseFloat(formData.quantity),
          unit: formData.unit,
          condition: formData.condition,
          donorTownship: formData.donorTownship,
          donorPhone: formData.donorPhone,
          handoverType: formData.handoverType,
          handoverDate: formData.handoverDate
            ? new Date(formData.handoverDate + "T00:00:00").toISOString()
            : null,
          itemPhotoUrl: formData.proofImageUrl,
          isAnonymous: formData.isAnonymous,
        };
        await api.post("/item-donations", payload);
      }

      setMessage("🎉 Donation submitted! Waiting for confirmation.");
      setTimeout(() => navigate("/campaigns"), 2500);

    } catch (err) {
      setError(err.response?.data || "Failed to submit donation.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="text-center py-20 text-teal-400 animate-pulse text-sm">
      Loading...
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 flex justify-center items-start pt-10">
      <div className="max-w-md w-full bg-slate-900/50 border border-slate-800 p-6 rounded-2xl space-y-5 shadow-2xl">

        {/* Campaign Info */}
        <div className="space-y-1">
          <span className="text-[10px] bg-teal-500/10 text-teal-400 border border-teal-500/20 px-2 py-0.5 rounded font-mono uppercase tracking-wider">
            Contributing to
          </span>
          <h2 className="text-xl font-bold text-white">{campaign?.title}</h2>
          <p className="text-xs text-gray-400 leading-relaxed line-clamp-2">
            {campaign?.description}
          </p>
        </div>

        {/* Messages */}
        {message && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 rounded-xl text-xs text-center animate-pulse">
            {message}
          </div>
        )}
        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3 rounded-xl text-xs text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Donation Type */}
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">
              Donation Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              {["MONEY", "ITEMS"].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setFormData({ ...formData, donationType: type })}
                  className={`py-2.5 rounded-xl text-sm font-bold border transition cursor-pointer ${
                    formData.donationType === type
                      ? "bg-teal-500 text-slate-950 border-teal-500"
                      : "bg-slate-900 text-gray-400 border-slate-800 hover:border-slate-600"
                  }`}
                >
                  {type === "MONEY" ? "💰 Money" : "📦 Items"}
                </button>
              ))}
            </div>
          </div>

          {/* MONEY fields */}
          {formData.donationType === "MONEY" && (
            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">
                Amount (MMK)
              </label>
              <input
                type="number"
                name="amount"
                required
                placeholder="e.g. 10000"
                value={formData.amount}
                onChange={handleChange}
                className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-xl p-3 text-sm text-white focus:outline-none"
              />
            </div>
          )}

          {/* ITEMS fields */}
          {formData.donationType === "ITEMS" && (
            <div className="space-y-4">

              {/* Item Name */}
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">
                  Item Name
                </label>
                <input
                  type="text"
                  name="itemName"
                  required
                  placeholder="e.g. Rice, Medicine, Blanket"
                  value={formData.itemName}
                  onChange={handleChange}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-xl p-3 text-sm text-white focus:outline-none"
                />
              </div>

              {/* Quantity + Unit */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">
                    Quantity
                  </label>
                  <input
                    type="number"
                    name="quantity"
                    required
                    placeholder="e.g. 10"
                    value={formData.quantity}
                    onChange={handleChange}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-xl p-3 text-sm text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">
                    Unit
                  </label>
                  <input
                    type="text"
                    name="unit"
                    required
                    placeholder="e.g. Bags, Kg"
                    value={formData.unit}
                    onChange={handleChange}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-xl p-3 text-sm text-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Condition */}
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">
                  Item Condition
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {["NEW", "GOOD", "FAIR"].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setFormData({ ...formData, condition: c })}
                      className={`py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                        formData.condition === c
                          ? "bg-teal-500 text-slate-950 border-teal-500"
                          : "bg-slate-900 text-gray-400 border-slate-800 hover:border-slate-600"
                      }`}
                    >
                      {c === "NEW" ? "✨ New" : c === "GOOD" ? "👍 Good" : "🔄 Fair"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Donor Township */}
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">
                  Your Township
                </label>
                <select
                  name="donorTownship"
                  required
                  value={formData.donorTownship}
                  onChange={handleChange}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-xl p-3 text-sm text-white focus:outline-none"
                >
                  <option value="">Select your township</option>
                  {TOWNSHIPS.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              {/* Donor Phone */}
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">
                  Contact Phone
                </label>
                <input
                  type="text"
                  name="donorPhone"
                  required
                  placeholder="e.g. 09-123456789"
                  value={formData.donorPhone}
                  onChange={handleChange}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-xl p-3 text-sm text-white focus:outline-none"
                />
              </div>

              {/* Handover Type */}
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">
                  Handover Method
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: "DELIVER", label: "🚚 I'll Deliver" },
                    { value: "PICKUP", label: "📍 Request Pickup" },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, handoverType: opt.value })}
                      className={`py-2.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                        formData.handoverType === opt.value
                          ? "bg-teal-500 text-slate-950 border-teal-500"
                          : "bg-slate-900 text-gray-400 border-slate-800 hover:border-slate-600"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Handover Date */}
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">
                  Preferred Handover Date
                </label>
                <input
                  type="date"
                  name="handoverDate"
                  value={formData.handoverDate}
                  onChange={handleChange}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-xl p-3 text-sm text-white focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* Proof Image */}
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">
              {formData.donationType === "MONEY"
                ? "Payment Proof (Image URL)"
                : "Item Photo (Image URL)"}
            </label>
            <input
              type="text"
              name="proofImageUrl"
              required
              placeholder="Paste image URL here"
              value={formData.proofImageUrl}
              onChange={handleChange}
              className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-xl p-3 text-sm text-white focus:outline-none font-mono text-xs"
            />
          </div>

          {/* Anonymous toggle */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isAnonymous"
              name="isAnonymous"
              checked={formData.isAnonymous}
              onChange={handleChange}
              className="w-4 h-4 accent-teal-500 cursor-pointer"
            />
            <label htmlFor="isAnonymous" className="text-xs text-gray-400 cursor-pointer">
              🤫 Hide my identity (အမည်မဖော်လိုပါ)
            </label>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-1">
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
              className="w-2/3 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-slate-950 font-black py-3 rounded-xl text-sm transition disabled:opacity-50 cursor-pointer"
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
