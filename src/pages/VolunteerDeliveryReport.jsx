import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api";

const PRESET_RELIEF_ITEMS = [
  { key: "MEDICINE", name: "💊 Medicine / ဆေးဝါး", defaultUnit: "packs" },
  { key: "FOOD", name: "🍚 Rice & Food / ဆန်နှင့် စားနပ်ရိက္ခာ", defaultUnit: "bags" },
  { key: "WATER", name: "💧 Drinking Water / သောက်ရေသန့်", defaultUnit: "bottles" },
  { key: "CLOTHING", name: "🧥 Clothing & Blanket / အဝတ်အထည်နှင့် စောင်", defaultUnit: "sets" },
  { key: "OTHERS", name: "📦 Other Supplies / အခြား ထောက်ပံ့ရေး", defaultUnit: "pcs" },
];

export default function VolunteerDeliveryReport() {
  const { aidRequestId } = useParams();
  const navigate = useNavigate();

  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [proofPhotoUrl, setProofPhotoUrl] = useState("");
  const [notes, setNotes] = useState("");

  // Items selection state (Choice of 5 items with checkbox and quantity)
  const [itemsSelection, setItemsSelection] = useState({
    MEDICINE: { checked: false, qty: 1, unit: "packs" },
    FOOD: { checked: true, qty: 1, unit: "bags" },
    WATER: { checked: false, qty: 1, unit: "bottles" },
    CLOTHING: { checked: false, qty: 1, unit: "sets" },
    OTHERS: { checked: false, qty: 1, unit: "pcs" },
  });

  useEffect(() => {
    fetchAidRequest();
  }, [aidRequestId]);

  const fetchAidRequest = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/aid-requests/${aidRequestId}`);
      setRequest(res.data);

      // Auto-check categories if request items specify them
      if (res.data.items && res.data.items.length > 0) {
        const updated = { ...itemsSelection };
        res.data.items.forEach(it => {
          const lower = (it.itemName || "").toLowerCase();
          let key = "OTHERS";
          if (lower.includes("med") || lower.includes("ဆေး")) key = "MEDICINE";
          else if (lower.includes("food") || lower.includes("rice") || lower.includes("ဆန်")) key = "FOOD";
          else if (lower.includes("water") || lower.includes("ရေ")) key = "WATER";
          else if (lower.includes("cloth") || lower.includes("အဝတ်") || lower.includes("blanket")) key = "CLOTHING";

          updated[key] = {
            checked: true,
            qty: it.quantity || 1,
            unit: it.unit || updated[key].defaultUnit,
          };
        });
        setItemsSelection(updated);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to load aid request details.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleItem = (key) => {
    setItemsSelection(prev => ({
      ...prev,
      [key]: { ...prev[key], checked: !prev[key].checked }
    }));
  };

  const handleQtyChange = (key, val) => {
    const qty = Math.max(1, parseFloat(val) || 1);
    setItemsSelection(prev => ({
      ...prev,
      [key]: { ...prev[key], qty }
    }));
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await api.post("/upload/photo", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setProofPhotoUrl(res.data.url);
    } catch (err) {
      alert("Failed to upload image. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Check if at least 1 item is selected
    const selectedList = Object.keys(itemsSelection)
      .filter(key => itemsSelection[key].checked)
      .map(key => {
        const preset = PRESET_RELIEF_ITEMS.find(p => p.key === key);
        return {
          itemName: preset.name.split("/")[0].trim(), // Clean title e.g. 🍚 Rice & Food
          quantityDelivered: itemsSelection[key].qty,
          unit: itemsSelection[key].unit,
        };
      });

    if (selectedList.length === 0) {
      alert("ကျေးဇူးပြု၍ အနည်းဆုံး ပစ္စည်း ၁ မျိုး (သို့မဟုတ် ၅ မျိုးအထိ) ရွေးချယ်ပေးပါ (Please select at least 1 item delivered).");
      return;
    }

    if (!proofPhotoUrl) {
      alert("Please upload a proof photo of the delivery.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        aidRequestId: parseInt(aidRequestId),
        proofPhotoUrl,
        notes,
        deliveredItems: selectedList,
      };
      await api.post("/delivery-reports", payload);
      alert("✅ Delivery report submitted successfully! Admin will review and approve.");
      navigate("/volunteer/aid-tasks");
    } catch (err) {
      alert("❌ Submission failed: " + (err.response?.data || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        <div className="animate-spin w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        <p>Aid Request not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Back button */}
        <button
          onClick={() => navigate("/volunteer/aid-tasks")}
          className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 px-4 py-2 rounded-xl text-xs transition flex items-center gap-2 cursor-pointer font-semibold"
        >
          ← Back to Tasks
        </button>

        {/* Header */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-3">
          <div className="flex items-center gap-3">
            <span className="text-3xl">📦</span>
            <div>
              <h1 className="text-xl font-bold text-teal-400">Submit Delivery Report</h1>
              <p className="text-xs text-slate-400">
                Confirm items delivered and upload proof photo for admin verification.
              </p>
            </div>
          </div>

          {/* Aid Request Summary */}
          <div className="pt-3 border-t border-slate-800 space-y-1 text-xs">
            <h3 className="text-sm font-bold text-white">{request.title}</h3>
            <p className="text-slate-400">📍 {request.township} · {request.wardOrVillage}</p>
            <p className="text-teal-400 font-mono">📞 Contact: {request.contactPhone}</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl">

          {/* 1. Choice of 5 Items Selection */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-teal-400 uppercase tracking-wider block">
                1. DELIVERED ITEMS CHOICE (1 to 5 Items) / ပို့ဆောင်ခဲ့သည့် ပစ္စည်းအမျိုးအစားများ
              </label>
              <span className="text-[10px] text-slate-400 bg-slate-950 px-2.5 py-1 rounded-full border border-slate-800 font-mono">
                Select 1 - 5 items
              </span>
            </div>

            <div className="space-y-3">
              {PRESET_RELIEF_ITEMS.map((item) => {
                const isChecked = itemsSelection[item.key]?.checked;
                const qty = itemsSelection[item.key]?.qty || 1;
                const unit = itemsSelection[item.key]?.unit || item.defaultUnit;

                return (
                  <div
                    key={item.key}
                    className={`border rounded-2xl p-4 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isChecked
                        ? "bg-slate-950 border-teal-500/50 shadow-md shadow-teal-500/10"
                        : "bg-slate-950/40 border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    {/* Checkbox & Name */}
                    <label className="flex items-center gap-3 cursor-pointer flex-1">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleItem(item.key)}
                        className="w-5 h-5 accent-teal-500 rounded cursor-pointer"
                      />
                      <div>
                        <span className={`text-xs font-bold ${isChecked ? "text-white" : "text-slate-400"}`}>
                          {item.name}
                        </span>
                        <span className="text-[10px] text-slate-500 block">Unit: {unit}</span>
                      </div>
                    </label>

                    {/* Quantity Input (Active when checked) */}
                    {isChecked && (
                      <div className="flex items-center gap-2 self-end sm:self-center bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5">
                        <span className="text-[10px] text-slate-400">Qty:</span>
                        <input
                          type="number"
                          min="1"
                          value={qty}
                          onChange={(e) => handleQtyChange(item.key, e.target.value)}
                          className="w-20 bg-slate-950 border border-slate-700 rounded-lg text-center text-xs font-bold text-teal-400 focus:outline-none focus:border-teal-500 py-1"
                        />
                        <span className="text-xs text-slate-400 font-semibold">{unit}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2. Proof Photo */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-teal-400 uppercase tracking-wider block">
              2. PROOF PHOTO / ပေးပို့ခဲ့သည့် အထောက်အထား ဓာတ်ပုံ *
            </label>

            {proofPhotoUrl ? (
              <div className="relative rounded-2xl overflow-hidden border border-teal-500/30">
                <img src={proofPhotoUrl} alt="Proof" className="w-full h-48 object-cover" />
                <button
                  type="button"
                  onClick={() => setProofPhotoUrl("")}
                  className="absolute top-2 right-2 bg-rose-600 hover:bg-rose-500 text-white text-xs px-3 py-1 rounded-xl font-bold shadow-md cursor-pointer"
                >
                  ✕ Change Photo
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center h-36 border-2 border-dashed border-slate-800 hover:border-teal-500/50 rounded-2xl cursor-pointer transition bg-slate-950/40">
                <span className="text-3xl mb-1">📸</span>
                <span className="text-xs text-slate-300 font-semibold">
                  {uploading ? "Uploading photo..." : "Click to upload proof photo"}
                </span>
                <span className="text-[10px] text-slate-500 mt-1">JPG, PNG supported</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* 3. Notes */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-teal-400 uppercase tracking-wider block">
              3. NOTES / မှတ်ချက် (OPTIONAL)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional details about the delivery..."
              rows={3}
              className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-2xl px-4 py-2.5 text-xs text-white focus:outline-none resize-none"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting || uploading}
            className="w-full bg-teal-500 hover:bg-teal-400 active:scale-95 text-slate-950 font-bold py-3.5 px-4 rounded-2xl transition cursor-pointer disabled:opacity-50 text-xs shadow-lg shadow-teal-500/20"
          >
            {submitting ? "Submitting Report..." : "🚀 Submit Report for Admin Approval"}
          </button>
        </form>
      </div>
    </div>
  );
}
