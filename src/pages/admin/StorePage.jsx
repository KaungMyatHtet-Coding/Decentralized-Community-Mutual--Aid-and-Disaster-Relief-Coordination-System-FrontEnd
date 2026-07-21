import React, { useEffect, useState } from 'react';
import api from '../../api';
import { toast } from 'react-toastify';
import { YANGON_TOWNSHIPS } from '../../constants';

const StorePage = () => {
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [remarks, setRemarks] = useState({});
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  
  const adminRole = localStorage.getItem("role");
  const adminTownship = localStorage.getItem("township") || "";

  const [emergencyLogs, setEmergencyLogs] = useState([]);
  const [showLogs, setShowLogs] = useState(false);

  // Emergency Usage Form State
  const [emergencyForm, setEmergencyForm] = useState({
    itemName: "",
    township: adminTownship,
    quantityUsed: "",
    reasonDetails: "",
    proofPhotoUrl: "",
    usageDate: new Date().toISOString().slice(0, 16), // YYYY-MM-DDThh:mm
  });

  const fetchPendingStore = async () => {
    try {
      setLoading(true);
      const response = await api.get('/item-donations/admin/pending-store');
      setDonations(response.data);
    } catch (error) {
      console.error("Error fetching pending store items:", error);
      toast.error("Failed to load items waiting for warehouse storage.");
    } finally {
      setLoading(false);
    }
  };

  const fetchEmergencyLogs = async () => {
    try {
      const response = await api.get('/stocks/emergency-logs');
      setEmergencyLogs(response.data);
    } catch (error) {
      console.error("Error fetching emergency logs:", error);
    }
  };

  useEffect(() => {
    fetchPendingStore();
    fetchEmergencyLogs();
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
      toast.success("📦 Item successfully stored in warehouse & Donor notified!");
      fetchPendingStore();
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
        township: adminTownship, 
        quantityUsed: "",
        reasonDetails: "",
        proofPhotoUrl: "",
        usageDate: new Date().toISOString().slice(0, 16)
      });
      fetchEmergencyLogs(); // Refresh logs
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to record emergency usage.");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 text-emerald-400">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-emerald-400 mr-3"></div>
        <span>Loading pending warehouse items...</span>
      </div>
    );
  }

  return (
    <div className="p-6 bg-slate-900 min-h-screen text-slate-100 relative">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🏬</span>
          <div>
            <h1 className="text-2xl font-bold text-emerald-400">Warehouse & Inventory Management</h1>
            <p className="text-sm text-slate-400">Manage incoming donations or report emergency offline usage</p>
          </div>
        </div>
        
        <div className="flex gap-3">
          <button 
            onClick={() => setShowLogs(!showLogs)}
            className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition-all"
          >
            {showLogs ? "📦 View Warehouse" : "🕒 View Emergency Logs"}
          </button>
          <button 
            onClick={() => setShowEmergencyModal(true)}
            className="bg-rose-600 hover:bg-rose-500 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2 shadow-lg shadow-rose-500/20 transition-all"
          >
            🚨 Report Emergency Usage
          </button>
        </div>
      </div>

      {showLogs ? (
        <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-xl overflow-hidden">
          <div className="p-4 bg-slate-850 border-b border-slate-700">
            <h2 className="text-lg font-bold text-slate-200">🕒 Emergency Usage History</h2>
          </div>
          {emergencyLogs.length === 0 ? (
            <div className="p-8 text-center text-slate-400">No emergency logs found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-750 border-b border-slate-700 text-slate-300 font-semibold text-xs">
                    <th className="p-4">Date & Time</th>
                    <th className="p-4">Item & Qty</th>
                    <th className="p-4">Township</th>
                    <th className="p-4">Reason & Proof</th>
                    <th className="p-4">Authorized By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700 text-sm">
                  {emergencyLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-750 transition-colors">
                      <td className="p-4 text-slate-300">
                        {new Date(log.usageDate).toLocaleString()}
                      </td>
                      <td className="p-4">
                        <div className="font-semibold text-rose-400">{log.itemName}</div>
                        <div className="text-xs text-slate-400 mt-1">
                          Used: <span className="text-slate-200 font-bold">-{log.quantityUsed}</span>
                        </div>
                      </td>
                      <td className="p-4 text-slate-300">{log.township}</td>
                      <td className="p-4">
                        <div className="text-slate-300 italic text-xs max-w-xs bg-slate-850 p-2 rounded border border-slate-750">
                          "{log.reasonDetails || "No reason provided"}"
                        </div>
                        {log.proofPhotoUrl && (
                          <a href={log.proofPhotoUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-400 hover:underline mt-1 block">
                            🖼️ View Proof Photo
                          </a>
                        )}
                      </td>
                      <td className="p-4">
                        <span className="bg-slate-700 px-2 py-1 rounded text-xs text-slate-300">
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
      ) : (
        <>
          {donations.length === 0 ? (
        <div className="bg-slate-800 border border-slate-700 p-8 rounded-xl text-center text-slate-400">
          🎉 No pending items for warehouse storage at the moment.
        </div>
      ) : (
        <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-750 border-b border-slate-700 text-slate-300 font-semibold text-sm">
                  <th className="p-4">Item Details</th>
                  <th className="p-4">Donor Information</th>
                  <th className="p-4">Collected By</th>
                  <th className="p-4">Notes / Photo</th>
                  <th className="p-4">Storage Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700 text-sm">
                {donations.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-750 transition-colors">
                    <td className="p-4">
                      <div className="font-semibold text-emerald-400">{item.itemName}</div>
                      <div className="text-xs text-slate-400 mt-1">
                        Quantity: <span className="text-slate-200 font-medium">{item.quantity} {item.unit}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="text-slate-200">{item.donor?.fullName || "Anonymous"}</div>
                      <div className="text-xs text-slate-400">{item.donorPhone}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{item.donorTownship}</div>
                    </td>
                    <td className="p-4">
                      <div className="text-slate-200 font-medium">✏️ {item.assignedVolunteer?.fullName || "Assigned"}</div>
                    </td>
                    <td className="p-4">
                      <div className="text-slate-300 italic text-xs max-w-xs bg-slate-850 p-2 rounded border border-slate-750">
                        "{item.volunteerNote || "No remarks left by volunteer"}"
                      </div>
                      {item.volunteerConfirmPhoto && (
                        <a href={item.volunteerConfirmPhoto} target="_blank" rel="noreferrer" className="text-xs text-blue-400 hover:underline mt-1 block">
                          🖼️ View Proof Photo
                        </a>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col gap-2 max-w-xs">
                        <input
                          type="text"
                          placeholder="Warehouse Location or Remarks..."
                          className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                          value={remarks[item.id] || ""}
                          onChange={(e) => handleRemarkChange(item.id, e.target.value)}
                        />
                        <button
                          onClick={() => handleApproveAndStore(item.id)}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs py-1.5 px-3 rounded shadow transition-colors flex items-center justify-center gap-1"
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
        </div>
      )}
      </>
      )}

      {/* Emergency Usage Modal */}
      {showEmergencyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-rose-500/10 border-b border-rose-500/20 p-4">
              <h3 className="text-xl font-bold text-rose-500 flex items-center gap-2">
                🚨 Emergency Usage Report
              </h3>
              <p className="text-xs text-rose-400/80 mt-1">Deduct stock immediately used during an offline emergency.</p>
            </div>
            
            <form onSubmit={handleEmergencySubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 block">Item Name *</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="e.g., Water Bottle, Rice Bag" 
                    value={emergencyForm.itemName}
                    onChange={e => setEmergencyForm({...emergencyForm, itemName: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-sm focus:border-rose-500 outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 block">Quantity Used *</label>
                  <input 
                    type="number" 
                    min="1" 
                    required 
                    placeholder="0" 
                    value={emergencyForm.quantityUsed}
                    onChange={e => setEmergencyForm({...emergencyForm, quantityUsed: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-sm focus:border-rose-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 block">Township *</label>
                  <select 
                    required
                    disabled={adminRole === "ROLE_SUB_ADMIN" && adminTownship !== ""}
                    value={emergencyForm.township}
                    onChange={e => setEmergencyForm({...emergencyForm, township: e.target.value})}
                    className={`w-full border rounded-lg p-2.5 text-sm focus:border-rose-500 outline-none ${
                      adminRole === "ROLE_SUB_ADMIN" && adminTownship !== "" 
                      ? "bg-slate-900 border-slate-800 text-slate-500 cursor-not-allowed" 
                      : "bg-slate-950 border-slate-700 text-white"
                    }`}
                  >
                    <option value="">Select Township</option>
                    {YANGON_TOWNSHIPS.map(t => (
                      <option key={t.en} value={t.en}>{t.en} ({t.my})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 block">Date & Time *</label>
                  <input 
                    type="datetime-local" 
                    required 
                    value={emergencyForm.usageDate}
                    onChange={e => setEmergencyForm({...emergencyForm, usageDate: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-sm focus:border-rose-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 block">Reason Details *</label>
                <textarea 
                  required 
                  rows="3"
                  placeholder="Describe the emergency and why stock was used..." 
                  value={emergencyForm.reasonDetails}
                  onChange={e => setEmergencyForm({...emergencyForm, reasonDetails: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-sm focus:border-rose-500 outline-none resize-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 block">Proof Photo URL *</label>
                <input 
                  type="text" 
                  required 
                  placeholder="Link to image/document proof" 
                  value={emergencyForm.proofPhotoUrl}
                  onChange={e => setEmergencyForm({...emergencyForm, proofPhotoUrl: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-sm focus:border-rose-500 outline-none"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-800">
                <button type="button" onClick={() => setShowEmergencyModal(false)} className="flex-1 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 font-semibold transition">Cancel</button>
                <button type="submit" className="flex-1 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 font-bold transition">Report Usage</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StorePage;
