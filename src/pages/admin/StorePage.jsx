import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import api from '../../api';
import { toast } from 'react-toastify';

const StorePage = () => {
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [remarks, setRemarks] = useState({});
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);

  const adminRole = localStorage.getItem("role");
  const adminTownship = localStorage.getItem("township") || "";

  const navigate = useNavigate();
  const [emergencyLogs, setEmergencyLogs] = useState([]);
  const [storedItems, setStoredItems] = useState([]);
  const [viewMode, setViewMode] = useState("PENDING"); // PENDING, STORED, LOGS

  // Filters for STORED items (Campaign Search instead of redundant Township)
  const [campaignSearch, setCampaignSearch] = useState("");
  const [monthFilter, setMonthFilter] = useState("ALL");
  const [exporting, setExporting] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Emergency Usage Form State
  const [emergencyForm, setEmergencyForm] = useState({
    itemName: "",
    township: adminTownship || "Yangon",
    quantityUsed: "",
    reasonDetails: "",
    proofPhotoUrl: "",
    usageDate: new Date().toISOString().slice(0, 16), // YYYY-MM-DDThh:mm
  });

  const fetchPendingStore = async () => {
    try {
      setLoading(true);
      const response = await api.get('/item-donations/admin/pending-store');
      let data = response.data;
      if (adminRole === "ROLE_SUB_ADMIN" && adminTownship) {
        data = data.filter(d => d.donorTownship === adminTownship);
      }
      setDonations(data);
    } catch (error) {
      console.error("Error fetching pending store items:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmergencyLogs = async () => {
    try {
      const response = await api.get('/stocks/emergency-logs');
      let data = response.data;
      if (adminRole === "ROLE_SUB_ADMIN" && adminTownship) {
        data = data.filter(d => d.township === adminTownship);
      }
      setEmergencyLogs(data);
    } catch (error) {
      console.error("Error fetching emergency logs:", error);
    }
  };

  const fetchStoredItems = async () => {
    try {
      const response = await api.get('/item-donations/admin/stored');
      let data = response.data;
      if (adminRole === "ROLE_SUB_ADMIN" && adminTownship) {
        data = data.filter(d => d.donorTownship === adminTownship);
      }
      setStoredItems(data);
    } catch (error) {
      console.error("Error fetching stored items:", error);
    }
  };

  useEffect(() => {
    fetchPendingStore();
    fetchEmergencyLogs();
    fetchStoredItems();
  }, []);

  const handleRemarkChange = (id, value) => {
    setRemarks(prev => ({ ...prev, [id]: value }));
  };

  const handleApproveAndStore = async (id) => {
    const itemRemarks = remarks[id] || "Verified and stored successfully";
    try {
      await api.post(`/item-donations/${id}/approve-and-store`, null, {
        params: { remarks: itemRemarks }
      });
      toast.success("📦 Item successfully stored in warehouse & stock updated!");
      fetchPendingStore();
      fetchStoredItems();
    } catch (error) {
      console.error("Error storing item:", error);
      toast.error(error.response?.data || "Failed to store item.");
    }
  };

  const handleEmergencySubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/stocks/emergency-usage', emergencyForm);
      toast.success("🚨 Emergency usage recorded and stock updated.");
      setShowEmergencyModal(false);
      setEmergencyForm({
        itemName: "",
        township: adminTownship || "Yangon",
        quantityUsed: "",
        reasonDetails: "",
        proofPhotoUrl: "",
        usageDate: new Date().toISOString().slice(0, 16)
      });
      fetchEmergencyLogs();
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to record emergency usage.");
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
        headers: { "Content-Type": "multipart/form-data" }
      });
      setEmergencyForm({ ...emergencyForm, proofPhotoUrl: res.data.url });
      toast.success("✅ Proof photo uploaded successfully!");
    } catch (err) {
      toast.error("Failed to upload image. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  // Helper to categorize item names into 5 main groups
  const categorizeItem = (itemName = "") => {
    const lower = itemName.toLowerCase();
    if (lower.includes("med") || lower.includes("ဆေး") || lower.includes("paracetamol") || lower.includes("vitamin")) return "MEDICINE";
    if (lower.includes("food") || lower.includes("rice") || lower.includes("ဆန်") || lower.includes("မုန့်") || lower.includes("oil")) return "FOOD";
    if (lower.includes("water") || lower.includes("ရေ") || lower.includes("juice")) return "WATER";
    if (lower.includes("cloth") || lower.includes("အဝတ်") || lower.includes("blanket") || lower.includes("စောင်") || lower.includes("shirt")) return "CLOTHING";
    return "OTHERS";
  };

  // Filter Stored Items by Campaign / Search & Month
  const filteredStoredItems = storedItems.filter((item) => {
    const searchMatch = !campaignSearch.trim() ||
      (item.campaign?.title || "").toLowerCase().includes(campaignSearch.toLowerCase()) ||
      (item.itemName || "").toLowerCase().includes(campaignSearch.toLowerCase());
    const monthMatch = monthFilter === "ALL" || (item.updatedAt && item.updatedAt.startsWith(monthFilter));
    return searchMatch && monthMatch;
  });

  const uniqueMonths = [...new Set(storedItems.map(i => i.updatedAt ? i.updatedAt.slice(0, 7) : "").filter(Boolean))].sort().reverse();

  const exportPDF = async () => {
    setExporting(true);
    try {
      const doc = new jsPDF("landscape");

      doc.setFontSize(20);
      doc.setTextColor(40, 40, 40);
      doc.text("Warehouse Inventory Report", 14, 20);

      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Exported By: ${localStorage.getItem("username") || "Admin"}`, 14, 28);
      doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, 34);
      doc.text(`Township: ${adminTownship || "All"}, Month: ${monthFilter}`, 14, 40);

      const tableColumn = ["ID", "Item Name", "Available", "Campaign", "Origin / Donor", "Stored Date", "Remarks"];
      const tableRows = [];

      filteredStoredItems.forEach((d) => {
        tableRows.push([
          d.id,
          d.itemName || "—",
          `${d.quantity || 0} ${d.unit || ""}`,
          d.campaign?.title || "General Relief",
          d.donor?.username || d.donor?.fullName || "Anonymous",
          d.updatedAt ? new Date(d.updatedAt).toLocaleDateString() : "—",
          d.conditionNotes || "—"
        ]);
      });

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 45,
        theme: 'striped',
        headStyles: { fillColor: [16, 185, 129] },
        styles: { fontSize: 9, cellPadding: 3 },
      });

      doc.save(`Warehouse_Inventory_${new Date().toISOString().split("T")[0]}.pdf`);
      toast.success("✅ PDF Exported Successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to export PDF.");
    } finally {
      setExporting(false);
    }
  };

  const categoryCards = [
    { key: "MEDICINE", title: "💊 Medicine / ဆေးဝါး", color: "border-blue-500/30 bg-blue-500/10 text-blue-400" },
    { key: "FOOD", title: "🍚 Food / စားနပ်ရိက္ခာ", color: "border-amber-500/30 bg-amber-500/10 text-amber-400" },
    { key: "WATER", title: "💧 Water / သောက်ရေသန့်", color: "border-cyan-500/30 bg-cyan-500/10 text-cyan-400" },
    { key: "CLOTHING", title: "🧥 Clothing & Blanket / အဝတ်အထည်", color: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400" },
    { key: "OTHERS", title: "📦 Others / အခြား ပစ္စည်းများ", color: "border-purple-500/30 bg-purple-500/10 text-purple-400" },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 text-emerald-400">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-emerald-400 mr-3" />
        <span>Loading warehouse items...</span>
      </div>
    );
  }

  return (
    <div className="p-6 bg-slate-950 min-h-screen text-slate-100 relative space-y-6">

      {/* Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900 border border-slate-800 p-6 rounded-3xl">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/admin/dashboard")}
            className="bg-slate-800 hover:bg-slate-700 text-xs border border-slate-700 px-3 py-2 rounded-xl transition cursor-pointer text-slate-300"
          >
            ← Back
          </button>
          <span className="text-3xl">🏬</span>
          <div>
            <h1 className="text-2xl font-bold text-emerald-400">Warehouse & Inventory Management</h1>
            <p className="text-xs text-slate-400">
              Township: <strong className="text-white">{adminTownship || "All Regions"}</strong> · Manage stored relief items & emergency usage
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="bg-slate-950 rounded-2xl p-1 flex border border-slate-800">
            <button
              onClick={() => setViewMode("PENDING")}
              className={`px-4 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer ${viewMode === "PENDING" ? "bg-emerald-500 text-slate-950 shadow-md" : "text-slate-400 hover:text-slate-200"}`}
            >
              📥 Pending ({donations.length})
            </button>
            <button
              onClick={() => setViewMode("STORED")}
              className={`px-4 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer ${viewMode === "STORED" ? "bg-blue-500 text-slate-950 shadow-md" : "text-slate-400 hover:text-slate-200"}`}
            >
              📦 Inventory ({storedItems.length})
            </button>
            <button
              onClick={() => setViewMode("LOGS")}
              className={`px-4 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer ${viewMode === "LOGS" ? "bg-amber-500 text-slate-950 shadow-md" : "text-slate-400 hover:text-slate-200"}`}
            >
              🕒 Emergency Logs ({emergencyLogs.length})
            </button>
          </div>

          <button
            onClick={() => setShowEmergencyModal(true)}
            className="bg-rose-600 hover:bg-rose-500 text-white text-xs px-4 py-2 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-rose-500/20 transition cursor-pointer"
          >
            🚨 Report Emergency Usage
          </button>
        </div>
      </div>

      {/* VIEW: LOGS */}
      {viewMode === "LOGS" ? (
        <div className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden shadow-xl">
          <div className="p-4 bg-slate-950/60 border-b border-slate-800">
            <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider">🕒 Emergency Usage History</h2>
          </div>
          {emergencyLogs.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-sm">No emergency logs recorded for this township.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 font-semibold text-xs uppercase">
                    <th className="p-4">Date & Time</th>
                    <th className="p-4">Item & Qty</th>
                    <th className="p-4">Township</th>
                    <th className="p-4">Reason & Proof</th>
                    <th className="p-4">Authorized By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-xs">
                  {emergencyLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-800/50 transition">
                      <td className="p-4 text-slate-300">
                        {new Date(log.usageDate).toLocaleString()}
                      </td>
                      <td className="p-4">
                        <div className="font-bold text-rose-400">{log.itemName}</div>
                        <div className="text-slate-400 font-mono mt-0.5">
                          Used: <span className="text-slate-200 font-bold">-{log.quantityUsed}</span>
                        </div>
                      </td>
                      <td className="p-4 text-slate-300">{log.township}</td>
                      <td className="p-4">
                        <div className="text-slate-300 italic text-xs max-w-xs bg-slate-950 p-2 rounded-xl border border-slate-800">
                          "{log.reasonDetails || "No reason provided"}"
                        </div>
                        {log.proofPhotoUrl && (
                          <a href={log.proofPhotoUrl} target="_blank" rel="noreferrer" className="text-[11px] text-blue-400 hover:underline mt-1 block">
                            🖼️ View Proof Photo
                          </a>
                        )}
                      </td>
                      <td className="p-4">
                        <span className="bg-slate-800 px-2 py-1 rounded-lg text-[11px] text-slate-300 border border-slate-700">
                          🛡️ {log.authorizedBy}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      /* VIEW: STORED INVENTORY (5 Category Cards View) */
      ) : viewMode === "STORED" ? (
        <div className="space-y-6">

          {/* Filters & Export */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex-1 w-full sm:w-auto">
              <input
                type="text"
                placeholder="🔍 Filter by Campaign Name or Item Name..."
                value={campaignSearch}
                onChange={(e) => setCampaignSearch(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-2xl px-4 py-2.5 text-xs text-white focus:outline-none"
              />
            </div>
            <div className="flex gap-3 w-full sm:w-auto justify-end">
              <select
                value={monthFilter}
                onChange={(e) => setMonthFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-2xl px-4 py-2 text-xs text-white focus:outline-none"
              >
                <option value="ALL">All Dates</option>
                {uniqueMonths.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
              <button
                onClick={exportPDF}
                disabled={exporting || filteredStoredItems.length === 0}
                className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold text-xs px-4 py-2.5 rounded-2xl transition cursor-pointer shadow-md shadow-emerald-500/20"
              >
                {exporting ? "Exporting..." : "📄 Export PDF"}
              </button>
            </div>
          </div>

          {/* 📦 5 CATEGORY CARDS GRID */}
          <div className="grid lg:grid-cols-2 gap-6">
            {categoryCards.map((card) => {
              const categoryItems = filteredStoredItems.filter(
                (item) => categorizeItem(item.itemName) === card.key
              );

              return (
                <div key={card.key} className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
                  {/* Card Header */}
                  <div className={`p-4 border-b flex justify-between items-center ${card.color}`}>
                    <h3 className="text-sm font-bold">{card.title}</h3>
                    <span className="text-xs font-mono font-bold bg-slate-950/60 px-2.5 py-1 rounded-full">
                      {categoryItems.length} entries
                    </span>
                  </div>

                  {/* Items List inside Category */}
                  {categoryItems.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-500 italic">
                      No items currently stored in this category.
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-800/80 max-h-72 overflow-y-auto">
                      {categoryItems.map((item) => (
                        <div key={item.id} className="p-4 hover:bg-slate-800/50 transition flex justify-between items-start gap-4">
                          <div className="space-y-1">
                            <h4 className="text-sm font-bold text-white">{item.itemName}</h4>
                            <p className="text-xs text-slate-400">
                              Campaign: <strong className="text-teal-300">{item.campaign?.title || "General Relief"}</strong>
                            </p>
                            <p className="text-[11px] text-slate-500">
                              Donor: {item.donor?.fullName || item.donor?.username || "Anonymous"} · 📍 {item.donorTownship || "—"}
                            </p>
                          </div>

                          <div className="text-right space-y-1">
                            <span className="text-sm font-bold text-emerald-400 font-mono block">
                              {item.quantity} {item.unit}
                            </span>
                            <span className="text-[10px] text-slate-500 block">
                              Stored: {item.updatedAt ? new Date(item.updatedAt).toLocaleDateString() : "—"}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      /* VIEW: PENDING STORE DONATIONS */
      ) : (
        <div className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden shadow-xl">
          <div className="p-4 bg-slate-950/60 border-b border-slate-800">
            <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
              📥 Items Waiting to be Stored in Warehouse
            </h2>
          </div>

          {donations.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-sm">
              🎉 No pending items waiting for warehouse storage at the moment.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 font-semibold text-xs uppercase">
                    <th className="p-4">Item Details</th>
                    <th className="p-4">Donor Information</th>
                    <th className="p-4">Collected / Handover</th>
                    <th className="p-4">Notes / Photo</th>
                    <th className="p-4">Storage Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-xs">
                  {donations.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-800/50 transition">
                      <td className="p-4">
                        <div className="font-bold text-emerald-400 text-sm">{item.itemName}</div>
                        <div className="text-slate-400 mt-0.5">
                          Quantity: <strong className="text-white font-mono">{item.quantity} {item.unit}</strong>
                        </div>
                        <span className="inline-block mt-1 text-[10px] bg-slate-800 border border-slate-700 text-slate-300 px-2 py-0.5 rounded-md font-semibold">
                          Condition: {item.condition}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="text-slate-200 font-semibold">{item.donor?.fullName || item.donor?.username || "Anonymous"}</div>
                        <div className="text-teal-400 font-mono mt-0.5">📞 {item.donorPhone}</div>
                        <div className="text-slate-400 text-[11px] mt-0.5">📍 {item.donorTownship}</div>
                      </td>
                      <td className="p-4">
                        <div className="text-slate-300 font-semibold">
                          {item.assignedVolunteer ? `✏️ ${item.assignedVolunteer.fullName}` : "🏢 Self Drop-off"}
                        </div>
                        <span className="text-[10px] text-slate-500 block mt-0.5">
                          Type: {item.handoverType}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="text-slate-300 italic text-[11px] max-w-xs bg-slate-950 p-2 rounded-xl border border-slate-800">
                          "{item.volunteerNote || "No remarks"}"
                        </div>
                        {(item.volunteerConfirmPhoto || item.itemPhotoUrl) && (
                          <a href={item.volunteerConfirmPhoto || item.itemPhotoUrl} target="_blank" rel="noreferrer" className="text-[11px] text-blue-400 hover:underline mt-1 block">
                            🖼️ View Proof Photo
                          </a>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col gap-2 max-w-xs">
                          <input
                            type="text"
                            placeholder="Storage Remarks / Shelf location..."
                            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                            value={remarks[item.id] || ""}
                            onChange={(e) => handleRemarkChange(item.id, e.target.value)}
                          />
                          <button
                            onClick={() => handleApproveAndStore(item.id)}
                            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs py-2 px-3 rounded-xl transition cursor-pointer shadow-md shadow-emerald-500/20 flex items-center justify-center gap-1"
                          >
                            📥 Approve & Store
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Emergency Usage Modal */}
      {showEmergencyModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-rose-400">🚨 Report Emergency Usage</h3>
            <p className="text-xs text-slate-400">Record items dispatched directly from warehouse for disaster relief.</p>

            <form onSubmit={handleEmergencySubmit} className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Item Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Medicine, Rice"
                  value={emergencyForm.itemName}
                  onChange={(e) => setEmergencyForm({ ...emergencyForm, itemName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Quantity Used *</label>
                <input
                  type="number"
                  required
                  min="0.1"
                  step="any"
                  placeholder="e.g. 50"
                  value={emergencyForm.quantityUsed}
                  onChange={(e) => setEmergencyForm({ ...emergencyForm, quantityUsed: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Reason Details *</label>
                <textarea
                  required
                  rows={2}
                  placeholder="Reason for emergency usage..."
                  value={emergencyForm.reasonDetails}
                  onChange={(e) => setEmergencyForm({ ...emergencyForm, reasonDetails: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none resize-none"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Proof Photo (Optional)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="block w-full text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:bg-slate-800 file:text-slate-300"
                />
                {uploading && <span className="text-[10px] text-teal-400">Uploading photo...</span>}
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEmergencyModal(false)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-2.5 rounded-xl text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-rose-600 hover:bg-rose-500 text-white font-bold py-2.5 rounded-xl text-xs cursor-pointer shadow-lg shadow-rose-500/20"
                >
                  Record Usage
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StorePage;
