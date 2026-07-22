import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

const myanmarTownships = [
  "Ahlon", "Bahan", "Dagon", "Hlaing", "Insein", "Kamayut", "Kyauktada",
  "Kyimyindaing", "Lanmadaw", "Latha", "Mayangon", "Mingaladon", "Pabedan",
  "Pazundaung", "Sanchaung", "Tamwe", "Thaketa", "Thingangyun", "Yankin",
  "South Dagon", "North Dagon", "East Dagon", "Dagon Seikkan", "Dawbon",
  "Hlaingthaya", "Shwepyitha", "North Okkalapa", "South Okkalapa", "Botahtaung",
  "Seikkan", "Seikkyi Kanaungto"
];

const emptyForm = {
  title: "",
  titleMy: "",
  description: "",
  descriptionMy: "",
  targetAmount: "",
  category: "",
  imageUrl: "",
  startDate: "",
  endDate: "",
  status: "ACTIVE",
  township: "",
};

function AdminCampaigns() {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [exporting, setExporting] = useState(false);
  
  const [activeTab, setActiveTab] = useState("ACTIVE");
  const [filterTownship, setFilterTownship] = useState("");
  const [filterTitle, setFilterTitle] = useState("");
  const [filterMonth, setFilterMonth] = useState("");

  const role = localStorage.getItem("role");
  const isSuperAdmin = role === "ROLE_SUPER_ADMIN" || role === "SUPER_ADMIN";
  const userId = Number(localStorage.getItem("userId"));

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
      title: c.title || "",
      titleMy: c.titleMy || "",
      description: c.description || "",
      descriptionMy: c.descriptionMy || "",
      targetAmount: c.targetAmount || "",
      category: c.category || "",
      imageUrl: c.imageUrl || "",
      startDate: c.startDate ? c.startDate.slice(0, 10) : "",
      endDate: c.endDate ? c.endDate.slice(0, 10) : "",
      status: c.status || "ACTIVE",
      township: c.township || "",
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async () => {
    if (!form.title || !form.description || !form.startDate || !form.endDate || !form.imageUrl) {
      setError("Please fill all required fields (Title, Description, Dates, Image URL).");
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        targetAmount: form.targetAmount ? parseFloat(form.targetAmount) : null,
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

  const handleApprove = async (id) => {
    try {
      await api.put(`/campaigns/${id}/approve`);
      showMsg("✅ Campaign approved and is now ACTIVE!");
      fetchCampaigns();
    } catch (err) {
      setError(err.response?.data || "Failed to approve.");
    }
  };

  const statusColor = (status) => {
    switch (status) {
      case "ACTIVE":    return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
      case "COMPLETED": return "text-blue-400 bg-blue-500/10 border-blue-500/20";
      case "CANCELLED": return "text-rose-400 bg-rose-500/10 border-rose-500/20";
      case "PENDING":   return "text-amber-400 bg-amber-500/10 border-amber-500/20";
      case "REJECTED":  return "text-red-500 bg-red-500/10 border-red-500/20";
      default:          return "text-gray-400 bg-gray-500/10 border-gray-500/20";
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      
      const res = await api.post("/upload/photo", formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      });
      setForm({ ...form, imageUrl: res.data.url });
      showMsg("✅ Image uploaded successfully!");
    } catch (err) {
      setError("Failed to upload image. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const getProgress = (current, target) => {
    if (!target || target === 0) return 0;
    return Math.min(Math.round((current / target) * 100), 100);
  };

  const formatAmount = (amount) =>
    new Intl.NumberFormat("my-MM").format(amount || 0) + " ks";

  const filteredCampaigns = campaigns.filter(c => {
    if (activeTab === "ACTIVE" && c.status !== "ACTIVE" && c.status !== "PENDING") return false;
    if (activeTab === "PAST" && (c.status === "ACTIVE" || c.status === "PENDING")) return false;
    if (filterTownship && c.township !== filterTownship) return false;
    if (filterTitle && !c.title.toLowerCase().includes(filterTitle.toLowerCase())) return false;
    if (filterMonth && c.startDate) {
      const cDate = new Date(c.startDate);
      const cMonth = `${cDate.getFullYear()}-${String(cDate.getMonth() + 1).padStart(2, '0')}`;
      if (cMonth !== filterMonth) return false;
    }
    return true;
  });

  const exportPDF = () => {
    setExporting(true);
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Campaigns History Report", 14, 20);
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleString()} | Total: ${filteredCampaigns.length} campaigns`, 14, 28);
    if (filterTownship || filterTitle || filterMonth) {
      doc.text(`Filters - Township: ${filterTownship || "All"}, Name: ${filterTitle || "Any"}, Month: ${filterMonth || "Any"}`, 14, 34);
    }

    const tableColumn = ["ID", "Title", "Township", "Category", "Status", "Raised", "Target", "Dates"];
    const tableRows = filteredCampaigns.map(c => [
      c.id,
      c.title,
      c.township || "All",
      c.category || "—",
      c.status,
      formatAmount(c.currentAmount),
      formatAmount(c.targetAmount),
      `${c.startDate ? new Date(c.startDate).toLocaleDateString() : "—"} to ${c.endDate ? new Date(c.endDate).toLocaleDateString() : "—"}`
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: (filterTownship || filterTitle || filterMonth) ? 40 : 35,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [15, 118, 110] },
    });

    doc.save("Campaign_History_Report.pdf");
    setExporting(false);
  };

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
              {filteredCampaigns.length} campaign{filteredCampaigns.length !== 1 ? "s" : ""} total
            </p>
          </div>
          <div className="flex gap-3">
            {isSuperAdmin && (
              <button
                onClick={exportPDF}
                disabled={exporting || filteredCampaigns.length === 0}
                className="bg-slate-800 hover:bg-slate-700 text-gray-300 border border-slate-700 text-xs px-4 py-2 rounded-xl transition cursor-pointer font-semibold disabled:opacity-40"
              >
                {exporting ? "Exporting..." : "📄 Export PDF"}
              </button>
            )}
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

        {/* Tabs and Filters */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-4">
          <div className="flex gap-4 border-b border-slate-800 pb-2">
            <button
              onClick={() => setActiveTab("ACTIVE")}
              className={`pb-2 text-sm font-bold transition cursor-pointer ${activeTab === "ACTIVE" ? "text-teal-400 border-b-2 border-teal-400" : "text-gray-500 hover:text-gray-300"}`}
            >
              Active & Pending
            </button>
            <button
              onClick={() => setActiveTab("PAST")}
              className={`pb-2 text-sm font-bold transition cursor-pointer ${activeTab === "PAST" ? "text-teal-400 border-b-2 border-teal-400" : "text-gray-500 hover:text-gray-300"}`}
            >
              Past Campaigns
            </button>
          </div>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[150px]">
              <label className="text-[10px] text-gray-500 uppercase tracking-wider">Township</label>
              <select
                value={filterTownship}
                onChange={(e) => setFilterTownship(e.target.value)}
                className="w-full mt-1 bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
              >
                <option value="">All Townships</option>
                {myanmarTownships.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="flex-1 min-w-[150px]">
              <label className="text-[10px] text-gray-500 uppercase tracking-wider">Campaign Name</label>
              <input
                type="text"
                placeholder="Search by name..."
                value={filterTitle}
                onChange={(e) => setFilterTitle(e.target.value)}
                className="w-full mt-1 bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
              />
            </div>
            <div className="flex-1 min-w-[150px]">
              <label className="text-[10px] text-gray-500 uppercase tracking-wider">Month</label>
              <input
                type="month"
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
                className="w-full mt-1 bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
              />
            </div>
            <button
              onClick={() => { setFilterTownship(""); setFilterTitle(""); setFilterMonth(""); }}
              className="bg-slate-800 hover:bg-slate-700 text-gray-300 border border-slate-700 px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition"
            >
              Clear
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
              <div className="sm:col-span-1">
                <label className="text-xs text-gray-400 uppercase tracking-wider">Title (English) *</label>
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Campaign title"
                  className="w-full mt-1 bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none"
                />
              </div>
              <div className="sm:col-span-1">
                <label className="text-xs text-gray-400 uppercase tracking-wider">Title (Myanmar)</label>
                <input
                  value={form.titleMy}
                  onChange={(e) => setForm({ ...form, titleMy: e.target.value })}
                  placeholder="မြန်မာလို ခေါင်းစဉ်"
                  className="w-full mt-1 bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none"
                />
              </div>
              <div className="sm:col-span-1">
                <label className="text-xs text-gray-400 uppercase tracking-wider">Description (English) *</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Describe the campaign purpose..."
                  rows={3}
                  className="w-full mt-1 bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none resize-none"
                />
              </div>
              <div className="sm:col-span-1">
                <label className="text-xs text-gray-400 uppercase tracking-wider">Description (Myanmar)</label>
                <textarea
                  value={form.descriptionMy}
                  onChange={(e) => setForm({ ...form, descriptionMy: e.target.value })}
                  placeholder="ကမ်ပိန်းအကြောင်း မြန်မာလိုရှင်းလင်းချက်..."
                  rows={3}
                  className="w-full mt-1 bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none resize-none"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs text-gray-400 uppercase tracking-wider">Cover Image *</label>
                <div className="mt-1 flex items-center gap-4">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    disabled={uploading}
                    className="block w-full text-sm text-gray-400 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-teal-500/10 file:text-teal-400 hover:file:bg-teal-500/20 transition cursor-pointer"
                  />
                  {uploading && <span className="text-xs text-teal-400 animate-pulse">Uploading...</span>}
                </div>
                {form.imageUrl && (
                  <div className="mt-3 relative w-full h-40 rounded-xl overflow-hidden border border-slate-700">
                    <img src={form.imageUrl} alt="Cover Preview" className="w-full h-full object-cover" />
                    <button 
                      onClick={() => setForm({...form, imageUrl: ""})}
                      className="absolute top-2 right-2 bg-rose-500/80 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-rose-500 transition cursor-pointer"
                      title="Remove Image"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>
              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wider">Category</label>
                <input
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  placeholder="e.g. Urgent, Rebuilding"
                  className="w-full mt-1 bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wider">Target Amount (MMK) - Optional</label>
                <input
                  type="number"
                  value={form.targetAmount}
                  onChange={(e) => setForm({ ...form, targetAmount: e.target.value })}
                  placeholder="Leave empty if no target"
                  className="w-full mt-1 bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none"
                />
              </div>
              {isSuperAdmin && (
                <div>
                  <label className="text-xs text-gray-400 uppercase tracking-wider">Township</label>
                  <select
                    value={form.township || ""}
                    onChange={(e) => setForm({ ...form, township: e.target.value })}
                    className="w-full mt-1 bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none"
                  >
                    <option value="">All Townships</option>
                    {myanmarTownships.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wider">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full mt-1 bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none"
                >
                  <option value="PENDING">PENDING</option>
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="COMPLETED">COMPLETED</option>
                  <option value="CANCELLED">CANCELLED</option>
                  <option value="REJECTED">REJECTED</option>
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
            {filteredCampaigns.map((c) => {
              const progress = getProgress(c.currentAmount, c.targetAmount);
              const canEdit = isSuperAdmin || c.authorId === userId;
              
              return (
                <div key={c.id} className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-white text-sm">{c.title}</h3>
                        {c.township && (
                          <span className="bg-slate-800 text-teal-400 text-[10px] px-2 py-0.5 rounded border border-teal-500/20">
                            {c.township}
                          </span>
                        )}
                      </div>
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
                      {c.status === "PENDING" && isSuperAdmin && (
                        <button
                          onClick={() => handleApprove(c.id)}
                          className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition"
                        >
                          ✅ Approve
                        </button>
                      )}
                      {canEdit && (
                        <button
                          onClick={() => openEdit(c)}
                          className="bg-slate-800 hover:bg-slate-700 text-gray-300 border border-slate-700 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition"
                        >
                          ✏️ Edit
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            {filteredCampaigns.length === 0 && (
              <div className="text-center py-20 bg-slate-900/20 border border-slate-800 border-dashed rounded-2xl">
                <p className="text-gray-400 text-sm">No campaigns match your filters.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminCampaigns;
