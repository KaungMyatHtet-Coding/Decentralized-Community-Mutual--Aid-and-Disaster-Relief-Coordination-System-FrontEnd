import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import api from "../../api";

export default function AdminDeliveryReviews() {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [pickupHistory, setPickupHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("PENDING"); // PENDING | HISTORY
  const [actionLoading, setActionLoading] = useState(null);

  // Modals
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [selectedDetailItem, setSelectedDetailItem] = useState(null); // Full detail modal for history items
  const [exporting, setExporting] = useState(false);

  const adminRole = localStorage.getItem("role");
  const adminTownship = localStorage.getItem("township") || "";

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === "PENDING") {
        const res = await api.get("/delivery-reports/pending");
        setReports(res.data);
      } else {
        // HISTORY tab: fetch all delivery reports + completed item pickup confirmations
        const [repRes, storedRes] = await Promise.all([
          api.get("/delivery-reports/township"),
          api.get("/item-donations/admin/stored").catch(() => ({ data: [] }))
        ]);

        let storedData = storedRes.data || [];
        if (adminRole === "ROLE_SUB_ADMIN" && adminTownship) {
          storedData = storedData.filter(d => d.donorTownship === adminTownship);
        }

        setReports(repRes.data);
        setPickupHistory(storedData);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    if (!window.confirm("Approve this delivery report?\nThis will mark the Aid Request as RESOLVED and automatically deduct items from township stock.")) {
      return;
    }
    setActionLoading(`${id}-approve`);
    try {
      await api.patch(`/delivery-reports/${id}/approve`);
      alert("✅ Report Approved! Aid Request is now RESOLVED and stock has been updated.");
      fetchData();
    } catch (err) {
      alert("❌ Approval failed: " + (err.response?.data || err.message));
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id) => {
    const reason = window.prompt("Enter rejection reason for the volunteer:");
    if (reason === null) return;

    setActionLoading(`${id}-reject`);
    try {
      await api.patch(`/delivery-reports/${id}/reject?reason=${encodeURIComponent(reason)}`);
      alert("❌ Report Rejected. The volunteer has been notified.");
      fetchData();
    } catch (err) {
      alert("Failed to reject: " + (err.response?.data || err.message));
    } finally {
      setActionLoading(null);
    }
  };

  // PDF Export
  const exportPDF = async () => {
    setExporting(true);
    try {
      const doc = new jsPDF("landscape");

      doc.setFontSize(20);
      doc.setTextColor(40, 40, 40);
      doc.text("Delivery & Pickup Verification Audit Report", 14, 20);

      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Exported By: ${localStorage.getItem("username") || "Admin"}`, 14, 28);
      doc.text(`Township: ${adminTownship || "All Regions"}`, 14, 34);
      doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, 40);

      const tableColumn = ["ID / Type", "Title / Item", "Volunteer", "Recipient / Donor", "Delivered Qty", "Status", "Date"];
      const tableRows = [];

      // Add Approved Aid Deliveries
      reports.forEach((r) => {
        const itemsStr = r.deliveredItems
          ? r.deliveredItems.map(i => `${i.itemName}: ${i.quantityDelivered} ${i.unit}`).join(", ")
          : "1 pcs";
        tableRows.push([
          `Aid Report #${r.id}`,
          r.aidRequest?.title || "Aid Request",
          r.volunteer?.fullName || r.volunteer?.username || "Volunteer",
          `${r.aidRequest?.reporter?.username || "Requester"} (${r.aidRequest?.township || "—"})`,
          itemsStr,
          r.status,
          r.submittedAt ? new Date(r.submittedAt).toLocaleDateString() : "—"
        ]);
      });

      // Add Completed Pickup Inventory
      pickupHistory.forEach((p) => {
        tableRows.push([
          `Pickup #${p.id}`,
          p.itemName || "Item",
          p.assignedVolunteer?.fullName || "Volunteer",
          `${p.donor?.fullName || p.donor?.username || "Donor"} (${p.donorTownship || "—"})`,
          `${p.quantity} ${p.unit}`,
          p.status || "STORED",
          p.storedAt || p.updatedAt ? new Date(p.storedAt || p.updatedAt).toLocaleDateString() : "—"
        ]);
      });

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 45,
        theme: 'striped',
        headStyles: { fillColor: [13, 148, 136] }, // teal-600
        styles: { fontSize: 8, cellPadding: 3 },
      });

      doc.save(`Delivery_Verification_Report_${new Date().toISOString().split("T")[0]}.pdf`);
      alert("✅ Delivery Audit PDF Exported Successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to export PDF.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/admin/dashboard")}
              className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer"
            >
              ← Back
            </button>
            <div>
              <h1 className="text-2xl font-bold text-teal-400">📦 Delivery & Pickup Proof Reviews</h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Review volunteer delivery reports, verify proof photos, and view completed delivery history.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={exportPDF}
              disabled={exporting}
              className="text-xs text-slate-950 font-bold bg-teal-500 hover:bg-teal-400 px-4 py-2 rounded-xl transition cursor-pointer shadow-md shadow-teal-500/20 disabled:opacity-50"
            >
              {exporting ? "Exporting..." : "📄 Export PDF"}
            </button>
            <button
              onClick={fetchData}
              className="text-xs text-teal-400 border border-teal-500/30 bg-teal-500/10 px-3.5 py-2 rounded-xl hover:bg-teal-500/20 transition cursor-pointer"
            >
              🔄 Refresh
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("PENDING")}
            className={`px-6 py-2.5 rounded-2xl font-bold text-xs transition cursor-pointer ${
              activeTab === "PENDING"
                ? "bg-teal-500 text-slate-950 shadow-md"
                : "bg-slate-900 text-slate-400 hover:bg-slate-800 border border-slate-800"
            }`}
          >
            ⏳ Pending Review ({reports.filter(r => r.status === "PENDING_REVIEW").length})
          </button>
          <button
            onClick={() => setActiveTab("HISTORY")}
            className={`px-6 py-2.5 rounded-2xl font-bold text-xs transition cursor-pointer ${
              activeTab === "HISTORY"
                ? "bg-teal-500 text-slate-950 shadow-md"
                : "bg-slate-900 text-slate-400 hover:bg-slate-800 border border-slate-800"
            }`}
          >
            📜 History & Proof Archive
          </button>
        </div>

        {/* List */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full" />
          </div>
        ) : activeTab === "PENDING" ? (
          reports.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center">
              <div className="text-4xl mb-3">🎉</div>
              <p className="text-white font-semibold text-lg mb-1">No pending delivery reviews</p>
              <p className="text-slate-500 text-xs">All volunteer delivery reports in your township have been reviewed.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {reports.map((report) => (
                <div key={report.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 hover:border-slate-700 transition">
                  <div className="flex flex-col lg:flex-row justify-between gap-6">

                    {/* Details */}
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-mono text-teal-400 bg-teal-500/10 px-2.5 py-0.5 rounded-md border border-teal-500/20">
                          Report #{report.id}
                        </span>
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full border bg-amber-500/10 text-amber-400 border-amber-500/20">
                          PENDING REVIEW
                        </span>
                      </div>

                      <h3 className="text-lg font-bold text-white">
                        {report.aidRequest?.title || "Aid Request"}
                      </h3>

                      <div className="flex flex-wrap gap-2 text-xs text-slate-400">
                        <span className="bg-slate-800 px-2.5 py-1 rounded-lg">
                          👤 Volunteer: <strong className="text-white">{report.volunteer?.fullName || "—"}</strong>
                        </span>
                        <span className="bg-slate-800 px-2.5 py-1 rounded-lg">
                          📍 Township: <strong className="text-white">{report.aidRequest?.township || "—"}</strong>
                        </span>
                        <span className="bg-slate-800 px-2.5 py-1 rounded-lg">
                          🕒 {new Date(report.submittedAt).toLocaleString()}
                        </span>
                      </div>

                      {/* Delivered items */}
                      {report.deliveredItems && report.deliveredItems.length > 0 && (
                        <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-2">
                          <span className="text-xs font-bold text-teal-400 uppercase tracking-wider block">
                            📦 Delivered Items (Will Deduct Stock):
                          </span>
                          <div className="grid sm:grid-cols-2 gap-2">
                            {report.deliveredItems.map((item, idx) => (
                              <div key={idx} className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs flex justify-between items-center">
                                <span className="text-slate-300 font-medium">{item.itemName}</span>
                                <span className="text-teal-400 font-bold font-mono">
                                  -{item.quantityDelivered} {item.unit}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {report.notes && (
                        <p className="text-xs text-slate-400 italic bg-slate-950/30 border border-slate-800/50 p-3 rounded-xl">
                          "{report.notes}"
                        </p>
                      )}
                    </div>

                    {/* Proof Photo & Actions */}
                    <div className="flex flex-col justify-between items-center lg:items-end gap-4 lg:w-64">
                      {report.proofPhotoUrl ? (
                        <div
                          onClick={() => setSelectedPhoto(report.proofPhotoUrl)}
                          className="relative group cursor-pointer w-full h-36 rounded-2xl overflow-hidden border border-slate-700 bg-slate-950"
                        >
                          <img src={report.proofPhotoUrl} alt="Proof" className="w-full h-full object-cover group-hover:scale-105 transition" />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition text-xs font-bold">
                            🔍 View Proof Photo
                          </div>
                        </div>
                      ) : (
                        <div className="w-full h-36 rounded-2xl border border-slate-800 bg-slate-950 flex items-center justify-center text-xs text-slate-500">
                          No Proof Photo
                        </div>
                      )}

                      <div className="flex gap-2 w-full">
                        <button
                          disabled={actionLoading !== null}
                          onClick={() => handleApprove(report.id)}
                          className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-2.5 px-3 rounded-xl text-xs transition cursor-pointer disabled:opacity-40"
                        >
                          {actionLoading === `${report.id}-approve` ? "..." : "✅ Approve & Deduct Stock"}
                        </button>
                        <button
                          disabled={actionLoading !== null}
                          onClick={() => handleReject(report.id)}
                          className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 font-bold py-2.5 px-3 rounded-xl text-xs transition cursor-pointer disabled:opacity-40"
                        >
                          ❌ Reject
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          /* HISTORY TAB */
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-sm font-bold text-teal-400 uppercase tracking-wider">
                📜 Approved Deliveries & Collected Pickup Archive (Click item for details)
              </h2>
            </div>

            {/* Approved Aid Deliveries */}
            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-slate-400 uppercase">1. Completed Aid Request Deliveries</h3>
              {reports.filter(r => r.status === "APPROVED").length === 0 ? (
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl text-xs text-slate-500 italic text-center">
                  No approved aid request delivery reports yet.
                </div>
              ) : (
                reports.filter(r => r.status === "APPROVED").map((rep) => (
                  <div
                    key={rep.id}
                    onClick={() => setSelectedDetailItem({ type: "AID_DELIVERY", data: rep })}
                    className="bg-slate-900 border border-slate-800 hover:border-teal-500/50 cursor-pointer rounded-2xl p-4 flex justify-between items-center gap-4 transition group"
                  >
                    <div className="space-y-1">
                      <span className="text-xs font-bold text-emerald-400 group-hover:underline">
                        ✅ {rep.aidRequest?.title}
                      </span>
                      <p className="text-xs text-slate-400">
                        Volunteer: <strong className="text-white">{rep.volunteer?.fullName || rep.volunteer?.username}</strong> · 📍 {rep.aidRequest?.township}
                      </p>
                      <p className="text-[10px] text-slate-500">Approved at: {new Date(rep.reviewedAt || rep.submittedAt).toLocaleString()}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      {rep.proofPhotoUrl && (
                        <img
                          src={rep.proofPhotoUrl}
                          alt="Proof"
                          className="w-14 h-14 rounded-xl object-cover border border-slate-700"
                        />
                      )}
                      <span className="text-xs text-teal-400 font-bold bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
                        🔍 View Details
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Completed Item Pickups */}
            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-slate-400 uppercase">2. Completed Donor Item Pickups & Warehouse Receipts</h3>
              {pickupHistory.length === 0 ? (
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl text-xs text-slate-500 italic text-center">
                  No item pickup history yet.
                </div>
              ) : (
                pickupHistory.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setSelectedDetailItem({ type: "ITEM_PICKUP", data: item })}
                    className="bg-slate-900 border border-slate-800 hover:border-teal-500/50 cursor-pointer rounded-2xl p-4 flex justify-between items-center gap-4 transition group"
                  >
                    <div className="space-y-1">
                      <span className="text-xs font-bold text-teal-400 group-hover:underline">
                        📦 {item.itemName} ({item.quantity} {item.unit})
                      </span>
                      <p className="text-xs text-slate-400">
                        Donor: <strong className="text-white">{item.donor?.fullName || item.donor?.username || "Anonymous"}</strong> · 📍 {item.donorTownship}
                      </p>
                      {item.assignedVolunteer && (
                        <p className="text-[11px] text-slate-400">Collected By: ✏️ {item.assignedVolunteer.fullName || item.assignedVolunteer.username}</p>
                      )}
                      <p className="text-[10px] text-slate-500">Stored Date: {new Date(item.updatedAt || item.storedAt).toLocaleString()}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      {(item.volunteerConfirmPhoto || item.itemPhotoUrl) && (
                        <img
                          src={item.volunteerConfirmPhoto || item.itemPhotoUrl}
                          alt="Pickup Proof"
                          className="w-14 h-14 rounded-xl object-cover border border-slate-700"
                        />
                      )}
                      <span className="text-xs text-teal-400 font-bold bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
                        🔍 View Details
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* 📜 DETAIL MODAL FOR HISTORY ITEMS */}
        {selectedDetailItem && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
              <div className="flex justify-between items-start border-b border-slate-800 pb-3">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-teal-400 bg-teal-500/10 px-2.5 py-0.5 rounded-md border border-teal-500/20">
                    {selectedDetailItem.type === "AID_DELIVERY" ? "✅ Completed Aid Delivery" : "📦 Completed Item Pickup"}
                  </span>
                  <h3 className="text-lg font-bold text-white mt-1">
                    {selectedDetailItem.type === "AID_DELIVERY"
                      ? selectedDetailItem.data.aidRequest?.title
                      : selectedDetailItem.data.itemName}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedDetailItem(null)}
                  className="text-slate-400 hover:text-white text-sm font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Detailed Breakdown */}
              <div className="space-y-3 text-xs">
                {selectedDetailItem.type === "AID_DELIVERY" ? (
                  <>
                    <div className="bg-slate-950 rounded-2xl p-3.5 space-y-2 border border-slate-800">
                      <div className="flex justify-between"><span className="text-slate-400">Township:</span><span className="font-semibold text-white">📍 {selectedDetailItem.data.aidRequest?.township}</span></div>
                      <div className="flex justify-between"><span className="text-slate-400">Ward / Village:</span><span className="font-semibold text-white">{selectedDetailItem.data.aidRequest?.wardOrVillage || "—"}</span></div>
                      <div className="flex justify-between"><span className="text-slate-400">Reporter:</span><span className="font-semibold text-teal-400">{selectedDetailItem.data.aidRequest?.reporter?.username || "Public"}</span></div>
                      <div className="flex justify-between"><span className="text-slate-400">Volunteer:</span><span className="font-semibold text-amber-400">👤 {selectedDetailItem.data.volunteer?.fullName || selectedDetailItem.data.volunteer?.username}</span></div>
                    </div>

                    {/* Delivered items */}
                    {selectedDetailItem.data.deliveredItems && (
                      <div className="bg-slate-950 rounded-2xl p-3.5 border border-slate-800 space-y-2">
                        <span className="text-xs font-bold text-teal-400 uppercase tracking-wider block">📦 Delivered Items:</span>
                        <div className="space-y-1">
                          {selectedDetailItem.data.deliveredItems.map((it, idx) => (
                            <div key={idx} className="flex justify-between items-center text-slate-300 font-mono">
                              <span>• {it.itemName}</span>
                              <span className="text-emerald-400 font-bold">-{it.quantityDelivered} {it.unit}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedDetailItem.data.notes && (
                      <div className="bg-slate-950 rounded-2xl p-3 italic text-slate-400 border border-slate-800">
                        "{selectedDetailItem.data.notes}"
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="bg-slate-950 rounded-2xl p-3.5 space-y-2 border border-slate-800">
                      <div className="flex justify-between"><span className="text-slate-400">Item Quantity:</span><span className="font-bold text-emerald-400 font-mono">{selectedDetailItem.data.quantity} {selectedDetailItem.data.unit}</span></div>
                      <div className="flex justify-between"><span className="text-slate-400">Donor Name:</span><span className="font-semibold text-white">{selectedDetailItem.data.donor?.fullName || selectedDetailItem.data.donor?.username || "Anonymous"}</span></div>
                      <div className="flex justify-between"><span className="text-slate-400">Donor Phone:</span><span className="font-semibold text-teal-400 font-mono">📞 {selectedDetailItem.data.donorPhone}</span></div>
                      <div className="flex justify-between"><span className="text-slate-400">Township:</span><span className="font-semibold text-white">📍 {selectedDetailItem.data.donorTownship}</span></div>
                      {selectedDetailItem.data.streetAddress && (
                        <div className="flex justify-between"><span className="text-slate-400">Pickup Address:</span><span className="font-semibold text-amber-300 max-w-xs">{selectedDetailItem.data.streetAddress}</span></div>
                      )}
                      {selectedDetailItem.data.assignedVolunteer && (
                        <div className="flex justify-between"><span className="text-slate-400">Collected Volunteer:</span><span className="font-semibold text-amber-400">✏️ {selectedDetailItem.data.assignedVolunteer.fullName}</span></div>
                      )}
                    </div>
                  </>
                )}

                {/* Proof Photo View */}
                {(selectedDetailItem.data.proofPhotoUrl || selectedDetailItem.data.volunteerConfirmPhoto) && (
                  <div>
                    <span className="text-slate-400 text-xs block mb-1">📸 Volunteer Confirmation Proof Photo:</span>
                    <img
                      src={selectedDetailItem.data.proofPhotoUrl || selectedDetailItem.data.volunteerConfirmPhoto}
                      alt="Proof"
                      className="w-full h-52 object-cover rounded-2xl border border-slate-700 cursor-pointer"
                      onClick={() => setSelectedPhoto(selectedDetailItem.data.proofPhotoUrl || selectedDetailItem.data.volunteerConfirmPhoto)}
                    />
                  </div>
                )}
              </div>

              <button
                onClick={() => setSelectedDetailItem(null)}
                className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-2.5 rounded-xl text-xs cursor-pointer"
              >
                Close Details
              </button>
            </div>
          </div>
        )}

        {/* Photo Modal */}
        {selectedPhoto && (
          <div
            onClick={() => setSelectedPhoto(null)}
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 cursor-pointer"
          >
            <div className="relative max-w-3xl max-h-[90vh]">
              <img src={selectedPhoto} alt="Full Proof" className="max-w-full max-h-[85vh] rounded-2xl object-contain shadow-2xl" />
              <p className="text-center text-xs text-slate-400 mt-2">Click anywhere to close</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
