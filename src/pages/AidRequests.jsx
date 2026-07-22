import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

const CATEGORIES = ["ALL", "FOOD", "MEDICINE", "WATER", "CLOTHING", "SHELTER", "OTHER"];
const myanmarTownships = [
  "Ahlon", "Bahan", "Dagon", "Hlaing", "Insein", "Kamayut", "Kyauktada",
  "Kyimyindaing", "Lanmadaw", "Latha", "Mayangon", "Mingaladon", "Pabedan",
  "Pazundaung", "Sanchaung", "Tamwe", "Thaketa", "Thingangyun", "Yankin",
  "South Dagon", "North Dagon", "East Dagon", "Dagon Seikkan", "Dawbon",
  "Hlaingthaya", "Shwepyitha", "North Okkalapa", "South Okkalapa", "Botahtaung",
  "Seikkan", "Seikkyi Kanaungto"
];
const TOWNSHIPS = ["ALL", ...myanmarTownships, "Other"];

function AidRequests() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedTownship, setSelectedTownship] = useState("ALL");
  const [showForm, setShowForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const role = localStorage.getItem("role") || "";

  // ✅ categories is now an array
  const [form, setForm] = useState({
    title: "",
    description: "",
    categories: [],
    township: "",
    wardOrVillage: "",
    contactPhone: "",
    proofPhotoUrl: "",
    items: [{ itemName: "", quantity: 1, unit: "pcs" }],
  });

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await api.get("/aid-requests/my");
      setRequests(res.data);
    } catch (err) {
      setError("Failed to load aid requests.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ toggle category in/out of array
  const toggleCategory = (cat) => {
    setForm((prev) => ({
      ...prev,
      categories: prev.categories.includes(cat)
        ? prev.categories.filter((c) => c !== cat)
        : [...prev.categories, cat],
    }));
  };

  const handleAddItem = () => {
    setForm((prev) => ({
      ...prev,
      items: [...prev.items, { itemName: "", quantity: 1, unit: "pcs" }],
    }));
  };

  const handleRemoveItem = (index) => {
    setForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const handleItemChange = (index, field, value) => {
    setForm((prev) => {
      const updated = [...prev.items];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, items: updated };
    });
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      
      const res = await api.post("/upload/photo", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setForm({ ...form, proofPhotoUrl: res.data.url });
      setMessage("✅ Image uploaded successfully!");
    } catch (err) {
      setError("Failed to upload image. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.title || !form.description || !form.township || !form.wardOrVillage || !form.contactPhone || !form.proofPhotoUrl) {
      setError("Please fill all fields and upload a proof photo.");
      return;
    }
    // ✅ validate at least one category selected
    if (form.categories.length === 0) {
      setError("Please select at least one category.");
      return;
    }
    setSubmitting(true);
    try {
      const cleanedItems = form.items.filter((it) => it.itemName.trim() !== "");
      const payload = { ...form, items: cleanedItems };
      await api.post("/aid-requests", payload);
      setMessage("✅ Aid request submitted! Admin will review it.");
      setShowForm(false);
      setForm({
        title: "",
        description: "",
        categories: [],
        township: "",
        wardOrVillage: "",
        contactPhone: "",
        proofPhotoUrl: "",
        items: [{ itemName: "", quantity: 1, unit: "pcs" }],
      });
      fetchRequests();
      setTimeout(() => setMessage(""), 4000);
    } catch (err) {
      setError("Failed to submit request.");
    } finally {
      setSubmitting(false);
    }
  };

  // ✅ r.categories is now an array — check with .includes()
  const filtered = requests.filter((r) => {
    const catMatch = selectedCategory === "ALL" || (r.categories && r.categories.includes(selectedCategory));
    const townMatch = selectedTownship === "ALL" || r.township === selectedTownship;
    return catMatch && townMatch;
  });

  const statusColor = (status) => {
    switch (status) {
      case "VERIFIED": return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
      case "IN_PROGRESS": return "text-blue-400 bg-blue-500/10 border-blue-500/20";
      case "RESOLVED": return "text-gray-400 bg-gray-500/10 border-gray-500/20";
      case "REJECTED": return "text-rose-400 bg-rose-500/10 border-rose-500/20";
      default: return "text-amber-400 bg-amber-500/10 border-amber-500/20";
    }
  };

  const categoryEmoji = (cat) => {
    const map = { FOOD: "🍚", MEDICINE: "💊", WATER: "💧", CLOTHING: "👕", SHELTER: "🏠", OTHER: "📦" };
    return map[cat] || "📦";
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 border-b border-slate-800 pb-5">
          <div>
            <h1 className="text-2xl font-black bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
              🆘 My Aid Requests
            </h1>
            <p className="text-xs text-gray-400 mt-1">
              {filtered.length} request{filtered.length !== 1 ? "s" : ""} found
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-sm px-4 py-2 rounded-xl transition cursor-pointer font-semibold"
            >
              {showForm ? "✕ Cancel" : "+ New Request"}
            </button>
            <button
              onClick={() => navigate("/dashboard")}
              className="bg-slate-900 hover:bg-slate-800 text-sm border border-slate-800 px-4 py-2 rounded-xl transition cursor-pointer"
            >
              ← Back
            </button>
          </div>
        </div>

        {/* Messages */}
        {message && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 rounded-xl text-sm text-center">
            {message}
          </div>
        )}
        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3 rounded-xl text-sm text-center">
            {error}
            <button onClick={() => setError("")} className="ml-2 underline cursor-pointer">✕</button>
          </div>
        )}

        {/* Create Form */}
        {showForm && (
          <div className="bg-slate-900/60 border border-emerald-500/20 rounded-2xl p-6 space-y-4">
            <h2 className="text-base font-bold text-emerald-400">📝 New Aid Request</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="text-xs text-gray-400 uppercase tracking-wider">Title / ခေါင်းစဉ် *</label>
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Food needed for flood victims"
                  className="w-full mt-1 bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs text-gray-400 uppercase tracking-wider">Description / အခြေအနေအသေးစိတ် *</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Describe the situation in detail..."
                  rows={3}
                  className="w-full mt-1 bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none resize-none"
                />
              </div>

              {/* 📦 Items List (Quantity & Unit Specification) */}
              <div className="sm:col-span-2 bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-teal-400 uppercase tracking-wider">
                    📦 Needed Items & Quantities / လိုအပ်သော ပစ္စည်းနှင့် ပမာဏ
                  </label>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="text-xs bg-teal-500/10 text-teal-400 border border-teal-500/20 px-3 py-1 rounded-lg font-semibold hover:bg-teal-500/20 transition cursor-pointer"
                  >
                    + Add Item
                  </button>
                </div>

                {form.items.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                    <input
                      type="text"
                      placeholder="Item Name (e.g. Rice, Drinking Water)"
                      value={item.itemName}
                      onChange={(e) => handleItemChange(idx, "itemName", e.target.value)}
                      className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-teal-500 focus:outline-none min-w-[140px]"
                    />
                    <input
                      type="number"
                      min="0.1"
                      step="any"
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(idx, "quantity", parseFloat(e.target.value) || 0)}
                      className="w-20 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-teal-500 focus:outline-none"
                    />
                    <select
                      value={item.unit}
                      onChange={(e) => handleItemChange(idx, "unit", e.target.value)}
                      className="w-28 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-teal-500 focus:outline-none"
                    >
                      <option value="pcs">pcs (ခု)</option>
                      <option value="kg">kg (ကီလို)</option>
                      <option value="bottles">bottles (ပုလင်း)</option>
                      <option value="packets">packets (ထုပ်)</option>
                      <option value="meals">meals (နပ်)</option>
                      <option value="boxes">boxes (ဖာ)</option>
                    </select>
                    {form.items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="text-rose-400 hover:text-rose-300 text-xs px-2 py-2 cursor-pointer"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* ✅ Multi-select category checkboxes */}
              <div className="sm:col-span-2">
                <label className="text-xs text-gray-400 uppercase tracking-wider">
                  Category / အမျိုးအစား <span className="text-emerald-500">(select all that apply)</span>
                </label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {["FOOD","MEDICINE","WATER","CLOTHING","SHELTER","OTHER"].map((cat) => {
                    const selected = form.categories.includes(cat);
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => toggleCategory(cat)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                          selected
                            ? "bg-emerald-500 text-slate-950 border-emerald-500"
                            : "bg-slate-900 text-gray-400 border-slate-800 hover:border-slate-600"
                        }`}
                      >
                        {categoryEmoji(cat)} {cat}
                      </button>
                    );
                  })}
                </div>
                {form.categories.length === 0 && (
                  <p className="text-[11px] text-rose-400 mt-1">* Please select at least one</p>
                )}
              </div>

              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wider">Township / မြို့နယ် *</label>
                <select
                  value={form.township}
                  onChange={(e) => setForm({ ...form, township: e.target.value })}
                  className="w-full mt-1 bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none"
                >
                  <option value="">Select Township</option>
                  {myanmarTownships.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wider">Ward / Village / ရပ်ကွက် သို့မဟုတ် ကျေးရွာ *</label>
                <input
                  value={form.wardOrVillage}
                  onChange={(e) => setForm({ ...form, wardOrVillage: e.target.value })}
                  placeholder="e.g. Ward 5, North Dagon"
                  className="w-full mt-1 bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs text-gray-400 uppercase tracking-wider">Contact Phone / ဆက်သွယ်ရန်ဖုန်း *</label>
                <input
                  value={form.contactPhone}
                  onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
                  placeholder="e.g. 09-123456789"
                  className="w-full mt-1 bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs text-gray-400 uppercase tracking-wider">Proof Photo / အခြေအနေ ဓာတ်ပုံ *</label>
                <div className="mt-1 flex items-center gap-4">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    disabled={uploading}
                    className="block w-full text-sm text-gray-400 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-emerald-500/10 file:text-emerald-400 hover:file:bg-emerald-500/20 transition cursor-pointer"
                  />
                  {uploading && <span className="text-xs text-emerald-400 animate-pulse">Uploading...</span>}
                </div>
                {form.proofPhotoUrl && (
                  <div className="mt-3 relative w-full h-40 rounded-xl overflow-hidden border border-slate-700">
                    <img src={form.proofPhotoUrl} alt="Proof" className="w-full h-full object-cover" />
                    <button 
                      type="button"
                      onClick={() => setForm({...form, proofPhotoUrl: ""})}
                      className="absolute top-2 right-2 bg-rose-500/80 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-rose-500 transition cursor-pointer"
                      title="Remove Image"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-2.5 rounded-xl transition cursor-pointer disabled:opacity-50"
            >
              {submitting ? "Submitting..." : "Submit Request"}
            </button>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                selectedCategory === cat
                  ? "bg-emerald-500 text-slate-950 border-emerald-500"
                  : "bg-slate-900 text-gray-400 border-slate-800 hover:border-slate-600"
              }`}
            >
              {cat === "ALL" ? "All" : `${categoryEmoji(cat)} ${cat}`}
            </button>
          ))}
        </div>

        {/* List */}
        {loading ? (
          <div className="text-center py-10 text-emerald-400 animate-pulse text-sm">
            Loading requests...
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((req) => (
              <div
                key={req.id}
                className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {/* ✅ show all category emojis */}
                    <span className="text-xl">
                      {req.categories?.map(c => categoryEmoji(c)).join("") || "📦"}
                    </span>
                    <div>
                      <h3 className="font-bold text-white text-sm">{req.title}</h3>
                      <p className="text-[11px] text-gray-500 font-mono">
                        📍 {req.township}, {req.wardOrVillage}
                      </p>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono border self-start ${statusColor(req.status)}`}>
                    {req.status}
                  </span>
                </div>

                {/* ✅ show category tags */}
                <div className="flex flex-wrap gap-1">
                  {req.categories?.map(cat => (
                    <span key={cat} className="px-2 py-0.5 bg-slate-800 text-gray-300 rounded text-[10px] font-mono">
                      {categoryEmoji(cat)} {cat}
                    </span>
                  ))}
                </div>

                <p className="text-xs text-gray-400 leading-relaxed">{req.description}</p>
                <div className="flex flex-wrap items-center gap-4 text-[11px] text-gray-500">
                  <span>📞 {req.contactPhone}</span>
                  <span>👤 {req.reporter?.username || "Anonymous"}</span>
                  <span>🕐 {req.createdAt ? new Date(req.createdAt).toLocaleDateString() : "—"}</span>
                  <span>👍 {req.upvoteCount || 0} upvotes</span>
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="text-center py-20 bg-slate-900/20 border border-slate-800 border-dashed rounded-2xl">
                <p className="text-gray-400 text-sm">No aid requests found.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default AidRequests;
