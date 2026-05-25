import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

const TOWNSHIPS = [
  "Yangon",
  "Mandalay",
  "Naypyidaw",
  "Bago",
  "Mawlamyine",
  "Pathein",
  "Meiktila",
  "Myingyan",
  "Other",
];

function VolunteerApply() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    applicationNote: "",
    operatingTownship: "",
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
     setError("Please fill all fields.");
     return;
   }
   setSubmitting(true);
   setError("");
   try {
     // ✅ user မပါဘဲ form data သာ ပို့ — JWT ကနေ backend မှာ ယူမယ်
     await api.post("/volunteer-applications", {
       applicationNote: form.applicationNote,
       operatingTownship: form.operatingTownship,
       proofImageUrl: form.proofImageUrl,
     });
     setMessage("✅ Application submitted! Please wait for admin approval.");
     setTimeout(() => navigate("/dashboard"), 3000);
   } catch (err) {
     setError(err.response?.data || "Failed to submit application.");
   } finally {
     setSubmitting(false);
   }
 };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 flex justify-center items-start pt-10">
      <div className="max-w-md w-full bg-slate-900/50 border border-slate-800 p-6 rounded-2xl space-y-5 shadow-2xl">
        {/* Header */}
        <div className="space-y-1">
          <span className="text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded font-mono uppercase tracking-wider">
            Volunteer Program
          </span>
          <h2 className="text-xl font-bold text-white">
            🤝 Apply as Volunteer
          </h2>
          <p className="text-xs text-gray-400 leading-relaxed">
            Join our verified volunteer team. Admin will review your
            application.
          </p>
        </div>

        {/* What you'll do */}
        <div className="bg-blue-500/5 border border-blue-500/10 rounded-xl p-4 space-y-2">
          <p className="text-xs font-bold text-blue-400 uppercase tracking-wider">
            As a volunteer you will:
          </p>
          <ul className="text-xs text-gray-400 space-y-1">
            <li>📦 Receive item donations from donors in your township</li>
            <li>🏪 Store and deliver items to those in need</li>
            <li>📸 Confirm received donations with photo proof</li>
            <li>🔔 Get notified for new assignments</li>
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

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Operating Township */}
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">
              Your Operating Township
            </label>
            <select
              name="operatingTownship"
              required
              value={form.operatingTownship}
              onChange={handleChange}
              className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl p-3 text-sm text-white focus:outline-none"
            >
              <option value="">Select township you can serve</option>
              {TOWNSHIPS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* Application Note */}
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">
              Why do you want to volunteer?
            </label>
            <textarea
              name="applicationNote"
              required
              rows={4}
              placeholder="Tell us about yourself, your motivation, availability..."
              value={form.applicationNote}
              onChange={handleChange}
              className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl p-3 text-sm text-white focus:outline-none resize-none"
            />
          </div>

          {/* Proof Image */}
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">
              ID / Proof Image URL
            </label>
            <input
              type="text"
              name="proofImageUrl"
              required
              placeholder="Paste your ID card or proof image URL"
              value={form.proofImageUrl}
              onChange={handleChange}
              className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl p-3 text-sm text-white focus:outline-none font-mono text-xs"
            />
            <p className="text-[10px] text-gray-500 mt-1">
              * NRC card or any government ID image URL
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              className="w-1/3 bg-slate-950 hover:bg-slate-800 border border-slate-800 font-semibold py-3 rounded-xl text-sm transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="w-2/3 bg-gradient-to-r from-blue-500 to-teal-500 hover:from-blue-600 hover:to-teal-600 text-slate-950 font-black py-3 rounded-xl text-sm transition disabled:opacity-50 cursor-pointer"
            >
              {submitting ? "Submitting..." : "Submit Application"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default VolunteerApply;
