import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import nrcRawData from "../data/nrc_data.json";

// Add this temporarily after the import
console.log("NRC data length:", nrcRawData.length); // Should be 428
console.log("Sample:", nrcRawData[0]);

// ── NRC Constants ──────────────────────────────────────────
// Real Myanmar NRC has only 3 citizen types on the card
const NRC_TYPES = [
  { code: "N", label: "N", desc: "နိုင်ငံသား / Citizen" },
  { code: "E", label: "E", desc: "ဧည့်နိုင်ငံသား / Associate Citizen" },
  { code: "P", label: "P", desc: "နိုင်ငံသားပြုခွင့် / Naturalized Citizen" },
];

// 14 States/Divisions — codes 1-14
const NRC_STATES = [
  { code: "1", en: "Kachin State", mm: "ကချင်ပြည်နယ်" },
  { code: "2", en: "Kayah State", mm: "ကယားပြည်နယ်" },
  { code: "3", en: "Kayin State", mm: "ကရင်ပြည်နယ်" },
  { code: "4", en: "Chin State", mm: "ချင်းပြည်နယ်" },
  { code: "5", en: "Sagaing Region", mm: "စစ်ကိုင်းတိုင်းဒေသကြီး" },
  { code: "6", en: "Tanintharyi Region", mm: "တနင်္သာရီတိုင်းဒေသကြီး" },
  { code: "7", en: "Bago Region", mm: "ပဲခူးတိုင်းဒေသကြီး" },
  { code: "8", en: "Magway Region", mm: "မကွေးတိုင်းဒေသကြီး" },
  { code: "9", en: "Mandalay Region", mm: "မန္တလေးတိုင်းဒေသကြီး" },
  { code: "10", en: "Mon State", mm: "မွန်ပြည်နယ်" },
  { code: "11", en: "Rakhine State", mm: "ရခိုင်ပြည်နယ်" },
  { code: "12", en: "Yangon Region", mm: "ရန်ကုန်တိုင်းဒေသကြီး" },
  { code: "13", en: "Shan State", mm: "ရှမ်းပြည်နယ်" },
  { code: "14", en: "Ayeyarwady Region", mm: "ဧရာဝတီတိုင်းဒေသကြီး" },
];

// Address region map — maps state code → townships JSON key
const REGION_MAP = {
  1: "Kachin",
  2: "Kayah",
  3: "Kayin",
  4: "Chin",
  5: "Sagaing",
  6: "Tanintharyi",
  7: "Bago",
  8: "Magway",
  9: "Mandalay",
  10: "Mon",
  11: "Rakhine",
  12: "Yangon",
  13: "Shan",
  14: "Ayeyarwady",
};

const VEHICLE_TYPES = [
  { value: "Motorbike", icon: "🏍️" },
  { value: "Bicycle", icon: "🚲" },
  { value: "Car (Sedan)", icon: "🚗" },
  { value: "Car (SUV)", icon: "🚙" },
  { value: "Van", icon: "🚐" },
  { value: "Pickup Truck", icon: "🛻" },
  { value: "Truck", icon: "🚛" },
  { value: "Boat", icon: "⛵" },
];

// Wizard steps
const STEPS = [
  { key: "personal", label: "Personal", icon: "👤" },
  { key: "nrc", label: "NRC", icon: "🪪" },
  { key: "address", label: "Address", icon: "📍" },
  { key: "volunteer", label: "Volunteer", icon: "🤝" },
];

function ProfilePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [stepIndex, setStepIndex] = useState(0);
  const [stepErrors, setStepErrors] = useState({});

  const role = localStorage.getItem("role") || "";
  const isVolunteer =
    role === "ROLE_VOLUNTEER" || role === "ROLE_SENIOR_VOLUNTEER";

  const visibleSteps = isVolunteer
    ? STEPS
    : STEPS.filter((s) => s.key !== "volunteer");

  // NRC state
  const [nrcStateCode, setNrcStateCode] = useState("");
  const [nrcTownship, setNrcTownship] = useState("");
  const [nrcType, setNrcType] = useState("N");
  const [nrcNumber, setNrcNumber] = useState("");

  const [form, setForm] = useState({
    fullName: "",
    phoneNumber: "",
    dateOfBirth: "",
    gender: "",
    addressStateCode: "",
    township: "",
    streetAddress: "",
    postalCode: "",
    hasVehicle: false,
    vehicleType: [],
    emergencyContactName: "",
    emergencyContactPhone: "",
    profilePhotoUrl: "",
    skills: [],
    availableDays: [],
    availableTimes: [],
    yearsOfExperience: 0,
  });

  // ── Derived ────────────────────────────────────────────────
  // FIX: nrc_data.json may use numeric keys or string keys — coerce to string
  // REPLACE with this:
  const nrcTownships = nrcStateCode
    ? nrcRawData
        .filter((row) => row.state_code === nrcStateCode)
        .map((row) => ({
          code_en: row.township_code_en,
          name_en: row.township_en,
          name_mm: row.township_mm,
        }))
    : [];

  // With this — reuse nrc_data.json for address townships too:
  const addressTownships = form.addressStateCode
    ? nrcRawData
        .filter((row) => row.state_code === form.addressStateCode)
        .map((row) => ({ name_en: row.township_en, name_mm: row.township_mm }))
    : [];

  const nrcString =
    nrcStateCode && nrcTownship && nrcNumber && nrcNumber.length === 6
      ? `${nrcStateCode}/${nrcTownship}(${nrcType})${nrcNumber}`
      : "";

  // ── Load profile ───────────────────────────────────────────
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get("/profile");
        const d = res.data;

        if (d.nrc) {
          const m = d.nrc.match(/^(\d+)\/([A-Z]+)\(([A-Z])\)(\d+)$/);
          if (m) {
            setNrcStateCode(m[1]);
            setNrcTownship(m[2]);
            setNrcType(m[3]);
            setNrcNumber(m[4]);
          }
        }

        const savedStateCode =
          Object.entries(REGION_MAP).find(([, v]) => v === d.division)?.[0] ||
          "";

        setForm({
          fullName: d.fullName || "",
          phoneNumber: d.phoneNumber || "",
          dateOfBirth: d.dateOfBirth || "",
          gender: d.gender || "",
          addressStateCode: savedStateCode,
          township: d.township || "",
          streetAddress: d.streetAddress || "",
          postalCode: d.postalCode || "",
          hasVehicle: d.hasVehicle || false,
          vehicleType: d.vehicleType
            ? Array.isArray(d.vehicleType)
              ? d.vehicleType
              : d.vehicleType.split(",").map((v) => v.trim())
            : [],
          emergencyContactName: d.emergencyContactName || "",
          emergencyContactPhone: d.emergencyContactPhone || "",
          profilePhotoUrl: d.profilePhotoUrl || "",
          // ✅ Add these:
          skills: d.skills
            ? Array.isArray(d.skills)
              ? d.skills
              : d.skills.split(",").map((v) => v.trim())
            : [],
          availableDays: d.availableDays
            ? Array.isArray(d.availableDays)
              ? d.availableDays
              : d.availableDays.split(",").map((v) => v.trim())
            : [],
          availableTimes: d.availableTimes
            ? Array.isArray(d.availableTimes)
              ? d.availableTimes
              : d.availableTimes.split(",").map((v) => v.trim())
            : [],
          yearsOfExperience: d.yearsOfExperience || 0,
        });
      } catch {
        setError("Profile ဆွဲယူလို့ မရဘူး။");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
      ...(name === "addressStateCode" ? { township: "" } : {}),
    }));
    // Clear error for that field
    setStepErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const toggleVehicle = (v) => {
    setForm((prev) => ({
      ...prev,
      vehicleType: prev.vehicleType.includes(v)
        ? prev.vehicleType.filter((x) => x !== v)
        : [...prev.vehicleType, v],
    }));
  };

  // ── ဒီနေရာမှာ ထည့် ──────────────────────
  const toggleSkill = (v) => {
    setForm((prev) => ({
      ...prev,
      skills: prev.skills.includes(v)
        ? prev.skills.filter((x) => x !== v)
        : [...prev.skills, v],
    }));
  };

  const toggleDay = (v) => {
    setForm((prev) => ({
      ...prev,
      availableDays: prev.availableDays.includes(v)
        ? prev.availableDays.filter((x) => x !== v)
        : [...prev.availableDays, v],
    }));
  };

  const toggleTime = (v) => {
    setForm((prev) => ({
      ...prev,
      availableTimes: prev.availableTimes.includes(v)
        ? prev.availableTimes.filter((x) => x !== v)
        : [...prev.availableTimes, v],
    }));
  };

  // ── Validation per step ────────────────────────────────────
  const validateStep = (stepKey) => {
    const errs = {};
    if (stepKey === "personal") {
      if (!form.fullName.trim()) errs.fullName = "Full name လိုအပ်သည်";
      if (!form.phoneNumber.trim()) errs.phoneNumber = "Phone number လိုအပ်သည်";
      if (!form.gender) errs.gender = "Gender ရွေးပါ";
    }
    if (stepKey === "nrc") {
      // NRC is optional — but if partially filled, flag it
      const anyFilled = nrcStateCode || nrcTownship || nrcNumber;
      if (anyFilled) {
        if (!nrcStateCode) errs.nrcState = "State/Division ရွေးပါ";
        if (!nrcTownship) errs.nrcTownship = "Township ရွေးပါ";
        if (nrcNumber.length > 0 && nrcNumber.length < 6)
          errs.nrcNumber = "ID Number ၆ လုံး ဖြည့်ပါ";
      }
    }
    if (stepKey === "address") {
      if (!form.addressStateCode)
        errs.addressStateCode = "State/Division ရွေးပါ";
      if (!form.township) errs.township = "Township ရွေးပါ";
      if (!form.streetAddress.trim())
        errs.streetAddress = "Street address လိုအပ်သည်";
    }
    return errs;
  };

  const handleNext = () => {
    const currentKey = visibleSteps[stepIndex].key;
    const errs = validateStep(currentKey);
    if (Object.keys(errs).length > 0) {
      setStepErrors(errs);
      return;
    }
    setStepErrors({});
    setStepIndex((i) => Math.min(i + 1, visibleSteps.length - 1));
  };

  const handleBack = () => {
    setStepErrors({});
    setStepIndex((i) => Math.max(i - 1, 0));
  };

  const handleSave = async () => {
    const lastKey = visibleSteps[visibleSteps.length - 1].key;
    const errs = validateStep(lastKey);
    if (Object.keys(errs).length > 0) {
      setStepErrors(errs);
      return;
    }

    setSaving(true);
    setError("");

    try {
      const divisionName = REGION_MAP[form.addressStateCode] || "";

      const payload = {
        fullName: form.fullName,
        phoneNumber: form.phoneNumber,
        nrc: nrcString || null,
        dateOfBirth: form.dateOfBirth || null,
        gender: form.gender || null,
        division: divisionName,
        township: form.township,
        streetAddress: form.streetAddress,
        postalCode: form.postalCode || null,
        hasVehicle: form.hasVehicle,
        vehicleType: form.vehicleType.join(", "),
        emergencyContactName: form.emergencyContactName || null,
        emergencyContactPhone: form.emergencyContactPhone || null,
        profilePhotoUrl: form.profilePhotoUrl || null,

        skills: form.skills.length > 0 ? form.skills.join(", ") : null,
        availableDays:
          form.availableDays.length > 0 ? form.availableDays.join(", ") : null,
        availableTimes:
          form.availableTimes.length > 0
            ? form.availableTimes.join(", ")
            : null,
        yearsOfExperience: form.yearsOfExperience,
      };

      console.log("🔍 FINAL PAYLOAD BEING SENT:", payload);

      const res = await api.put("/profile", payload);
      console.log("✅ Server Response:", res.data);

      localStorage.setItem("profileCompleted", "true");
      setSuccess(true);

      setTimeout(() => navigate("/dashboard"), 1200);
    } catch (err) {
      console.error("❌ Save Error:", err.response?.data || err.message);
      setError("Save မအောင်မြင်ဘူး။ ထပ်ကြိုးစားပါ။");
    } finally {
      setSaving(false);
    }
  };

  // ── Styles ─────────────────────────────────────────────────
  const inp = (hasErr) =>
    `w-full mt-1 bg-slate-800/80 border ${hasErr ? "border-rose-500" : "border-slate-700"} rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 transition`;
  const sel = (hasErr) =>
    `w-full mt-1 bg-slate-800/80 border ${hasErr ? "border-rose-500" : "border-slate-700"} rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-teal-500 transition`;
  const lbl = "text-[10px] text-slate-400 font-mono uppercase tracking-widest";
  const errMsg = (key) =>
    stepErrors[key] ? (
      <p className="text-[10px] text-rose-400 mt-1">{stepErrors[key]}</p>
    ) : null;

  const currentStep = visibleSteps[stepIndex];
  const isLastStep = stepIndex === visibleSteps.length - 1;

  if (loading)
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-slate-400 font-mono text-xs tracking-widest uppercase">
            Loading profile...
          </p>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Navbar */}
      <nav className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800/60 px-6 py-4 flex justify-between items-center sticky top-0 z-50">
        <h1 className="text-xl font-bold bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent">
          👤 My Profile
        </h1>
        <button
          onClick={() => navigate("/dashboard")}
          className="text-sm text-slate-400 hover:text-white transition cursor-pointer"
        >
          ← Back
        </button>
      </nav>

      <div className="max-w-2xl mx-auto p-6 space-y-5">
        {/* Success / Error banners */}
        {success && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 text-center">
            <p className="text-emerald-400 font-bold">
              ✅ Profile သိမ်းပြီးပြီ!
            </p>
          </div>
        )}
        {error && (
          <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-4">
            <p className="text-rose-400 text-sm">{error}</p>
          </div>
        )}

        {/* NRC live preview — always visible */}
        <div
          className={`rounded-2xl p-3 text-center border transition-all ${
            nrcString
              ? "bg-teal-500/10 border-teal-500/30"
              : "bg-slate-900/30 border-slate-800"
          }`}
        >
          <p className="text-[10px] text-slate-500 font-mono tracking-widest uppercase">
            NRC Preview
          </p>
          <p
            className={`font-mono font-bold text-lg mt-0.5 tracking-wider ${nrcString ? "text-teal-400" : "text-slate-600"}`}
          >
            {nrcString || "— NRC မဖြည့်ရသေးဘူး —"}
          </p>
        </div>

        {/* Step Progress Bar */}
        <div className="relative">
          {/* Line */}
          <div className="absolute top-4 left-0 right-0 h-0.5 bg-slate-800 mx-8" />
          <div
            className="absolute top-4 left-0 h-0.5 bg-gradient-to-r from-teal-500 to-emerald-400 mx-8 transition-all duration-500"
            style={{
              width: `${(stepIndex / (visibleSteps.length - 1)) * (100 - 16)}%`,
            }}
          />
          {/* Steps */}
          <div className="relative flex justify-between">
            {visibleSteps.map((s, i) => {
              const done = i < stepIndex;
              const current = i === stepIndex;
              return (
                <div key={s.key} className="flex flex-col items-center gap-1.5">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm border-2 transition-all duration-300 ${
                      done
                        ? "bg-teal-500 border-teal-500 text-white"
                        : current
                          ? "bg-slate-900 border-teal-500 text-teal-400 shadow-[0_0_12px_rgba(20,184,166,0.4)]"
                          : "bg-slate-900 border-slate-700 text-slate-600"
                    }`}
                  >
                    {done ? "✓" : s.icon}
                  </div>
                  <span
                    className={`text-[9px] font-mono uppercase tracking-wider ${
                      current
                        ? "text-teal-400"
                        : done
                          ? "text-slate-400"
                          : "text-slate-600"
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── PERSONAL ── */}
        {currentStep.key === "personal" && (
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h2 className={`${lbl} mb-1`}>👤 Personal Info</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className={lbl}>Full Name *</label>
                <input
                  name="fullName"
                  value={form.fullName}
                  onChange={handleChange}
                  placeholder="အမည်အပြည့်"
                  className={inp(stepErrors.fullName)}
                />
                {errMsg("fullName")}
              </div>
              <div>
                <label className={lbl}>Phone Number *</label>
                <input
                  name="phoneNumber"
                  value={form.phoneNumber}
                  onChange={handleChange}
                  placeholder="09xxxxxxxxx"
                  className={inp(stepErrors.phoneNumber)}
                />
                {errMsg("phoneNumber")}
              </div>
              <div>
                <label className={lbl}>Date of Birth</label>
                <input
                  name="dateOfBirth"
                  type="date"
                  value={form.dateOfBirth}
                  onChange={handleChange}
                  className={inp(false)}
                />
              </div>
              <div className="col-span-2">
                <label className={lbl}>Gender *</label>
                <select
                  name="gender"
                  value={form.gender}
                  onChange={handleChange}
                  className={sel(stepErrors.gender)}
                >
                  <option value="">ရွေးပါ</option>
                  <option value="MALE">Male (ကျား)</option>
                  <option value="FEMALE">Female (မ)</option>
                  <option value="OTHER">Other</option>
                </select>
                {errMsg("gender")}
              </div>
            </div>
          </div>
        )}

        {/* ── NRC ── */}
        {currentStep.key === "nrc" && (
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div>
              <h2 className={`${lbl} mb-1`}>🪪 NRC Number</h2>
              <p className="text-[11px] text-slate-500 mt-1">
                Format:{" "}
                <span className="text-teal-400 font-mono">
                  12/AHLANA(N)123456
                </span>
                <span className="ml-2 text-slate-600">(optional)</span>
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Step 1 — State 1-14 */}
              <div className="col-span-2">
                <label className={lbl}>
                  ① State / Division (ပြည်နယ် / တိုင်းဒေသကြီး)
                </label>
                <select
                  value={nrcStateCode}
                  onChange={(e) => {
                    setNrcStateCode(e.target.value);
                    setNrcTownship("");
                  }}
                  className={sel(stepErrors.nrcState)}
                >
                  <option value="">ရွေးပါ</option>
                  {NRC_STATES.map((s) => (
                    <option key={s.code} value={s.code}>
                      {s.code}/ — {s.en} ({s.mm})
                    </option>
                  ))}
                </select>
                {errMsg("nrcState")}
                {nrcStateCode && nrcTownships.length === 0 && (
                  <p className="text-[10px] text-amber-400 mt-1">
                    ⚠️ Township data not found for state {nrcStateCode}. Check
                    nrc_data.json keys.
                  </p>
                )}
              </div>

              {/* Step 2 — Township Code */}
              <div className="col-span-2">
                <label className={lbl}>② Township Code (မြို့နယ်ကုဒ်)</label>
                <select
                  value={nrcTownship}
                  onChange={(e) => setNrcTownship(e.target.value)}
                  disabled={!nrcStateCode || nrcTownships.length === 0}
                  className={`${sel(stepErrors.nrcTownship)} disabled:opacity-40`}
                >
                  <option value="">
                    {nrcStateCode && nrcTownships.length === 0
                      ? "— Township data မရှိဘူး —"
                      : "— State/Division အရင်ရွေးပါ —"}
                  </option>
                  {nrcTownships.map((t) => (
                    <option
                      key={t.code_en || t.code}
                      value={t.code_en || t.code}
                    >
                      {t.code_en || t.code}
                      {t.name_en ? ` — ${t.name_en}` : ""}
                      {t.name_mm ? ` (${t.name_mm})` : ""}
                    </option>
                  ))}
                </select>
                {errMsg("nrcTownship")}
              </div>

              {/* Step 3 — Type: only N, E, P */}
              <div className="col-span-2">
                <label className={lbl}>
                  ③ Citizen Type (နိုင်ငံသားအမျိုးအစား)
                </label>
                <div className="flex gap-3 mt-2">
                  {NRC_TYPES.map((t) => (
                    <button
                      key={t.code}
                      type="button"
                      onClick={() => setNrcType(t.code)}
                      className={`flex-1 py-2.5 rounded-xl border text-sm font-mono font-bold transition cursor-pointer ${
                        nrcType === t.code
                          ? "bg-teal-500/20 border-teal-500 text-teal-400"
                          : "bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500"
                      }`}
                    >
                      ({t.code})
                      <p className="text-[9px] font-normal mt-0.5 opacity-70 truncate px-1">
                        {t.desc}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 4 — Number */}
              <div className="col-span-2">
                <label className={lbl}>④ ID Number (နံပါတ် — 6 လုံး)</label>
                <input
                  value={nrcNumber}
                  onChange={(e) =>
                    setNrcNumber(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  placeholder="123456"
                  maxLength={6}
                  className={inp(stepErrors.nrcNumber)}
                />
                {nrcNumber && nrcNumber.length < 6 && (
                  <p className="text-[10px] text-amber-400 mt-1">
                    {6 - nrcNumber.length} လုံး ထပ်ဖြည့်ရန် ကျန်သေးသည်
                  </p>
                )}
                {errMsg("nrcNumber")}
              </div>
            </div>

            {/* Preview Box */}
            <div
              className={`rounded-xl p-4 text-center border transition-all ${
                nrcString
                  ? "bg-teal-500/10 border-teal-500/30"
                  : "bg-slate-800 border-slate-700"
              }`}
            >
              <p className="text-[10px] text-slate-500 font-mono mb-1 uppercase tracking-widest">
                ✅ Complete NRC
              </p>
              <p
                className={`font-mono font-bold text-xl tracking-wider ${nrcString ? "text-teal-400" : "text-slate-600"}`}
              >
                {nrcString || "မဖြည့်ရသေးဘူး"}
              </p>
              {nrcString && (
                <p className="text-[10px] text-slate-500 mt-2">
                  {NRC_STATES.find((s) => s.code === nrcStateCode)?.mm} •{" "}
                  {
                    nrcTownships.find(
                      (t) => (t.code_en || t.code) === nrcTownship,
                    )?.name_mm
                  }{" "}
                  • {NRC_TYPES.find((t) => t.code === nrcType)?.desc}
                </p>
              )}
            </div>
          </div>
        )}

        {/* ── ADDRESS ── */}
        {currentStep.key === "address" && (
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h2 className={`${lbl} mb-1`}>📍 Address</h2>
            <div className="grid grid-cols-2 gap-4">
              {/* State/Division — exactly 14 */}
              <div className="col-span-2">
                <label className={lbl}>
                  State / Division * (ပြည်နယ် / တိုင်းဒေသကြီး)
                </label>
                <select
                  name="addressStateCode"
                  value={form.addressStateCode}
                  onChange={handleChange}
                  className={sel(stepErrors.addressStateCode)}
                >
                  <option value="">ရွေးပါ</option>
                  {NRC_STATES.map((s) => (
                    <option key={s.code} value={s.code}>
                      {s.en} ({s.mm})
                    </option>
                  ))}
                </select>
                {errMsg("addressStateCode")}
              </div>

              {/* Township */}
              <div className="col-span-2">
                <label className={lbl}>Township * (မြို့နယ်)</label>
                <select
                  name="township"
                  value={form.township}
                  onChange={handleChange}
                  disabled={!form.addressStateCode}
                  className={`${sel(stepErrors.township)} disabled:opacity-40`}
                >
                  <option value="">
                    {form.addressStateCode && addressTownships.length === 0
                      ? "— Township data မရှိဘူး —"
                      : "— State/Division အရင်ရွေးပါ —"}
                  </option>
                  {addressTownships.map((t) => (
                    <option key={t.name_en || t} value={t.name_en || t}>
                      {t.name_en || t}
                      {t.name_mm ? ` (${t.name_mm})` : ""}
                    </option>
                  ))}
                </select>
                {errMsg("township")}
                {form.addressStateCode && addressTownships.length === 0 && (
                  <p className="text-[10px] text-amber-400 mt-1">
                    ⚠️ No townships found for key "{addressRegionKey}" in
                    townships_data.json
                  </p>
                )}
              </div>

              <div className="col-span-2">
                <label className={lbl}>
                  Street Address * (လမ်း / အိမ်နံပါတ်)
                </label>
                <textarea
                  name="streetAddress"
                  value={form.streetAddress}
                  onChange={handleChange}
                  placeholder="ဥပမာ — အမှတ် ၁၂၃၊ ဗိုလ်ချုပ်လမ်း"
                  rows={2}
                  className={`${inp(stepErrors.streetAddress)} resize-none`}
                />
                {errMsg("streetAddress")}
              </div>

              <div>
                <label className={lbl}>Postal Code</label>
                <input
                  name="postalCode"
                  value={form.postalCode}
                  onChange={handleChange}
                  placeholder="11xxx"
                  className={inp(false)}
                />
              </div>
            </div>
          </div>
        )}

        {/* ── VOLUNTEER ── */}
        {currentStep.key === "volunteer" && isVolunteer && (
          <div className="bg-slate-900/50 border border-blue-500/20 rounded-2xl p-5 space-y-5">
            <h2 className="text-[10px] text-blue-400 uppercase tracking-widest font-mono mb-1">
              🤝 Volunteer Info
            </h2>

            {/* ── SKILLS ── */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 space-y-3">
              <h2 className={`${lbl}`}>
                <span className="mr-1">🛠</span> Skills ကျွမ်းကျင်မှုများ — MANY
                SELECT
              </h2>
              <div className="flex flex-wrap gap-2">
                {[
                  "First Aid",
                  "Driving",
                  "Heavy Lifting",
                  "Medical",
                  "Cooking",
                  "Translation",
                  "Photography",
                  "IT / Tech",
                  "Child Care",
                  "Counselling",
                ].map((s) => (
                  <div
                    key={s}
                    onClick={() => toggleSkill(s)}
                    className={`px-4 py-2 rounded-full border text-sm cursor-pointer transition ${
                      form.skills.includes(s)
                        ? "bg-teal-500/15 border-teal-500/60 text-teal-300"
                        : "bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500"
                    }`}
                  >
                    {s}
                  </div>
                ))}
              </div>
            </div>

            {/* ── AVAILABILITY ── */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 space-y-3">
              <h2 className={`${lbl}`}>
                <span className="mr-1">📅</span> Availability ရနိုင်သောအချိန်
              </h2>
              <p className={`${lbl}`}>DAYS ရက် — ရက်များ</p>
              <div className="flex flex-wrap gap-2">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                  <div
                    key={d}
                    onClick={() => toggleDay(d)}
                    className={`w-12 py-2 text-center rounded-xl border text-sm font-mono cursor-pointer transition ${
                      form.availableDays.includes(d)
                        ? "bg-teal-500/15 border-teal-500/60 text-teal-300"
                        : "bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500"
                    }`}
                  >
                    {d}
                  </div>
                ))}
              </div>
              <p className={`${lbl} pt-1`}>TIME SLOTS အချိန်</p>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { v: "Morning", icon: "🌅", sub: "6am–12pm" },
                  { v: "Afternoon", icon: "☀️", sub: "12pm–6pm" },
                  { v: "Evening", icon: "🌙", sub: "6pm–10pm" },
                ].map(({ v, icon, sub }) => (
                  <div
                    key={v}
                    onClick={() => toggleTime(v)}
                    className={`flex flex-col items-center gap-1 py-3 rounded-xl border text-sm cursor-pointer transition ${
                      form.availableTimes.includes(v)
                        ? "bg-teal-500/15 border-teal-500/60 text-teal-300"
                        : "bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500"
                    }`}
                  >
                    <span className="text-xl">{icon}</span>
                    <span className="font-medium">{v}</span>
                    <span className="text-[10px] opacity-60">{sub}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Has vehicle toggle */}
            <div
              onClick={() =>
                setForm((prev) => ({
                  ...prev,
                  hasVehicle: !prev.hasVehicle,
                  vehicleType: [],
                }))
              }
              className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition ${
                form.hasVehicle
                  ? "bg-teal-500/10 border-teal-500/40"
                  : "bg-slate-800 border-slate-700 hover:border-slate-600"
              }`}
            >
              <div>
                <p className="text-sm text-white font-medium">
                  ယာဉ် ရှိသည် (I have a vehicle)
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Select all vehicle types you own
                </p>
              </div>
              <div
                className={`w-11 h-6 rounded-full transition-all relative ${form.hasVehicle ? "bg-teal-500" : "bg-slate-700"}`}
              >
                <div
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${form.hasVehicle ? "left-6" : "left-1"}`}
                />
              </div>
            </div>

            {/* Vehicle type multi-select */}
            {form.hasVehicle && (
              <div>
                <label className={`${lbl} mb-2 block`}>
                  Vehicle Types (များစွာ ရွေးနိုင်သည်)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {VEHICLE_TYPES.map(({ value, icon }) => (
                    <div
                      key={value}
                      onClick={() => toggleVehicle(value)}
                      className={`flex items-center gap-3 px-3 py-3 rounded-xl border cursor-pointer transition ${
                        form.vehicleType.includes(value)
                          ? "bg-teal-500/15 border-teal-500/60 text-teal-300"
                          : "bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600"
                      }`}
                    >
                      <span className="text-xl">{icon}</span>
                      <span className="text-sm">{value}</span>
                      {form.vehicleType.includes(value) && (
                        <span className="ml-auto text-teal-400 text-xs">✓</span>
                      )}
                    </div>
                  ))}
                </div>
                {form.vehicleType.length > 0 && (
                  <p className="text-[10px] text-teal-400 font-mono mt-2">
                    Selected: {form.vehicleType.join(", ")}
                  </p>
                )}
              </div>
            )}

            {/* ── EXPERIENCE ── */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 space-y-3">
              <h2 className={`${lbl}`}>
                <span className="mr-1">⏱</span> Experience အတွေ့အကြုံ
              </h2>
              <p className={`${lbl}`}>YEARS OF VOLUNTEER EXPERIENCE နှစ်</p>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setForm((p) => ({
                      ...p,
                      yearsOfExperience: Math.max(0, p.yearsOfExperience - 1),
                    }))
                  }
                  className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 text-white text-lg cursor-pointer hover:border-slate-500 transition"
                >
                  −
                </button>
                <span className="text-lg font-bold text-white w-8 text-center">
                  {form.yearsOfExperience}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setForm((p) => ({
                      ...p,
                      yearsOfExperience: p.yearsOfExperience + 1,
                    }))
                  }
                  className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 text-white text-lg cursor-pointer hover:border-slate-500 transition"
                >
                  +
                </button>
                <span className="text-xs text-slate-500">နှစ် / years</span>
              </div>
            </div>

            {/* Emergency contacts */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={lbl}>Emergency Contact Name</label>
                <input
                  name="emergencyContactName"
                  value={form.emergencyContactName}
                  onChange={handleChange}
                  placeholder="အမည်"
                  className={inp(false)}
                />
              </div>
              <div>
                <label className={lbl}>Emergency Contact Phone</label>
                <input
                  name="emergencyContactPhone"
                  value={form.emergencyContactPhone}
                  onChange={handleChange}
                  placeholder="09xxxxxxxxx"
                  className={inp(false)}
                />
              </div>
            </div>
          </div>
        )}

        {/* ── Navigation ── */}
        <div
          className={`flex gap-3 ${stepIndex > 0 ? "justify-between" : "justify-end"}`}
        >
          {stepIndex > 0 && (
            <button
              onClick={handleBack}
              className="px-6 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-semibold rounded-xl text-sm transition cursor-pointer"
            >
              ← Back
            </button>
          )}
          {!isLastStep ? (
            <button
              onClick={handleNext}
              className="flex-1 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold py-3 rounded-xl text-sm transition cursor-pointer"
            >
              Next →
            </button>
          ) : (
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 bg-teal-500 hover:bg-teal-400 disabled:bg-teal-500/30 text-slate-950 font-bold py-3 rounded-xl text-sm transition cursor-pointer"
            >
              {saving ? "Saving..." : "💾 Save Profile"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;
