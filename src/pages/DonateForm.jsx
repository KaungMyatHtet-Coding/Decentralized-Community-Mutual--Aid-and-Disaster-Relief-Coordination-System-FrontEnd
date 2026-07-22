import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Copy, Check } from "lucide-react";
import api from "../api";

const myanmarTownships = [
  { value: "Ahlon", label: "Ahlon (အလုံ)" },
  { value: "Bahan", label: "Bahan (ဗဟန်း)" },
  { value: "Dagon", label: "Dagon (ဒဂုံ)" },
  { value: "Hlaing", label: "Hlaing (လှိုင်)" },
  { value: "Insein", label: "Insein (အင်းစိန်)" },
  { value: "Kamayut", label: "Kamayut (ကမာရွတ်)" },
  { value: "Kyauktada", label: "Kyauktada (ကျောက်တံတား)" },
  { value: "Kyimyindaing", label: "Kyimyindaing (ကြည့်မြင်တိုင်)" },
  { value: "Lanmadaw", label: "Lanmadaw (လမ်းမတော်)" },
  { value: "Latha", label: "Latha (လသာ)" },
  { value: "Mayangon", label: "Mayangon (မရမ်းကုန်း)" },
  { value: "Mingaladon", label: "Mingaladon (မင်္ဂလာဒုံ)" },
  { value: "Pabedan", label: "Pabedan (ပန်းဘဲတန်း)" },
  { value: "Pazundaung", label: "Pazundaung (ပုဇွန်တောင်)" },
  { value: "Sanchaung", label: "Sanchaung (စမ်းချောင်း)" },
  { value: "Tamwe", label: "Tamwe (တာမွေ)" },
  { value: "Thaketa", label: "Thaketa (သာကေတ)" },
  { value: "Thingangyun", label: "Thingangyun (သင်္ဃန်းကျွန်း)" },
  { value: "Yankin", label: "Yankin (ရန်ကင်း)" },
  { value: "South Dagon", label: "South Dagon (ဒဂုံမြို့သစ်တောင်ပိုင်း)" },
  { value: "North Dagon", label: "North Dagon (ဒဂုံမြို့သစ်မြောက်ပိုင်း)" },
  { value: "East Dagon", label: "East Dagon (ဒဂုံမြို့သစ်အရှေ့ပိုင်း)" },
  { value: "Dagon Seikkan", label: "Dagon Seikkan (ဒဂုံဆိပ်ကမ်း)" },
  { value: "Dawbon", label: "Dawbon (ဒေါပုံ)" },
  { value: "Hlaingthaya", label: "Hlaingthaya (လှိုင်သာယာ)" },
  { value: "Shwepyitha", label: "Shwepyitha (ရွှေပြည်သာ)" },
  { value: "North Okkalapa", label: "North Okkalapa (ဥက္ကလာပမြောက်ပိုင်း)" },
  { value: "South Okkalapa", label: "South Okkalapa (ဥက္ကလာပတောင်ပိုင်း)" },
  { value: "Botahtaung", label: "Botahtaung (ဗိုလ်တထောင်)" },
  { value: "Seikkan", label: "Seikkan (ဆိပ်ကမ်း)" },
];

const ITEM_CATEGORIES = [
  { id: "Medicine", label: "💊 Medicine (ဆေးဝါး)", defaultUnit: "boxes" },
  { id: "Food", label: "🍚 Food (စားနပ်ရိက္ခာ)", defaultUnit: "bags" },
  { id: "Water", label: "💧 Water (သောက်ရေသန့်)", defaultUnit: "bottles" },
  { id: "Clothing/Blanket", label: "🧥 Clothing / Blanket (အဝတ်အထည်/စောင်)", defaultUnit: "pcs" },
  { id: "Others", label: "📦 Others (အခြား)", defaultUnit: "pcs" },
];

function DonateForm() {
  const { campaignId } = useParams();
  const navigate = useNavigate();

  const [campaign, setCampaign] = useState(null);
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);

  const [selectedCategory, setSelectedCategory] = useState("Medicine");

  const [formData, setFormData] = useState({
    donationType: "MONEY",
    amount: "",
    itemName: "Medicine",
    quantity: "1",
    unit: "boxes",
    condition: "NEW",
    donorTownship: "",
    donorPhone: "",
    streetAddress: "",
    handoverType: "DELIVER", // DELIVER (I will drop off) or PICKUP (Volunteer pickup)
    handoverDate: "",
    isAnonymous: false,
    proofImageUrl: "",
  });

  useEffect(() => {
    Promise.all([
      api.get(`/campaigns/${campaignId}`),
      api.get(`/donations/campaign/${campaignId}`)
    ])
      .then(([campRes, donRes]) => {
        setCampaign(campRes.data);
        const confirmed = donRes.data.filter(d => d.status === "CONFIRMED");
        const recent = confirmed.sort((a,b) => new Date(b.donatedAt) - new Date(a.donatedAt)).slice(0, 5);
        setDonations(recent);
      })
      .catch(() => setError("Failed to fetch campaign details."))
      .finally(() => setLoading(false));
  }, [campaignId]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleCategorySelect = (cat) => {
    setSelectedCategory(cat.id);
    setFormData((prev) => ({
      ...prev,
      itemName: cat.id === "Others" ? "" : cat.id,
      unit: cat.defaultUnit,
    }));
  };

  const handleCopyPhone = (phone) => {
    navigator.clipboard.writeText(phone);
    setCopiedPhone(true);
    setTimeout(() => setCopiedPhone(false), 2000);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const formUpload = new FormData();
      formUpload.append("file", file);
      
      const res = await api.post("/upload/photo", formUpload, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setFormData((prev) => ({ ...prev, proofImageUrl: res.data.url }));
    } catch (err) {
      setError("Failed to upload image. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setMessage("");

    try {
      if (formData.donationType === "MONEY") {
        if (!formData.amount || parseFloat(formData.amount) <= 0) {
          setError("Please enter a valid donation amount.");
          setSubmitting(false);
          return;
        }
        if (!formData.proofImageUrl) {
          setError("Please upload a payment proof screenshot.");
          setSubmitting(false);
          return;
        }

        const payload = {
          campaign: { id: parseInt(campaignId) },
          donationType: "MONEY",
          amount: parseFloat(formData.amount),
          proofImageUrl: formData.proofImageUrl || "",
          isAnonymous: formData.isAnonymous,
        };
        await api.post("/donations", payload);

      } else {
        // ITEMS DONATION
        if (!formData.itemName) {
          setError("Please specify the item name.");
          setSubmitting(false);
          return;
        }
        if (!formData.donorTownship) {
          setError("Please select your township.");
          setSubmitting(false);
          return;
        }
        if (!formData.donorPhone) {
          setError("Please enter your contact phone number.");
          setSubmitting(false);
          return;
        }

        const payload = {
          campaignId: parseInt(campaignId),
          campaign: { id: parseInt(campaignId) },

          itemName: formData.itemName,
          quantity: parseFloat(formData.quantity) || 1,
          unit: formData.unit || "pcs",
          condition: formData.condition,
          donorTownship: formData.donorTownship,
          donorPhone: formData.donorPhone,
          handoverType: formData.handoverType,
          handoverDate: formData.handoverDate
            ? new Date(formData.handoverDate).toISOString()
            : null,
          itemPhotoUrl: formData.proofImageUrl || "",
          isAnonymous: formData.isAnonymous,
        };

        await api.post("/item-donations", payload);
      }

      setMessage("🎉 Donation submitted successfully! Admin will review and confirm.");
      setTimeout(() => navigate("/campaigns"), 2200);
    } catch (err) {
      console.error(err);
      setError(
        typeof err.response?.data === "string"
          ? err.response.data
          : "Failed to submit donation. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-teal-400 font-medium">
        <div className="animate-spin w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 flex justify-center items-start pt-10">
      <div className="max-w-md w-full space-y-4">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="text-gray-400 hover:text-white flex items-center gap-2 font-semibold transition w-fit cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" /> Back
        </button>

        <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-3xl space-y-5 shadow-2xl backdrop-blur-xl">
          {/* Campaign Info */}
          <div className="space-y-1">
            <span className="text-[10px] bg-teal-500/10 text-teal-400 border border-teal-500/20 px-2 py-0.5 rounded font-mono uppercase tracking-wider">
              Contributing to
            </span>
            <h2 className="text-xl font-bold text-white">{campaign?.title}</h2>
            <p className="text-xs text-gray-400 line-clamp-2">
              {campaign?.description}
            </p>
          </div>

          {message && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 rounded-2xl text-xs text-center font-semibold">
              {message}
            </div>
          )}
          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3 rounded-2xl text-xs text-center font-semibold">
              {error}
            </div>
          )}

          {/* Social Proof: Recent Donors */}
          {donations.length > 0 && (
            <div className="bg-slate-950 rounded-2xl p-4 border border-slate-800">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2.5">Recent Donors</h3>
              <div className="space-y-2">
                {donations.map((d) => (
                  <div key={d.id} className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-teal-500/20 flex items-center justify-center text-teal-400 text-[10px] font-bold">
                        {d.donor?.username ? d.donor.username.charAt(0).toUpperCase() : "A"}
                      </div>
                      <span className="text-gray-300">{d.donor?.username || "Anonymous"}</span>
                    </div>
                    <span className="font-bold text-teal-400">
                      {d.donationType === "MONEY" ? `${Number(d.amount).toLocaleString()} MMK` : `${d.itemName} (${d.quantity})`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Donation Type Selector */}
            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block">
                Donation Type / လှူဒါန်းမည့် အမျိုးအစား
              </label>
              <div className="grid grid-cols-2 gap-3">
                {["MONEY", "ITEMS"].map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() =>
                      setFormData({ ...formData, donationType: type })
                    }
                    className={`py-3 rounded-2xl text-sm font-bold border transition cursor-pointer flex items-center justify-center gap-2 ${
                      formData.donationType === type
                        ? "bg-teal-500 text-slate-950 border-teal-500 shadow-lg shadow-teal-500/20"
                        : "bg-slate-950 text-gray-400 border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    {type === "MONEY" ? "💰 Financial Money" : "📦 Physical Items"}
                  </button>
                ))}
              </div>
            </div>

            {/* 💰 MONEY DONATION SECTION */}
            {formData.donationType === "MONEY" && (
              <div className="space-y-4">
                {/* Official Admin Payment Channels */}
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xs font-bold text-teal-400 uppercase tracking-wider">
                      Official Admin Payment Accounts
                    </h3>
                    <span className="text-[10px] text-gray-500">U Aung Aung</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {/* KBZPay */}
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 flex flex-col items-center justify-center text-center space-y-2">
                      <div className="w-20 h-20 bg-white p-1 rounded-xl shadow-md">
                        <img
                          src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=KBZPay:09775641239"
                          alt="KBZPay QR"
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <span className="text-xs font-bold text-blue-400">KBZ Pay</span>
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-gray-300 font-mono">09775641239</span>
                        <button
                          type="button"
                          onClick={() => handleCopyPhone("09775641239")}
                          className="text-gray-400 hover:text-teal-400 cursor-pointer"
                          title="Copy Phone"
                        >
                          {copiedPhone ? <Check className="w-3 h-3 text-teal-400" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                    </div>

                    {/* WavePay */}
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 flex flex-col items-center justify-center text-center space-y-2">
                      <div className="w-20 h-20 bg-white p-1 rounded-xl shadow-md">
                        <img
                          src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=WavePay:09775641239"
                          alt="WavePay QR"
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <span className="text-xs font-bold text-yellow-400">Wave Pay</span>
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-gray-300 font-mono">09775641239</span>
                        <button
                          type="button"
                          onClick={() => handleCopyPhone("09775641239")}
                          className="text-gray-400 hover:text-teal-400 cursor-pointer"
                          title="Copy Phone"
                        >
                          {copiedPhone ? <Check className="w-3 h-3 text-teal-400" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Amount Input */}
                <div>
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">
                    Amount (MMK) / လှူဒါန်းမည့် ပမာဏ *
                  </label>
                  <input
                    type="number"
                    name="amount"
                    required
                    placeholder="e.g. 10000"
                    value={formData.amount}
                    onChange={handleChange}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-2xl p-3 text-sm text-white focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* 📦 ITEMS DONATION SECTION */}
            {formData.donationType === "ITEMS" && (
              <div className="space-y-4">

                {/* Preset Item Category Picker */}
                <div>
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block">
                    Select Category / ပစ္စည်း အမျိုးအစား *
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {ITEM_CATEGORIES.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => handleCategorySelect(cat)}
                        className={`px-3 py-2 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                          selectedCategory === cat.id
                            ? "bg-teal-500 text-slate-950 border-teal-500"
                            : "bg-slate-950 text-gray-300 border-slate-800 hover:border-slate-700"
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Item Name (Custom if Others, or read-only/editable) */}
                <div>
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">
                    Item Name / ပစ္စည်းအမည် *
                  </label>
                  <input
                    type="text"
                    name="itemName"
                    required
                    placeholder="e.g. Paracetamol, Rice, Warm Blanket..."
                    value={formData.itemName}
                    onChange={handleChange}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-2xl p-3 text-sm text-white focus:outline-none"
                  />
                </div>

                {/* Quantity & Unit */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">
                      Quantity / အရေအတွက် *
                    </label>
                    <input
                      type="number"
                      name="quantity"
                      min="1"
                      step="any"
                      required
                      value={formData.quantity}
                      onChange={handleChange}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-2xl p-3 text-sm text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">
                      Unit / ရေတွက်ပုံ *
                    </label>
                    <select
                      name="unit"
                      value={formData.unit}
                      onChange={handleChange}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-2xl p-3 text-sm text-white focus:outline-none"
                    >
                      <option value="pcs">pcs (ခု)</option>
                      <option value="kg">kg (ကီလို)</option>
                      <option value="bottles">bottles (ပုလင်း)</option>
                      <option value="bags">bags (အိတ်)</option>
                      <option value="boxes">boxes (ဖာ)</option>
                      <option value="packets">packets (ထုပ်)</option>
                    </select>
                  </div>
                </div>

                {/* Item Condition */}
                <div>
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block">
                    Item Condition / ပစ္စည်း အခြေအနေ *
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { code: "NEW", label: "✨ New (အသစ်)" },
                      { code: "GOOD", label: "👍 Good (ကောင်းမွန်)" },
                      { code: "FAIR", label: "👌 Fair (သင့်တင့်)" },
                    ].map((c) => (
                      <button
                        key={c.code}
                        type="button"
                        onClick={() => setFormData({ ...formData, condition: c.code })}
                        className={`py-2 px-2 rounded-xl text-xs font-bold transition cursor-pointer border ${
                          formData.condition === c.code
                            ? "bg-teal-500 text-slate-950 border-teal-500"
                            : "bg-slate-950 text-gray-400 border-slate-800 hover:border-slate-700"
                        }`}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Handover Method (Deliver vs Pickup) */}
                <div>
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block">
                    Handover Method / လှူဒါန်းမည့် နည်းလမ်း *
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, handoverType: "DELIVER" })}
                      className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
                        formData.handoverType === "DELIVER"
                          ? "bg-teal-500/10 border-teal-500 text-teal-300"
                          : "bg-slate-950 border-slate-800 text-gray-400 hover:border-slate-700"
                      }`}
                    >
                      <span className="text-sm font-bold block">🏢 I will drop it off</span>
                      <span className="text-[10px] text-gray-400 block mt-0.5">ကိုယ်တိုင် လာရောက် ပို့ဆောင်မည်</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, handoverType: "PICKUP" })}
                      className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
                        formData.handoverType === "PICKUP"
                          ? "bg-teal-500/10 border-teal-500 text-teal-300"
                          : "bg-slate-950 border-slate-800 text-gray-400 hover:border-slate-700"
                      }`}
                    >
                      <span className="text-sm font-bold block">🚚 Request Pickup</span>
                      <span className="text-[10px] text-gray-400 block mt-0.5">လာရောက် ယူဆောင်ပေးပါ</span>
                    </button>
                  </div>
                </div>

                {/* If Pickup requested -> Street Address */}
                {formData.handoverType === "PICKUP" && (
                  <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl space-y-3">
                    <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">
                      📍 Pickup Address Details / ယူဆောင်ပေးရမည့် လိပ်စာ
                    </span>
                    <input
                      type="text"
                      name="streetAddress"
                      required
                      placeholder="e.g. No 45, Pyay Road, Ward 5"
                      value={formData.streetAddress}
                      onChange={handleChange}
                      className="w-full bg-slate-900 border border-slate-800 focus:border-teal-500 rounded-xl p-3 text-xs text-white focus:outline-none"
                    />
                  </div>
                )}

                {/* Township Selection */}
                <div>
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">
                    Your Township / မြို့နယ် *
                  </label>
                  <select
                    name="donorTownship"
                    required
                    value={formData.donorTownship}
                    onChange={handleChange}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-2xl p-3 text-sm text-white focus:outline-none"
                  >
                    <option value="">Select Township</option>
                    {myanmarTownships.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Contact Phone */}
                <div>
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">
                    Contact Phone Number / ဆက်သွယ်ရန် ဖုန်းနံပါတ် *
                  </label>
                  <input
                    type="text"
                    name="donorPhone"
                    required
                    placeholder="09xxxxxxxxx"
                    value={formData.donorPhone}
                    onChange={handleChange}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-2xl p-3 text-sm text-white focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* Proof Image Upload */}
            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">
                {formData.donationType === "MONEY"
                  ? "Payment Receipt Photo / ငွေလွှဲပြေစာ ဓာတ်ပုံ *"
                  : "Item Photo / ပစ္စည်း ဓာတ်ပုံ *"}
              </label>
              <div className="mt-1 flex items-center gap-4">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="block w-full text-xs text-slate-400 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-teal-500/10 file:text-teal-400 hover:file:bg-teal-500/20 transition cursor-pointer"
                />
                {uploading && <span className="text-xs text-teal-400 animate-pulse">Uploading...</span>}
              </div>

              {formData.proofImageUrl && (
                <div className="mt-3 relative w-full h-40 rounded-2xl overflow-hidden border border-slate-700 bg-slate-950">
                  <img src={formData.proofImageUrl} alt="Proof Preview" className="w-full h-full object-cover" />
                  <button 
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, proofImageUrl: "" }))}
                    className="absolute top-2 right-2 bg-rose-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-rose-600 transition shadow-md cursor-pointer"
                    title="Remove Image"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>

            {/* Anonymous Toggle */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="isAnonymous"
                name="isAnonymous"
                checked={formData.isAnonymous}
                onChange={handleChange}
                className="w-4 h-4 text-teal-500 rounded border-slate-800 bg-slate-950 focus:ring-teal-500 cursor-pointer"
              />
              <label htmlFor="isAnonymous" className="text-xs text-gray-300 cursor-pointer">
                Donate anonymously (အမည်မဖော်လိုပါ)
              </label>
            </div>

            <button
              type="submit"
              disabled={submitting || uploading}
              className="w-full bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 active:scale-95 text-slate-950 font-black py-3.5 rounded-2xl text-base transition cursor-pointer disabled:opacity-50 shadow-lg shadow-teal-500/20"
            >
              {submitting ? "Submitting Donation..." : "Confirm & Donate"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default DonateForm;
