import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api";

const emptyForm = {
  title: "",
  description: "",
  targetAmount: "",
  startDate: "",
  endDate: "",
  status: "ACTIVE",
};

function AdminCampaigns() {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [form, setForm] = useState(emptyForm);

  // ── fetch ──────────────────────────────────────────────
  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const res = await api.get("/campaigns");
      setCampaigns(res.data);
    } catch {
      setError("Failed to load campaigns.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCampaigns(); }, []);

  // ── helpers ────────────────────────────────────────────
  const showMsg = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(""), 4000);
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (c) => {
    setEditingId(c.id);
    setForm({
      title: c.title,
      description: c.description,
      targetAmount: c.targetAmount,
      startDate: c.startDate ? c.startDate.slice(0, 10) : "",
      endDate: c.endDate ? c.endDate.slice(0, 10) : "",
      status: c.status,
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async () => {
    if (!form.title || !form.description || !form.targetAmount || !form.startDate || !form.endDate) {
      setError("Please fill all fields.");
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        targetAmount: parseFloat(form.targetAmount),
        startDate: new Date(form.startDate + "T00:00:00").toISOString(),
        endDate: new Date(form.endDate + "T23:59:59").toISOString(),
      };
      if (editingId) {
        await api.put(`/campaigns/${editingId}`, payload);
        showMsg("✅ Campaign updated successfully!");
      } else {
        await api.post("/campaigns", payload);
        showMsg("✅ Campaign created! Now visible to users.");
      }
      setShowForm(false);
      setForm(emptyForm);
      setEditingId(null);
      fetchCampaigns();
    } catch (err) {
      setError(err.response?.data || "Failed to save campaign.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/campaigns/${id}`);
      setDeleteConfirm(null);
      showMsg("🗑️ Campaign deleted.");
      fetchCampaigns();
    } catch (err) {
      setError(err.response?.data || "Failed to delete.");
    }
  };

  const statusColor = (status) => {
    switch (status) {
      case "ACTIVE":    return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
      case "COMPLETED": return "text-blue-400 bg-blue-500/10 border-blue-500/20";
      case "CANCELLED": return "text-rose-400 bg-rose-500/10 border-rose-500/20";
      default:          return "text-gray-400 bg-gray-500/10 border-gray-500/20";
    }
  };

  const getProgress = (current, target) => {
    if (!target || target === 0) return 0;
    return Math.min(Math.round((current / target) * 100), 100);
  };

  const formatAmount = (amount) =>
    new Intl.NumberFormat("my-MM").format(amount || 0) + " ks";

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 border-b border-slate-800 pb-5">
          <div>
            <h1 className="text-2xl font-black bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">
              📋 Manage Campaigns
            </h1>
            <p className="text-xs text-gray-400 mt-1">
              {campaigns.length} campaign{campaigns.length !== 1 ? "s" : ""} total
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={openCreate}
              className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-sm px-4 py-2 rounded-xl transition cursor-pointer"
            >
              + New Campaign
            </button>
            <button
              onClick={() => navigate("/admin/dashboard")}
              className="bg-slate-900 hover:bg-slate-800 text-xs border border-slate-800 px-4 py-2 rounded-xl transition cursor-pointer"
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

        {/* Create / Edit Form */}
        {showForm && (
          <div className="bg-slate-900/60 border border-teal-500/20 rounded-2xl p-6 space-y-4">
            <h2 className="text-base font-bold text-teal-400">
              {editingId ? "✏️ Edit Campaign" : "➕ New Campaign"}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="text-xs text-gray-400 uppercase tracking-wider">Title</label>
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Campaign title"
                  className="w-full mt-1 bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs text-gray-400 uppercase tracking-wider">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Describe the campaign purpose..."
                  rows={3}
                  className="w-full mt-1 bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none resize-none"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wider">Target Amount (MMK)</label>
                <input
                  type="number"
                  value={form.targetAmount}
                  onChange={(e) => setForm({ ...form, targetAmount: e.target.value })}
                  placeholder="e.g. 500000"
                  className="w-full mt-1 bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wider">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full mt-1 bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="COMPLETED">COMPLETED</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wider">Start Date</label>
                <input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                  className="w-full mt-1 bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wider">End Date</label>
                <input
                  type="date"
                  value={form.endDate}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                  className="w-full mt-1 bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none"
                />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold px-6 py-2.5 rounded-xl text-sm transition cursor-pointer disabled:opacity-50"
              >
                {submitting ? "Saving..." : editingId ? "Update Campaign" : "Create Campaign"}
              </button>
              <button
                onClick={() => { setShowForm(false); setEditingId(null); setForm(emptyForm); }}
                className="bg-slate-800 hover:bg-slate-700 text-gray-300 px-6 py-2.5 rounded-xl text-sm transition cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Campaigns List */}
        {loading ? (
          <div className="text-center py-16 text-teal-400 animate-pulse text-sm">Loading campaigns...</div>
        ) : (
          <div className="space-y-4">
            {campaigns.map((c) => {
              const progress = getProgress(c.currentAmount, c.targetAmount);
              return (
                <div key={c.id} className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-white text-sm">{c.title}</h3>
                      <p className="text-xs text-gray-400 mt-1 leading-relaxed line-clamp-2">{c.description}</p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono border shrink-0 self-start ${statusColor(c.status)}`}>
                      {c.status}
                    </span>
                  </div>

                  {/* Progress */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[11px] text-gray-400">
                      <span>Raised: <span className="text-teal-400 font-bold">{formatAmount(c.currentAmount)}</span></span>
                      <span>Goal: <span className="text-white font-bold">{formatAmount(c.targetAmount)}</span></span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-1.5">
                      <div
                        className="bg-gradient-to-r from-teal-500 to-emerald-500 h-1.5 rounded-full transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <div className="text-right text-[10px] text-gray-500 font-mono">{progress}% funded</div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-800">
                    <div className="flex gap-4 text-[11px] text-gray-500">
                      <span>🗓 {c.startDate ? new Date(c.startDate).toLocaleDateString() : "—"}</span>
                      <span>→ {c.endDate ? new Date(c.endDate).toLocaleDateString() : "—"}</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEdit(c)}
                        className="bg-slate-800 hover:bg-slate-700 text-gray-300 border border-slate-700 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(c.id)}
                        className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>

                  {/* Delete Confirm */}
                  {deleteConfirm === c.id && (
                    <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 flex items-center justify-between gap-3">
                      <p className="text-xs text-rose-400">Delete this campaign? This cannot be undone.</p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDelete(c.id)}
                          className="bg-rose-500 hover:bg-rose-400 text-white font-bold px-3 py-1.5 rounded-lg text-xs cursor-pointer transition"
                        >
                          Yes, Delete
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(null)}
                          className="bg-slate-800 text-gray-300 px-3 py-1.5 rounded-lg text-xs cursor-pointer transition"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            {campaigns.length === 0 && (
              <div className="text-center py-20 bg-slate-900/20 border border-slate-800 border-dashed rounded-2xl">
                <p className="text-gray-400 text-sm">No campaigns yet. Create one!</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminCampaigns;
