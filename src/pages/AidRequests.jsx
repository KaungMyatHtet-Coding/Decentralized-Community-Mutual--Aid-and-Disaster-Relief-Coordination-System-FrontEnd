import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

const CATEGORIES = ["ALL", "FOOD", "MEDICINE", "WATER", "CLOTHING", "SHELTER", "OTHER"];
const TOWNSHIPS = ["ALL", "Yangon", "Mandalay", "Naypyidaw", "Bago", "Mawlamyine", "Other"];

function AidRequests() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedTownship, setSelectedTownship] = useState("ALL");
  const [showForm, setShowForm] = useState(false);
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
  });

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await api.get("/aid-requests");
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

  const handleSubmit = async () => {
    if (!form.title || !form.description || !form.township || !form.wardOrVillage || !form.contactPhone) {
      setError("Please fill all fields.");
      return;
    }
    // ✅ validate at least one category selected
    if (form.categories.length === 0) {
      setError("Please select at least one category.");
      return;
    }
    setSubmitting(true);
    try {
      await api.post("/aid-requests", form);
      setMessage("✅ Aid request submitted! Admin will review it.");
      setShowForm(false);
      setForm({ title: "", description: "", categories: [], township: "", wardOrVillage: "", contactPhone: "" });
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
              🆘 Aid Requests
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
                <label className="text-xs text-gray-400 uppercase tracking-wider">Title</label>
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Food needed for flood victims"
                  className="w-full mt-1 bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs text-gray-400 uppercase tracking-wider">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Describe the situation in detail..."
                  rows={3}
                  className="w-full mt-1 bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none resize-none"
                />
              </div>

              {/* ✅ Multi-select category checkboxes */}
              <div className="sm:col-span-2">
                <label className="text-xs text-gray-400 uppercase tracking-wider">
                  Category <span className="text-emerald-500">(select all that apply)</span>
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
                <label className="text-xs text-gray-400 uppercase tracking-wider">Township</label>
                <input
                  value={form.township}
                  onChange={(e) => setForm({ ...form, township: e.target.value })}
                  placeholder="e.g. Yangon"
                  className="w-full mt-1 bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wider">Ward / Village</label>
                <input
                  value={form.wardOrVillage}
                  onChange={(e) => setForm({ ...form, wardOrVillage: e.target.value })}
                  placeholder="e.g. Ward 5, North Dagon"
                  className="w-full mt-1 bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wider">Contact Phone</label>
                <input
                  value={form.contactPhone}
                  onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
                  placeholder="e.g. 09-123456789"
                  className="w-full mt-1 bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none"
                />
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
