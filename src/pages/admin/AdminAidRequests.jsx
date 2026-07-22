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

const STATUS_FILTERS = [
  "ALL",
  "PENDING",
  "VERIFIED",
  "IN_PROGRESS",
  "RESOLVED",
  "REJECTED",
];

const statusColor = (status) => {
  switch (status) {
    case "VERIFIED":
      return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
    case "IN_PROGRESS":
      return "text-blue-400 bg-blue-500/10 border-blue-500/20";
    case "RESOLVED":
      return "text-gray-400 bg-gray-500/10 border-gray-500/20";
    case "REJECTED":
      return "text-rose-400 bg-rose-500/10 border-rose-500/20";
    default:
      return "text-amber-400 bg-amber-500/10 border-amber-500/20";
  }
};

const categoryEmoji = (cat) => {
  const map = {
    FOOD: "🍚",
    MEDICINE: "💊",
    WATER: "💧",
    CLOTHING: "👕",
    SHELTER: "🏠",
    OTHER: "📦",
  };
  return map[cat] || "📦";
};

function AdminAidRequests() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [actionLoading, setActionLoading] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [search, setSearch] = useState("");
  const [filterTownship, setFilterTownship] = useState("");
  const [filterMonth, setFilterMonth] = useState("");
  const [exporting, setExporting] = useState(false);
  const [resolveModalReq, setResolveModalReq] = useState(null);
  const [resolvePhotoUrl, setResolvePhotoUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [availableStocks, setAvailableStocks] = useState([]);
  const [deductions, setDeductions] = useState([]);

  // ── fetch ──────────────────────────────────────────────
  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await api.get("/aid-requests");
      setRequests(res.data);
    } catch {
      setError("Failed to load aid requests.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  // ── actions ────────────────────────────────────────────
  const openResolveModal = async (req) => {
    setResolveModalReq(req);
    setResolvePhotoUrl("");
    setDeductions([]);
    try {
      const res = await api.get(`/stocks?township=${encodeURIComponent(req.township)}`);
      setAvailableStocks(res.data);
    } catch {
      setError("Failed to load stocks for township.");
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await api.post("/upload", formData);
      setResolvePhotoUrl(res.data.url);
    } catch {
      setError("Failed to upload image.");
    } finally {
      setUploading(false);
    }
  };

  const handleResolveSubmit = async () => {
    if (!resolvePhotoUrl.trim()) {
      alert("A proof photo is required to resolve this request.");
      return;
    }
    
    // validate deductions
    for (let d of deductions) {
      if (d.quantity <= 0) {
        alert("Quantity must be greater than 0.");
        return;
      }
      const stock = availableStocks.find(s => s.id === d.stockId);
      if (stock && d.quantity > stock.quantity) {
        alert(`Cannot deduct ${d.quantity} from ${stock.itemName} (Only ${stock.quantity} available)`);
        return;
      }
    }

    setActionLoading(`${resolveModalReq.id}-RESOLVED`);
    try {
      await api.post(`/aid-requests/${resolveModalReq.id}/resolve`, {
        proofPhotoUrl: resolvePhotoUrl,
        deductions: deductions
      });
      setMessage(`✅ Request #${resolveModalReq.id} marked as RESOLVED and stock deducted`);
      setResolveModalReq(null);
      fetchRequests();
      setTimeout(() => setMessage(""), 4000);
    } catch (err) {
      setError(err.response?.data || "Failed to resolve request.");
    } finally {
      setActionLoading(null);
    }
  };

  const updateStatus = async (id, status) => {
    let proofUrl = "";
    if (status === "RESOLVED") {
      const url = prompt("Please provide a photo URL as proof of delivery/resolution:");
      if (url === null) return; // User cancelled
      if (!url.trim()) {
        alert("A proof photo is required to resolve this request.");
        return;
      }
      proofUrl = url.trim();
    }

    setActionLoading(`${id}-${status}`);
    try {
      await api.patch(`/aid-requests/${id}/status`, null, {
        params: { status, proofPhotoUrl: proofUrl }
      });
      setMessage(`✅ Request #${id} marked as ${status}`);
      fetchRequests();
      setTimeout(() => setMessage(""), 4000);
    } catch (err) {
      setError(err.response?.data || "Failed to update status.");
    } finally {
      setActionLoading(null);
    }
  };

  // ── filter ─────────────────────────────────────────────
  const filtered = requests.filter((r) => {
    const statusMatch = selectedStatus === "ALL" || r.status === selectedStatus;
    const searchMatch =
      search === "" ||
      r.title?.toLowerCase().includes(search.toLowerCase()) ||
      r.reporter?.username?.toLowerCase().includes(search.toLowerCase());
    const townMatch = filterTownship === "" || r.township === filterTownship;
    const monthMatch = filterMonth === "" || (r.createdAt && r.createdAt.startsWith(filterMonth));
    return statusMatch && searchMatch && townMatch && monthMatch;
  });

  const pendingCount = requests.filter((r) => r.status === "PENDING").length;

  const exportPDF = () => {
    setExporting(true);
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Aid Requests Report", 14, 20);
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleString()} | Total: ${filtered.length} requests`, 14, 28);
    if (filterTownship || search || filterMonth) {
      doc.text(`Filters - Township: ${filterTownship || "All"}, Search: ${search || "None"}, Month: ${filterMonth || "All"}`, 14, 34);
    }

    const tableColumn = ["ID", "Title", "Township", "Categories", "Status", "Reporter", "Date"];
    const tableRows = filtered.map(r => [
      r.id,
      r.title,
      r.township || "—",
      r.categories ? r.categories.join(", ") : "—",
      r.status,
      r.reporter?.username || "—",
      r.createdAt ? new Date(r.createdAt).toLocaleDateString() : "—"
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: (filterTownship || search || filterMonth) ? 40 : 35,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [244, 63, 94] },
    });

    doc.save(`AidRequests_Report_${Date.now()}.pdf`);
    setExporting(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 border-b border-slate-800 pb-5">
          <div>
            <h1 className="text-2xl font-black bg-gradient-to-r from-rose-400 to-orange-400 bg-clip-text text-transparent">
              🆘 Aid Request Management
            </h1>
            <p className="text-xs text-gray-400 mt-1">
              {filtered.length} request{filtered.length !== 1 ? "s" : ""} shown
              {pendingCount > 0 && (
                <span className="ml-2 text-amber-400 animate-pulse font-mono">
                  · {pendingCount} pending review
                </span>
              )}
            </p>
          </div>
          <div className="flex gap-2 self-start">
            <button
              onClick={exportPDF}
              disabled={exporting || filtered.length === 0}
              className="bg-slate-900 hover:bg-slate-800 text-xs border border-slate-700 px-4 py-2 rounded-xl text-gray-300 font-semibold cursor-pointer transition disabled:opacity-50 flex items-center gap-2"
            >
              📄 {exporting ? "Exporting..." : "Export PDF"}
            </button>
            <button
              onClick={() => navigate("/admin/dashboard")}
              className="bg-slate-900 hover:bg-slate-800 text-xs border border-slate-800 px-4 py-2 rounded-xl transition cursor-pointer"
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>

        {/* Resolve Modal */}
        {resolveModalReq && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-bold text-slate-200 mb-2">✅ Resolve Request</h3>
              <p className="text-xs text-slate-400 mb-4">Provide proof photo and optional stock deductions for {resolveModalReq.township}.</p>
              
              <div className="mb-4">
                <label className="text-[11px] text-gray-500 font-bold mb-1 block">Proof Photo *</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-gray-500/10 file:text-gray-300 hover:file:bg-gray-500/20 transition cursor-pointer mb-2"
                />
                {uploading && <span className="text-xs text-blue-400 animate-pulse">Uploading...</span>}
                {resolvePhotoUrl && (
                  <div className="mt-3 relative w-full h-32 rounded-xl overflow-hidden border border-slate-700">
                    <img src={resolvePhotoUrl} alt="Proof" className="w-full h-full object-cover" />
                    <button 
                      type="button"
                      onClick={() => setResolvePhotoUrl("")}
                      className="absolute top-2 right-2 bg-rose-500/80 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-rose-500 transition"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>

              <div className="mb-6 p-4 bg-slate-950 rounded-xl border border-slate-800">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-[11px] text-gray-400 font-bold">Stock Deductions (Optional)</label>
                  <button
                    type="button"
                    onClick={() => setDeductions([...deductions, { stockId: "", quantity: 1 }])}
                    className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded hover:bg-emerald-500/30 transition cursor-pointer"
                  >
                    + Add Item
                  </button>
                </div>
                
                {deductions.map((d, idx) => (
                  <div key={idx} className="flex items-center gap-2 mb-2">
                    <select
                      value={d.stockId}
                      onChange={(e) => {
                        const newDeds = [...deductions];
                        newDeds[idx].stockId = Number(e.target.value);
                        setDeductions(newDeds);
                      }}
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white"
                    >
                      <option value="">Select item...</option>
                      {availableStocks.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.itemName} (Avail: {s.quantity} {s.unit})
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min="0.1"
                      step="0.1"
                      value={d.quantity}
                      onChange={(e) => {
                        const newDeds = [...deductions];
                        newDeds[idx].quantity = Number(e.target.value);
                        setDeductions(newDeds);
                      }}
                      className="w-20 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white text-center"
                    />
                    <button
                      onClick={() => setDeductions(deductions.filter((_, i) => i !== idx))}
                      className="text-rose-400 hover:text-rose-300 px-2 text-xs cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                {deductions.length === 0 && <p className="text-[10px] text-gray-500 italic">No items deducted.</p>}
              </div>

              <div className="flex gap-2">
                <button 
                  onClick={() => { setResolveModalReq(null); setResolvePhotoUrl(""); }}
                  className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-semibold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleResolveSubmit}
                  disabled={!resolvePhotoUrl || uploading}
                  className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 rounded-lg text-sm font-bold text-white transition cursor-pointer"
                >
                  Confirm & Resolve
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Messages */}
        {message && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 rounded-xl text-sm text-center">
            {message}
          </div>
        )}
        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3 rounded-xl text-sm text-center">
            {error}
            <button
              onClick={() => setError("")}
              className="ml-2 underline cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* Search + Filter */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
          <div className="flex flex-wrap gap-2 mb-4 border-b border-slate-800 pb-4">
            {STATUS_FILTERS.map((s) => (
              <button
                key={s}
                onClick={() => setSelectedStatus(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                  selectedStatus === s
                    ? "bg-rose-500 text-slate-950 border-rose-500"
                    : "bg-slate-900 text-gray-400 border-slate-800 hover:border-slate-600"
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[150px]">
              <label className="text-[10px] text-gray-500 uppercase tracking-wider">Township</label>
              <select
                value={filterTownship}
                onChange={(e) => setFilterTownship(e.target.value)}
                className="w-full mt-1 bg-slate-950 border border-slate-800 focus:border-rose-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
              >
                <option value="">All Townships</option>
                {myanmarTownships.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="flex-1 min-w-[150px]">
              <label className="text-[10px] text-gray-500 uppercase tracking-wider">Search</label>
              <input
                type="text"
                placeholder="Title or username..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full mt-1 bg-slate-950 border border-slate-800 focus:border-rose-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
              />
            </div>
            <div className="flex-1 min-w-[150px]">
              <label className="text-[10px] text-gray-500 uppercase tracking-wider">Month</label>
              <input
                type="month"
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
                className="w-full mt-1 bg-slate-950 border border-slate-800 focus:border-rose-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
              />
            </div>
            <button
              onClick={() => { setFilterTownship(""); setSearch(""); setFilterMonth(""); }}
              className="bg-slate-800 hover:bg-slate-700 text-gray-300 border border-slate-700 px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition"
            >
              Clear
            </button>
          </div>
        </div>

        {/* List */}
        {loading ? (
          <div className="text-center py-16 text-rose-400 animate-pulse text-sm">
            Loading aid requests...
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((req) => (
              <div
                key={req.id}
                className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition space-y-3"
              >
                {/* Top row */}
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">
                      {req.categories?.map((c) => categoryEmoji(c)).join("") ||
                        "📦"}
                    </span>
                    <div>
                      <h3 className="font-bold text-white text-sm">
                        {req.title}
                      </h3>
                      <p className="text-[11px] text-gray-500 font-mono">
                        📍 {req.township}, {req.wardOrVillage}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-mono border self-start ${statusColor(req.status)}`}
                  >
                    {req.status}
                  </span>
                </div>

                {/* Categories */}
                <div className="flex flex-wrap gap-1">
                  {req.categories?.map((cat) => (
                    <span
                      key={cat}
                      className="px-2 py-0.5 bg-slate-800 text-gray-300 rounded text-[10px] font-mono"
                    >
                      {categoryEmoji(cat)} {cat}
                    </span>
                  ))}
                </div>

                {/* Description */}
                <p className="text-xs text-gray-400 leading-relaxed">
                  {req.description}
                </p>

                {/* Meta */}
                <div className="flex flex-wrap items-center gap-4 text-[11px] text-gray-500">
                  <span>📞 {req.contactPhone}</span>
                  <span>👤 {req.reporter?.username || "Anonymous"}</span>
                  <span>
                    🕐{" "}
                    {req.createdAt
                      ? new Date(req.createdAt).toLocaleDateString()
                      : "—"}
                  </span>
                  <span>👍 {req.upvoteCount || 0} upvotes</span>
                  {req.proofPhotoUrl && (
                    <a href={req.proofPhotoUrl} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">
                      🖼️ View Proof Photo
                    </a>
                  )}
                </div>

                {/* Admin Actions */}
                {req.status === "PENDING" && (
                  <div className="flex flex-wrap gap-2 pt-1 border-t border-slate-800">
                    <button
                      disabled={actionLoading !== null}
                      onClick={() => updateStatus(req.id, "VERIFIED")}
                      className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-1.5 rounded-lg text-xs transition cursor-pointer disabled:opacity-40"
                    >
                      {actionLoading === `${req.id}-VERIFIED`
                        ? "..."
                        : "✔ Verify & Notify Volunteers"}
                    </button>
                    <button
                      disabled={actionLoading !== null}
                      onClick={() => updateStatus(req.id, "REJECTED")}
                      className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 font-bold px-4 py-1.5 rounded-lg text-xs transition cursor-pointer disabled:opacity-40"
                    >
                      {actionLoading === `${req.id}-REJECTED`
                        ? "..."
                        : "❌ Reject"}
                    </button>
                  </div>
                )}

                {req.status === "VERIFIED" && (
                  <div className="flex flex-wrap gap-2 pt-1 border-t border-slate-800">
                    <div className="flex items-center gap-2 text-xs text-teal-400 bg-teal-500/10 border border-teal-500/20 px-3 py-1.5 rounded-lg">
                      <span>⏳</span>
                      <span>Waiting for Volunteer to Accept</span>
                    </div>
                    <button
                      disabled={actionLoading !== null}
                      onClick={() => openResolveModal(req)}
                      className="bg-gray-500 hover:bg-gray-400 text-white font-bold px-4 py-1.5 rounded-lg text-xs transition cursor-pointer disabled:opacity-40"
                    >
                      {actionLoading === `${req.id}-RESOLVED`
                        ? "..."
                        : "✅ Mark Resolved"}
                    </button>
                  </div>
                )}

                {req.status === "IN_PROGRESS" && (
                  <div className="flex flex-wrap gap-2 pt-1 border-t border-slate-800">
                    <button
                      disabled={actionLoading !== null}
                      onClick={() => openResolveModal(req)}
                      className="bg-gray-500 hover:bg-gray-400 text-white font-bold px-4 py-1.5 rounded-lg text-xs transition cursor-pointer disabled:opacity-40"
                    >
                      {actionLoading === `${req.id}-RESOLVED`
                        ? "..."
                        : "✅ Mark Resolved"}
                    </button>
                  </div>
                )}
              </div>
            ))}

            {filtered.length === 0 && !loading && (
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

export default AdminAidRequests;
