import React, { useEffect, useState } from 'react';
import api from '../../api'; // 💡 ညီလေးရဲ့ Axios API instance လမ်းကြောင်းအတိုင်း ပြန်ညှိပေးပါ
import { toast } from 'react-toastify';

const StorePage = () => {
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [remarks, setRemarks] = useState({});

  // 🔄 ဂိုဒေါင်သွင်းရန် စောင့်ဆိုင်းနေသော ပစ္စည်းများကို ဆွဲထုတ်ခြင်း
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

  useEffect(() => {
    fetchPendingStore();
  }, []);

  // 📝 Input ရိုက်တဲ့ Remarks (မှတ်ချက်) ကို Handle လုပ်ခြင်း
  const handleRemarkChange = (id, value) => {
    setRemarks(prev => ({ ...prev, [id]: value }));
  };

  // 🏬 Approve & Store လုပ်ဆောင်ချက်ကို Backend သို့ လှမ်းပို့ခြင်း
  const handleApproveAndStore = async (id) => {
    const itemRemarks = remarks[id] || "Verified and stored successfully";
    try {
      // Backend Controller ထဲက PostMapping လမ်းကြောင်းအတိုင်း ခေါ်ဆိုခြင်း
      await api.post(`/item-donations/${id}/approve-and-store`, null, {
        params: { remarks: itemRemarks }
      });

      toast.success("📦 Item successfully stored in warehouse & Donor notified!");
      // စာရင်းထဲကနေ ပျောက်သွားအောင် Refresh ပြန်လုပ်ခြင်း
      fetchPendingStore();
    } catch (error) {
      console.error("Error storing item:", error);
      toast.error(error.response?.data || "Failed to store item.");
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
    <div className="p-6 bg-slate-900 min-h-screen text-slate-100">
      <div className="flex items-center gap-3 mb-6">
        <span className="text-3xl">🏬</span>
        <div>
          <h1 className="text-2xl font-bold text-emerald-400">Warehouse Storage Management</h1>
          <p className="text-sm text-slate-400">Volunteer များ သွားရောက်ကောက်ခံလာသော ပစ္စည်းများကို ဂိုဒေါင်စာရင်းသွင်းရန် စိစစ်သည့်နေရာ</p>
        </div>
      </div>

      {donations.length === 0 ? (
        <div className="bg-slate-800 border border-slate-700 p-8 rounded-xl text-center text-slate-400">
          🎉 ယခုလောလောဆယ် ဂိုဒေါင်သွင်းရန် စောင့်ဆိုင်းနေသော အလှူပစ္စည်းများ မရှိသေးပါဗျာ။
        </div>
      ) : (
        <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-750 border-b border-slate-700 text-slate-300 font-semibold text-sm">
                  <th className="p-4">Item Details</th>
                  <th className="p-4">Donor Information</th>
                  <th className="p-4">Collected By (Volunteer)</th>
                  <th className="p-4">Volunteer Note / Photo</th>
                  <th className="p-4">Storage Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700 text-sm">
                {donations.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-750 transition-colors">
                    {/* Item Details */}
                    <td className="p-4">
                      <div className="font-semibold text-emerald-400">{item.itemName}</div>
                      <div className="text-xs text-slate-400 mt-1">
                        Quantity: <span className="text-slate-200 font-medium">{item.quantity} {item.unit}</span>
                      </div>
                    </td>

                    {/* Donor Information */}
                    <td className="p-4">
                      <div className="text-slate-200">{item.donor?.fullName || "Anonymous"}</div>
                      <div className="text-xs text-slate-400">{item.donorPhone}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{item.donorTownship}</div>
                    </td>

                    {/* Volunteer */}
                    <td className="p-4">
                      <div className="text-slate-200 font-medium">✏️ {item.assignedVolunteer?.fullName || "Assigned"}</div>
                      <div className="text-xs text-slate-400">Role: Volunteer</div>
                    </td>

                    {/* Volunteer Notes & Proof Photo */}
                    <td className="p-4">
                      <div className="text-slate-300 italic text-xs max-w-xs bg-slate-850 p-2 rounded border border-slate-750">
                        "{item.volunteerNote || "No remarks left by volunteer"}"
                      </div>
                      {item.volunteerConfirmPhoto && (
                        <a
                          href={item.volunteerConfirmPhoto}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-blue-400 hover:underline mt-1 block"
                        >
                          🖼️ View Proof Photo
                        </a>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="p-4">
                      <div className="flex flex-col gap-2 max-w-xs">
                        <input
                          type="text"
                          placeholder="ဂိုဒေါင်တည်နေရာ သို့မဟုတ် မှတ်ချက်..."
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
    </div>
  );
};

export default StorePage;
