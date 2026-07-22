import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { YANGON_TOWNSHIPS } from "../../constants";

function DonationApprovals() {
  const navigate = useNavigate();
  const [donations, setDonations] = useState([]);
  const [volunteers, setVolunteers] = useState([]); // 💡 Volunteer စာရင်းသိမ်းရန်
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [actionLoading, setActionLoading] = useState(null);
  const [tab, setTab] = useState("PENDING"); // PENDING | ALL
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [townshipFilter, setTownshipFilter] = useState("ALL");
  const [monthFilter, setMonthFilter] = useState("ALL");
  const [exporting, setExporting] = useState(false);
  const [assignModalItem, setAssignModalItem] = useState(null); // ID of item donation being assigned
  const [selectedVolunteerId, setSelectedVolunteerId] = useState("");

  // ── fetch Data ──────────────────────────────────────────
  const fetchDonations = async () => {
    setLoading(true);
    try {
      // 💡 API သုံးခုလုံးကို တစ်ပြိုင်နက် ခေါ်ယူလိုက်ပါတယ် (Money, Items, Volunteers)
      const [moneyRes, itemRes, volunteersRes] = await Promise.all([
        api.get("/donations"),
        api.get("/item-donations"),
        api.get("/users/volunteers"),
      ]);

      // Item donation ရဲ့ status တွေကို Backend အတိုင်း ညှိယူခြင်း
      const normalizedItems = itemRes.data.map((d) => {
        let uiStatus = d.status;
        if (d.status === "PENDING_ADMIN") uiStatus = "PENDING";
        else if (d.status === "ADMIN_REJECTED" || d.status === "VOLUNTEER_REJECTED") uiStatus = "REJECTED";
        else if (d.status === "STORED_IN_STOCK") uiStatus = "STORED";
        
        return {
          ...d,
          donationType: "ITEMS",
          amount: null,
          status: uiStatus,
          _originalStatus: d.status,
          donatedAt: d.createdAt,
          proofImageUrl: d.itemPhotoUrl,
          _isItemDonation: true,
        };
      });

      setDonations([...moneyRes.data, ...normalizedItems]);
      setVolunteers(volunteersRes.data || []);
    } catch {
      setError("Failed to load donations and volunteers.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDonations();
  }, []);

  const showMsg = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(""), 4000);
  };

  // ── အတည်ပြုခြင်းအပိုင်း (Approve & Assign) ───────────────────
  const handleConfirm = async (id, isItem) => {
    setActionLoading(`confirm-${id}`);
    try {
      if (isItem) {
        // Open clean Modal instead of browser prompt!
        setAssignModalItem(id);
        setSelectedVolunteerId("");
        setActionLoading(null);
        return;
      } else {
        // 💰 MONEY DONATION ဖြစ်ခဲ့ရင် ပုံမှန်အတိုင်း တိုက်ရိုက် Approve လုပ်မယ်
        await api.patch(`/donations/${id}/confirm`);
        showMsg("✅ Money Donation Approved!");
      }
      fetchDonations();
    } catch (err) {
      setError(err.response?.data || "Failed to approve donation.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleManualAssign = async () => {
    if (!selectedVolunteerId) {
      alert("Please select a volunteer from the list.");
      return;
    }
    setActionLoading(`assign-${assignModalItem}`);
    try {
      await api.patch(`/item-donations/${assignModalItem}/approve?volunteerId=${selectedVolunteerId}`);
      showMsg("✅ Item Donation Approved and Volunteer Assigned!");
      setAssignModalItem(null);
      fetchDonations();
    } catch (err) {
      alert("Failed to assign volunteer: " + (err.response?.data || err.message));
    } finally {
      setActionLoading(null);
    }
  };

  const handleAutoAssign = async () => {
    setActionLoading(`assign-${assignModalItem}`);
    try {
      await api.post(`/item-donations/${assignModalItem}/auto-assign`);
      showMsg("⚡ Auto-assigned to nearest available volunteer!");
      setAssignModalItem(null);
      fetchDonations();
    } catch (err) {
      alert("Auto-assign failed: " + (err.response?.data || err.message));
    } finally {
      setActionLoading(null);
    }
  };

  // ── ငြင်းပယ်ခြင်းအပိုင်း (Reject) ─────────────────────────────
  const handleReject = async (id, isItem) => {
    setActionLoading(`reject-${id}`);
    try {
      if (isItem) {
        // 💡 Item ဖြစ်ရင် အကြောင်းပြချက် မေးပြီး ပထမဖိုင်က admin-reject သုံးမယ်
        const reason = prompt("Please enter reject reason for this item:");
        if (!reason) {
          setActionLoading(null);
          return;
        }
        await api.patch(`/item-donations/${id}/admin-reject`, { reason });
      } else {
        // 💰 Money ဖြစ်ရင် ပုံမှန်အတိုင်း Reject လုပ်မယ်
        await api.patch(`/donations/${id}/reject`);
      }
      showMsg("❌ Donation rejected successfully.");
      fetchDonations();
    } catch (err) {
      setError(err.response?.data || "Failed to reject donation.");
    } finally {
      setActionLoading(null);
    }
  };

  // ── Filter & Search Logic ──────────────────────────────
  const filtered = donations.filter((d) => {
    const tabMatch = tab === "PENDING" ? d.status === "PENDING" : true;
    const statusMatch = statusFilter === "ALL" || d.status === statusFilter;
    
    // Township logic (Money doesn't have donorTownship easily exposed here unless mapped in donor, fallback to ALL if money)
    const itemTownship = d.donorTownship || (d.donor?.township) || "";
    const townshipMatch = townshipFilter === "ALL" || itemTownship === townshipFilter;

    // Date logic (YYYY-MM)
    const monthMatch = monthFilter === "ALL" || (d.donatedAt && d.donatedAt.startsWith(monthFilter));

    const searchMatch =
      search === "" ||
      d.donor?.username?.toLowerCase().includes(search.toLowerCase()) ||
      d.campaign?.title?.toLowerCase().includes(search.toLowerCase()) ||
      (d.itemName && d.itemName.toLowerCase().includes(search.toLowerCase()));

    return tabMatch && statusMatch && townshipMatch && monthMatch && searchMatch;
  });

  const pendingCount = donations.filter((d) => d.status === "PENDING").length;

  // Get unique months for filter
  const uniqueMonths = [...new Set(donations.map(d => d.donatedAt ? d.donatedAt.slice(0, 7) : "").filter(Boolean))].sort().reverse();


const exportPDF = async () => {
    setExporting(true);

    // 1. PDF Instance အသစ်ဖန်တီးခြင်း
    const doc = new jsPDF();

    // 2. ခေါင်းစဉ်နှင့် အချက်အလက်များ
    doc.setFontSize(18);
    doc.text("Donation History Report", 14, 20);
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleString()} | Total: ${filtered.length} records`, 14, 28);

    // 3. Table Column များ
    const tableColumn = ["#ID", "Donor", "Campaign", "Type", "Contribution", "Date", "Status"];

    // 4. Table Row များ (ညီလေးရဲ့ logic အတိုင်း)
    const tableRows = filtered.map(d => [
      d.id,
      d.donor?.username || "Anonymous",
      d.campaign?.title || "—",
      d.donationType,
      d.donationType === "MONEY"
        ? Number(d.amount).toLocaleString() + " MMK"
        : `${d.itemName} (${d.quantity} ${d.unit})`,
      d.donatedAt ? new Date(d.donatedAt).toLocaleDateString() : "—",
      d.status
    ]);

    // 5. AutoTable သုံးပြီး PDF ထဲ ထည့်ခြင်း
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 35,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [15, 118, 110] }, // ညီလေးရဲ့ အရောင် (emerald-800)
    });

    // 6. တိုက်ရိုက် Download ချခြင်း
    doc.save("Donation_History_Report.pdf");

    setExporting(false);
  };

  const statusBadge = (status) => {
    switch (status) {
      case "CONFIRMED":
      case "APPROVED":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "STORED":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      case "REJECTED":
        return "bg-rose-500/10 text-rose-400 border-rose-500/20";
      default:
        return "bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse";
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 border-b border-slate-800 pb-5">
          <div>
            <h1 className="text-2xl font-black bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
              💳 Donation Management Center
            </h1>
            <p className="text-xs text-gray-400 mt-1">
              {pendingCount > 0 && (
                <span className="text-amber-400 animate-pulse font-mono">
                  {pendingCount} pending ·{" "}
                </span>
              )}
              {donations.length} total entries
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={exportPDF}
              disabled={exporting || filtered.length === 0}
              className="bg-slate-800 hover:bg-slate-700 text-gray-300 border border-slate-700 text-xs px-4 py-2 rounded-xl transition cursor-pointer disabled:opacity-40 font-semibold"
            >
              {exporting ? "Exporting..." : "📄 Export PDF"}
            </button>
            <button
              onClick={() => navigate("/admin/dashboard")}
              className="bg-slate-900 hover:bg-slate-800 text-xs border border-slate-800 px-4 py-2 rounded-xl transition cursor-pointer"
            >
              ← Dashboard
            </button>
          </div>
        </div>

        {/* Alerts */}
        {message && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 rounded-xl text-sm text-center">
            {message}
          </div>
        )}
        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3 rounded-xl text-sm text-center flex justify-between items-center">
            <span>{error}</span>
            <button onClick={() => setError("")} className="ml-2 underline font-bold cursor-pointer">✕</button>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-3">
          {[
            {
              key: "PENDING",
              label: `⏳ Pending Review${pendingCount > 0 ? ` (${pendingCount})` : ""}`,
            },
            { key: "ALL", label: "📋 All History" },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => {
                setTab(t.key);
                setStatusFilter("ALL");
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                tab === t.key
                  ? "bg-emerald-500 text-slate-950 border-emerald-500"
                  : "bg-slate-900 text-gray-400 border-slate-800 hover:border-slate-600"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
          <input
            type="text"
            placeholder="Search donor, campaign, or item..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 min-w-[200px] bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none"
          />
          {tab === "ALL" && (
            <>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none"
              >
                <option value="ALL">All Status</option>
                <option value="PENDING">PENDING</option>
                <option value="CONFIRMED">CONFIRMED</option>
                <option value="REJECTED">REJECTED</option>
                <option value="STORED">STORED</option>
              </select>
              <select
                value={townshipFilter}
                onChange={(e) => setTownshipFilter(e.target.value)}
                className="bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none"
              >
                <option value="ALL">All Townships</option>
                {YANGON_TOWNSHIPS.map((t) => (
                  <option key={t.en} value={t.en}>{t.en}</option>
                ))}
              </select>
              <select
                value={monthFilter}
                onChange={(e) => setMonthFilter(e.target.value)}
                className="bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none"
              >
                <option value="ALL">All Dates</option>
                {uniqueMonths.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </>
          )}
        </div>

        {/* Data Table */}
        {loading ? (
          <div className="text-center py-16 text-emerald-400 animate-pulse text-sm">
            Synchronizing records...
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-slate-900/20 border border-slate-800 border-dashed rounded-2xl">
            <p className="text-gray-400 text-sm">No records matching criteria.</p>
          </div>
        ) : (
          <div className="bg-slate-900/30 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/60 text-[10px] uppercase font-mono tracking-wider text-gray-400">
                    <th className="p-4">#ID</th>
                    <th className="p-4">Donor</th>
                    <th className="p-4">Campaign</th>
                    <th className="p-4">Type</th>
                    <th className="p-4">Contribution Details</th>
                    <th className="p-4">Evidence</th>
                    <th className="p-4">Submitted Date</th>
                    <th className="p-4 text-center">Status</th>
                    <th className="p-4 text-center">Action Panel</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50 text-xs text-gray-300">
                  {filtered.map((d) => (
                    <tr
                      key={d._isItemDonation ? `item-${d.id}` : `money-${d.id}`}
                      className="hover:bg-slate-900/20 transition"
                    >
                      <td className="p-4 font-mono text-gray-500">#{d.id}</td>
                      <td className="p-4 font-bold text-white">
                        {d.donor?.username || "Anonymous"}
                      </td>
                      <td className="p-4 max-w-[160px] truncate text-gray-300">
                        {d.campaign?.title || `Campaign #${d.campaignId || 'General'}`}
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                            d.donationType === "MONEY"
                              ? "bg-emerald-500/10 text-emerald-400"
                              : "bg-blue-500/10 text-blue-400"
                          }`}
                        >
                          {d.donationType}
                        </span>
                      </td>
                      <td className="p-4">
                        {d.donationType === "MONEY" ? (
                          <span className="font-bold text-emerald-400 font-mono">
                            {Number(d.amount).toLocaleString()} MMK
                          </span>
                        ) : (
                          <span className="text-blue-300 font-medium">
                            📦 {d.itemName} ({d.quantity} {d.unit})
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        {d.proofImageUrl ? (
                          <a
                            href={d.proofImageUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-teal-400 hover:underline font-mono text-[11px]"
                          >
                            🖼️ View Attachment
                          </a>
                        ) : (
                          <span className="text-gray-600">—</span>
                        )}
                      </td>
                      <td className="p-4 text-gray-400 font-mono">
                        {d.donatedAt ? new Date(d.donatedAt).toLocaleDateString() : "—"}
                      </td>
                      <td className="p-4 text-center">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-black font-mono border ${statusBadge(d.status)}`}
                        >
                          {d.status}
                        </span>
                      </td>
                      <td className="p-4">
                        {d.status === "PENDING" ? (
                          <div className="flex gap-2 justify-center">
                            <button
                              disabled={actionLoading !== null}
                              onClick={() => handleReject(d.id, d._isItemDonation)}
                              className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 font-bold py-1.5 px-3 rounded-lg text-[10px] transition cursor-pointer disabled:opacity-40"
                            >
                              {actionLoading === `reject-${d.id}` ? "..." : "❌ Reject"}
                            </button>
                            <button
                              disabled={actionLoading !== null}
                              onClick={() => handleConfirm(d.id, d._isItemDonation)}
                              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-1.5 px-3 rounded-lg text-[10px] transition cursor-pointer disabled:opacity-40"
                            >
                              {actionLoading === `confirm-${d.id}`
                                ? "..."
                                : d._isItemDonation
                                ? "✔ Assign & Approve"
                                : "✔ Approve"}
                            </button>
                          </div>
                        ) : (
                          <span className="text-gray-600 text-[10px] text-center block">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-3 border-t border-slate-800 text-[10px] text-gray-500 font-mono">
              Showing {filtered.length} of {donations.length} total entries
            </div>
          </div>
        )}
      </div>

      {/* 🤝 Assign Volunteer Modal */}
      {assignModalItem && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-5 shadow-2xl">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-bold text-teal-400">🤝 Assign Volunteer</h3>
                <p className="text-xs text-slate-400">Item Donation #{assignModalItem}</p>
              </div>
              <button
                onClick={() => setAssignModalItem(null)}
                className="text-slate-400 hover:text-white text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Option 1: Auto Assign */}
            <div className="bg-slate-950/80 border border-teal-500/30 rounded-2xl p-4 space-y-2">
              <span className="text-xs font-bold text-teal-400 uppercase tracking-wider block">
                ⚡ Option 1: Smart Auto-Assign
              </span>
              <p className="text-xs text-slate-400">
                Automatically finds and assigns the nearest active volunteer in the donor's township.
              </p>
              <button
                onClick={handleAutoAssign}
                disabled={actionLoading !== null}
                className="w-full bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold py-2.5 rounded-xl text-xs transition cursor-pointer shadow-md shadow-teal-500/20"
              >
                {actionLoading === `assign-${assignModalItem}` ? "Auto-Assigning..." : "⚡ Auto-Assign Nearest Volunteer"}
              </button>
            </div>

            <div className="text-center text-xs text-slate-500 font-bold">— OR SELECT SPECIFIC VOLUNTEER —</div>

            {/* Option 2: Manual Selection */}
            <div className="space-y-3">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                Option 2: Select Township Volunteer
              </label>
              <select
                value={selectedVolunteerId}
                onChange={(e) => setSelectedVolunteerId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-teal-500"
              >
                <option value="">-- Choose Volunteer --</option>
                {volunteers.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.fullName || v.username} ({v.township || "No Township"}) {v.phoneNumber ? `· 📞 ${v.phoneNumber}` : ""}
                  </option>
                ))}
              </select>

              <button
                onClick={handleManualAssign}
                disabled={!selectedVolunteerId || actionLoading !== null}
                className="w-full bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white font-bold py-2.5 rounded-xl text-xs transition cursor-pointer border border-slate-700"
              >
                {actionLoading === `assign-${assignModalItem}` ? "Assigning..." : "✔ Assign Selected Volunteer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DonationApprovals;
