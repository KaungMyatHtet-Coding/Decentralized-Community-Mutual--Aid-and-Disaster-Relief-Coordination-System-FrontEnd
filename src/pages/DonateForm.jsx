import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api";

const TOWNSHIPS = [
  "Yangon",
  "Mandalay",
  "Naypyidaw",
  "Bago",
  "Mawlamyine",
  "Pathein",
  "Meiktila",
  "Myingyan",
  "Other",
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
    api
      .get(`/campaigns/${campaignId}`)
      .then((res) => setCampaign(res.data))
      .catch(() => setError("Failed to fetch campaign details."))
      .finally(() => setLoading(false));
  }, [campaignId]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === "checkbox" ? checked : value });
  };
  // ... ကျန်တဲ့ code များအတိုင်းထားပါ

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setMessage("");

    try {
      if (formData.donationType === "MONEY") {
        const payload = {
          campaign: { id: parseInt(campaignId) },
          donationType: "MONEY",
          amount: parseFloat(formData.amount),
          proofImageUrl: formData.proofImageUrl || "",
          isAnonymous: formData.isAnonymous,
        };
        await api.post("/donations", payload);
        // DonateForm.jsx ထဲက ITEMS DONATION payload နေရာမှာ
      } else {
        // 📦 ITEMS DONATION
        const payload = {
          campaignId: parseInt(campaignId), // Entity ထဲက @Transient campaignId အတွက်
          campaign: { id: parseInt(campaignId) }, // Entity ထဲက Campaign object အတွက်

          itemName: formData.itemName,
          quantity: parseFloat(formData.quantity),
          unit: formData.unit,
          condition: formData.condition,
          donorTownship: formData.donorTownship,
          donorPhone: formData.donorPhone,
          handoverType: formData.handoverType,
          handoverDate: formData.handoverDate
            ? new Date(formData.handoverDate).toISOString()
            : null,
          itemPhotoUrl: formData.proofImageUrl || "",
          isAnonymous: formData.isAnonymous,
        };

        await api.post("/item-donations", payload);
      }

      setMessage("🎉 Donation submitted successfully!");
      setTimeout(() => navigate("/campaigns"), 2000);
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data || "Failed to submit donation. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };
  if (loading) {
    return (
      <div className="text-center py-20 text-teal-400">Loading campaign...</div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 flex justify-center items-start pt-10">
      <div className="max-w-md w-full bg-slate-900/50 border border-slate-800 p-6 rounded-2xl space-y-5 shadow-2xl">
        {/* Campaign Info */}
        <div className="space-y-1">
          <span className="text-[10px] bg-teal-500/10 text-teal-400 border border-teal-500/20 px-2 py-0.5 rounded font-mono uppercase tracking-wider">
            Contributing to
          </span>
          <h2 className="text-xl font-bold">{campaign?.title}</h2>
          <p className="text-xs text-gray-400 line-clamp-2">
            {campaign?.description}
          </p>
        </div>

        {message && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 rounded-xl text-center">
            {message}
          </div>
        )}
        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3 rounded-xl text-center">
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
                  onClick={() =>
                    setFormData({ ...formData, donationType: type })
                  }
                  className={`py-2.5 rounded-xl text-sm font-bold border transition ${
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

          {/* MONEY */}
          {formData.donationType === "MONEY" && (
            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">
                Amount (MMK)
              </label>
              <input
                type="number"
                name="amount"
                required
                placeholder="10000"
                value={formData.amount}
                onChange={handleChange}
                className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-xl p-3 text-sm"
              />
            </div>
          )}

          {/* ITEMS */}
          {formData.donationType === "ITEMS" && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">
                  Item Name
                </label>
                <input
                  type="text"
                  name="itemName"
                  required
                  placeholder="Blanket, Rice..."
                  value={formData.itemName}
                  onChange={handleChange}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-xl p-3 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">
                    Quantity
                  </label>
                  <input
                    type="number"
                    name="quantity"
                    required
                    value={formData.quantity}
                    onChange={handleChange}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-xl p-3 text-sm"
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
                    placeholder="Bags, Pieces"
                    value={formData.unit}
                    onChange={handleChange}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-xl p-3 text-sm"
                  />
                </div>
              </div>

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
                      className={`py-2 rounded-xl text-xs font-bold ${formData.condition === c ? "bg-teal-500 text-slate-950" : "bg-slate-900 text-gray-400"}`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">
                  Your Township
                </label>
                <select
                  name="donorTownship"
                  required
                  value={formData.donorTownship}
                  onChange={handleChange}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-xl p-3 text-sm"
                >
                  <option value="">Select Township</option>
                  {TOWNSHIPS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">
                  Contact Phone
                </label>
                <input
                  type="text"
                  name="donorPhone"
                  required
                  placeholder="09xxxxxxxxx"
                  value={formData.donorPhone}
                  onChange={handleChange}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-xl p-3 text-sm"
                />
              </div>

              {/* Handover Type, Date, etc. ... (မင်းရဲ့ ကုဒ်အတိုင်း ကျန်ထားပါ) */}
            </div>
          )}

          {/* Proof Image */}
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">
              {formData.donationType === "MONEY"
                ? "Payment Proof URL"
                : "Item Photo URL"}
            </label>
            <input
              type="text"
              name="proofImageUrl"
              required
              placeholder="https://..."
              value={formData.proofImageUrl}
              onChange={handleChange}
              className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-xl p-3 text-sm font-mono"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 font-black py-3.5 rounded-xl text-lg disabled:opacity-50"
          >
            {submitting ? "Submitting..." : "Confirm & Donate"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default DonateForm;
