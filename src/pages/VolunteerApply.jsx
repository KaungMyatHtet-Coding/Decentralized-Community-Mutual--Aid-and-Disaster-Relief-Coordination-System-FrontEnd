import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import api from "../api";
import { YANGON_TOWNSHIPS } from "../constants";
import { useLanguage } from "../contexts/LanguageContext";

function VolunteerApply() {
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const userTownship = localStorage.getItem("township") || "";
  const profileCompleted = localStorage.getItem("profileCompleted") === "true";

  const [form, setForm] = useState({
    applicationNote: "",
    operatingTownship: userTownship,
    proofImageUrl: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (
      !form.applicationNote ||
      !form.operatingTownship ||
      !form.proofImageUrl
    ) {
      setError(lang === "en" ? "Please fill all fields." : "ကျေးဇူးပြု၍ အချက်အလက်များ ပြည့်စုံစွာ ဖြည့်ပါ။");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await api.post("/volunteer-applications", {
        applicationNote: form.applicationNote,
        operatingTownship: form.operatingTownship,
        proofImageUrl: form.proofImageUrl,
      });
      setMessage(lang === "en" ? "✅ Application submitted! Please wait for admin approval." : "✅ လျှောက်လွှာတင်ပြီးပါပြီ။ အက်ဒမင် အတည်ပြုချက်ကို စောင့်ဆိုင်းပေးပါ။");
      setTimeout(() => navigate("/dashboard"), 3000);
    } catch (err) {
      setError(err.response?.data || (lang === "en" ? "Failed to submit application." : "လျှောက်လွှာတင်ခြင်း မအောင်မြင်ပါ။"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 flex justify-center items-start pt-10">
      <div className="max-w-md w-full space-y-4">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="text-gray-400 hover:text-white flex items-center gap-2 font-semibold transition w-fit"
        >
          <ArrowLeft className="w-5 h-5" /> Back
        </button>
        
        <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl space-y-5 shadow-2xl">
        {/* Header */}
        <div className="space-y-1">
          <span className="text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded font-mono uppercase tracking-wider">
            {lang === "en" ? "Volunteer Program" : "စေတနာ့ဝန်ထမ်း အစီအစဉ်"}
          </span>
          <h2 className="text-xl font-bold text-white">
            🤝 {lang === "en" ? "Apply as Volunteer" : "စေတနာ့ဝန်ထမ်း လျှောက်ထားရန်"}
          </h2>
          <p className="text-xs text-gray-400 leading-relaxed">
            {lang === "en" 
              ? "Join our verified volunteer team. Admin will review your application." 
              : "အသိအမှတ်ပြု စေတနာ့ဝန်ထမ်းအဖွဲ့တွင် ပါဝင်ပါ။ သင့်လျှောက်လွှာကို အက်ဒမင်မှ စစ်ဆေးပါမည်။"}
          </p>
        </div>

        {/* What you'll do */}
        <div className="bg-blue-500/5 border border-blue-500/10 rounded-xl p-4 space-y-2">
          <p className="text-xs font-bold text-blue-400 uppercase tracking-wider">
            {lang === "en" ? "As a volunteer you will:" : "စေတနာ့ဝန်ထမ်း တစ်ဦးအနေဖြင့် -"}
          </p>
          <ul className="text-xs text-gray-400 space-y-1">
            <li>📦 {lang === "en" ? "Receive item donations from donors in your township" : "မိမိမြို့နယ်အတွင်းရှိ အလှူရှင်များထံမှ ပစ္စည်းများ လက်ခံရယူခြင်း"}</li>
            <li>🏪 {lang === "en" ? "Store and deliver items to those in need" : "လိုအပ်သူများထံသို့ သိမ်းဆည်း၊ ပို့ဆောင်ပေးခြင်း"}</li>
            <li>📸 {lang === "en" ? "Confirm received donations with photo proof" : "လက်ခံရရှိမှုများကို ဓာတ်ပုံမှတ်တမ်းဖြင့် အတည်ပြုခြင်း"}</li>
            <li>🔔 {lang === "en" ? "Get notified for new assignments" : "တာဝန်အသစ်များအတွက် အသိပေးချက်များ လက်ခံရရှိခြင်း"}</li>
          </ul>
        </div>

        {/* Messages */}
        {message && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 rounded-xl text-xs text-center animate-pulse">
            {message}
          </div>
        )}
        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3 rounded-xl text-xs text-center">
            {error}
          </div>
        )}

        {!profileCompleted ? (
          <div className="bg-amber-500/10 border border-amber-500/20 p-5 rounded-2xl text-center space-y-4">
            <div className="text-4xl">⚠️</div>
            <div>
              <p className="text-sm text-amber-400 font-bold mb-1">
                {lang === "en" ? "Profile Incomplete" : "ပရိုဖိုင် မပြည့်စုံသေးပါ"}
              </p>
              <p className="text-xs text-amber-200/70">
                {lang === "en" 
                  ? "Please complete your Profile (NRC, Address) before applying to be a volunteer." 
                  : "စေတနာ့ဝန်ထမ်း လျှောက်ထားရန် သင်၏ ပရိုဖိုင် (မှတ်ပုံတင်၊ လိပ်စာ) ကို အရင်ဖြည့်စွက်ပေးပါ။"}
              </p>
            </div>
            <button
              onClick={() => navigate("/profile")}
              className="bg-amber-500 hover:bg-amber-400 text-amber-950 font-bold px-6 py-2.5 rounded-xl text-sm transition"
            >
              {lang === "en" ? "Go to Profile →" : "ပရိုဖိုင်သို့ သွားမည် →"}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
          {/* Operating Township */}
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">
              {lang === "en" ? "Your Operating Township" : "သင်တာဝန်ယူမည့် မြို့နယ်"}
            </label>
            <select
              name="operatingTownship"
              required
              value={form.operatingTownship}
              onChange={handleChange}
              className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl p-3 text-sm text-white focus:outline-none"
            >
              <option value="">
                {lang === "en" ? "Select township you can serve" : "တာဝန်ထမ်းဆောင်မည့် မြို့နယ်ကို ရွေးချယ်ပါ"}
              </option>
              {YANGON_TOWNSHIPS.map((t) => (
                <option key={t.en} value={t.en}>
                  {lang === "en" ? t.en : t.my}
                </option>
              ))}
            </select>
          </div>

          {/* Application Note */}
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">
              {lang === "en" ? "Why do you want to volunteer?" : "စေတနာ့ဝန်ထမ်း အဘယ်ကြောင့် လုပ်လိုသနည်း။"}
            </label>
            <textarea
              name="applicationNote"
              required
              rows={4}
              placeholder={lang === "en" ? "Tell us about yourself, your motivation, availability..." : "သင်၏ အချက်အလက်များ၊ ရည်ရွယ်ချက်နှင့် အချိန်ပေးနိုင်မှုတို့ကို ရေးသားပါ..."}
              value={form.applicationNote}
              onChange={handleChange}
              className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl p-3 text-sm text-white focus:outline-none resize-none"
            />
          </div>

          {/* Proof Image */}
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">
              {lang === "en" ? "ID / Proof Image URL" : "မှတ်ပုံတင် / အထောက်အထား ဓာတ်ပုံ URL"}
            </label>
            <input
              type="text"
              name="proofImageUrl"
              required
              placeholder={lang === "en" ? "Paste your ID card or proof image URL" : "မှတ်ပုံတင် (သို့) အထောက်အထား ဓာတ်ပုံလင့်ခ်ကို ထည့်ပါ"}
              value={form.proofImageUrl}
              onChange={handleChange}
              className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl p-3 text-sm text-white focus:outline-none font-mono text-xs"
            />
            <p className="text-[10px] text-gray-500 mt-1">
              * {lang === "en" ? "NRC card or any government ID image URL" : "နိုင်ငံသားစိစစ်ရေးကတ် (သို့) အစိုးရအသိအမှတ်ပြု ကတ်တစ်ခုခု"}
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              className="w-1/3 bg-slate-950 hover:bg-slate-800 border border-slate-800 font-semibold py-3 rounded-xl text-sm transition cursor-pointer"
            >
              {lang === "en" ? "Cancel" : "ပယ်ဖျက်မည်"}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="w-2/3 bg-gradient-to-r from-blue-500 to-teal-500 hover:from-blue-600 hover:to-teal-600 text-slate-950 font-black py-3 rounded-xl text-sm transition disabled:opacity-50 cursor-pointer"
            >
              {submitting ? (lang === "en" ? "Submitting..." : "တင်နေပါသည်...") : (lang === "en" ? "Submit Application" : "လျှောက်လွှာတင်မည်")}
            </button>
          </div>
        </form>
        )}
        </div>
      </div>
    </div>
  );
}

export default VolunteerApply;
