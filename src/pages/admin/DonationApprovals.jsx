import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api";

function DonationApprovals() {
  const navigate = useNavigate();
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [actionLoading, setActionLoading] = useState(null);
  const [tab, setTab] = useState("PENDING"); // PENDING | ALL
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [exporting, setExporting] = useState(false);

  // ── fetch ──────────────────────────────────────────────
  const fetchDonations = async () => {
    setLoading(true);
    try {
      const [moneyRes, itemRes] = await Promise.all([
        api.get("/donations"),
        api.get("/item-donations"),
      ]);

      // Item donation ကို money donation နဲ့ တူအောင် normalize လုပ်
      const normalizedItems = itemRes.data.map((d) => ({
        ...d,
        donationType: "ITEMS",
        amount: null,
        status: d.status === "PENDING_VOLUNTEER" ? "PENDING" : d.status,
        donatedAt: d.createdAt,
        proofImageUrl: d.itemPhotoUrl,
        _isItemDonation: true, // action မှာ ခွဲသုံးဖို့
      }));

      setDonations([...moneyRes.data, ...normalizedItems]);
    } catch {
      setError("Failed to load donations.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDonations();
  }, []);

  // ── actions ────────────────────────────────────────────
  const showMsg = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(""), 4000);
  };

  const handleConfirm = async (id, isItem) => {
    setActionLoading(`confirm-${id}`);
    try {
      if (isItem) {
        await api.patch(`/item-donations/${id}/store`); // ✅ item endpoint
      } else {
        await api.patch(`/donations/${id}/confirm`); // ✅ money endpoint
      }
      showMsg("✅ Donation approved!");
      fetchDonations();
    } catch (err) {
      setError(err.response?.data || "Failed to approve.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id, isItem) => {
    setActionLoading(`reject-${id}`);
    try {
      if (isItem) {
        await api.patch(`/item-donations/${id}/reject`); // ✅ item endpoint
      } else {
        await api.patch(`/donations/${id}/reject`); // ✅ money endpoint
      }
      showMsg("❌ Donation rejected.");
      fetchDonations();
    } catch (err) {
      setError(err.response?.data || "Failed to reject.");
    } finally {
      setActionLoading(null);
    }
  };

  // ── filter ─────────────────────────────────────────────
  const filtered = donations.filter((d) => {
    const tabMatch = tab === "PENDING" ? d.status === "PENDING" : true;
    const statusMatch = statusFilter === "ALL" || d.status === statusFilter;
    const searchMatch =
      search === "" ||
      d.donor?.username?.toLowerCase().includes(search.toLowerCase()) ||
      d.campaign?.title?.toLowerCase().includes(search.toLowerCase());
    return tabMatch && statusMatch && searchMatch;
  });

  const pendingCount = donations.filter((d) => d.status === "PENDING").length;

  // ── PDF Export ─────────────────────────────────────────
  const exportPDF = async () => {
    setExporting(true);
    try {
      // Build HTML table for PDF
      const rows = filtered
        .map(
          (d) => `
        <tr>
          <td>${d.id}</td>
          <td>${d.donor?.username || "Anonymous"}</td>
          <td>${d.campaign?.title || "—"}</td>
          <td>${d.donationType}</td>
          <td>${d.donationType === "MONEY" ? Number(d.amount).toLocaleString() + " MMK" : `${d.itemName} (${d.quantity} ${d.unit})`}</td>
          <td>${d.donatedAt ? new Date(d.donatedAt).toLocaleDateString() : "—"}</td>
          <td>${d.status}</td>
        </tr>
      `,
        )
        .join("");

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8" />
          <style>
            body { font-family: Arial, sans-serif; font-size: 12px; color: #222; }
            h1 { color: #0f766e; font-size: 18px; margin-bottom: 4px; }
            p { color: #666; font-size: 11px; margin-bottom: 16px; }
            table { width: 100%; border-collapse: collapse; }
            th { background: #0f766e; color: white; padding: 8px; text-align: left; font-size: 11px; }
            td { padding: 7px 8px; border-bottom: 1px solid #e5e7eb; font-size: 11px; }
            tr:nth-child(even) td { background: #f9fafb; }
            .CONFIRMED { color: #059669; font-weight: bold; }
            .REJECTED  { color: #dc2626; font-weight: bold; }
            .PENDING   { color: #d97706; font-weight: bold; }
          </style>
        </head>
        <body>
          <h1>💰 Donation History Report</h1>
          <p>Generated: ${new Date().toLocaleString()} · Total: ${filtered.length} records</p>
          <table>
            <thead>
              <tr>
                <th>#ID</th><th>Donor</th><th>Campaign</th>
                <th>Type</th><th>Contribution</th><th>Date</th><th>Status</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </body>
        </html>
      `;

      const win = window.open("", "_blank");
      win.document.write(html);
      win.document.close();
      win.focus();
      setTimeout(() => {
        win.print();
      }, 500);
    } finally {
      setExporting(false);
    }
  };

  // ── status badge ───────────────────────────────────────
  const statusBadge = (status) => {
    switch (status) {
      case "CONFIRMED":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
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
              💳 Donation Approvals
            </h1>
            <p className="text-xs text-gray-400 mt-1">
              {pendingCount > 0 && (
                <span className="text-amber-400 animate-pulse font-mono">
                  {pendingCount} pending ·{" "}
                </span>
              )}
              {donations.length} total donations
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
            <button
              onClick={() => setError("")}
              className="ml-2 underline cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-3">
          {[
            {
              key: "PENDING",
              label: `⏳ Pending Review${pendingCount > 0 ? ` (${pendingCount})` : ""}`,
            },
            { key: "ALL", label: "📋 All Donations" },
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

        {/* Search + Filter (ALL tab only) */}
        {tab === "ALL" && (
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="Search by donor or campaign..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none"
            >
              <option value="ALL">All Status</option>
              <option value="PENDING">PENDING</option>
              <option value="CONFIRMED">CONFIRMED</option>
              <option value="REJECTED">REJECTED</option>
            </select>
          </div>
        )}

        {/* Table */}
        {loading ? (
          <div className="text-center py-16 text-emerald-400 animate-pulse text-sm">
            Loading donations...
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-slate-900/20 border border-slate-800 border-dashed rounded-2xl">
            <p className="text-gray-400 text-sm">
              {tab === "PENDING"
                ? "🎉 No pending donations! All caught up."
                : "No donations found."}
            </p>
          </div>
        ) : (
          <div className="bg-slate-900/30 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/60 text-[10px] uppercase font-mono tracking-wider text-gray-400">
                    <th className="p-4">#</th>
                    <th className="p-4">Donor</th>
                    <th className="p-4">Campaign</th>
                    <th className="p-4">Type</th>
                    <th className="p-4">Contribution</th>
                    <th className="p-4">Receipt</th>
                    <th className="p-4">Date</th>
                    <th className="p-4 text-center">Status</th>
                    <th className="p-4 text-center">Actions</th>
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
                        {d.campaign?.title || `#${d.campaign?.id}`}
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
                          <span>
                            {d.itemName} ({d.quantity} {d.unit})
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
                            🖼️ View
                          </a>
                        ) : (
                          <span className="text-gray-600">—</span>
                        )}
                      </td>
                      <td className="p-4 text-gray-400 font-mono">
                        {d.donatedAt
                          ? new Date(d.donatedAt).toLocaleDateString()
                          : "—"}
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
                              onClick={() =>
                                handleReject(d.id, d._isItemDonation)
                              }
                              className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 font-bold py-1.5 px-3 rounded-lg text-[10px] transition cursor-pointer disabled:opacity-40"
                            >
                              {actionLoading === `reject-${d.id}`
                                ? "..."
                                : "❌ Reject"}
                            </button>
                            <button
                              disabled={actionLoading !== null}
                              onClick={() =>
                                handleConfirm(d.id, d._isItemDonation)
                              }
                              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-1.5 px-3 rounded-lg text-[10px] transition cursor-pointer disabled:opacity-40"
                            >
                              {actionLoading === `confirm-${d.id}`
                                ? "..."
                                : "✔ Approve"}
                            </button>
                          </div>
                        ) : (
                          <span className="text-gray-600 text-[10px] text-center block">
                            —
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-3 border-t border-slate-800 text-[10px] text-gray-500 font-mono">
              Showing {filtered.length} of {donations.length} records
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default DonationApprovals;
