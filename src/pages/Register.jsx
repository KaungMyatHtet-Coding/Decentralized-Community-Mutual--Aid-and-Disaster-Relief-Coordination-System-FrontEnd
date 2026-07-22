import {useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import api from "../api";

function Register() {
  const YANGON_TOWNSHIPS = [
    "Ahlon (အလုံ)", "Bahan (ဗဟန်း)", "Botataung (ဗိုလ်တထောင်)", "Dagon (ဒဂုံ)",
    "Dagon Seikkan (ဒဂုံဆိပ်ကမ်း)", "Dawbon (ဒေါပုံ)", "East Dagon (ဒဂုံအရှေ့ပိုင်း)",
    "Hlaing (လှိုင်)", "Hlaingthaya (လှိုင်သာယာ)", "Insein (အင်းစိန်)",
    "Kamayut (ကမာရွတ်)", "Kyauktada (ကျောက်တံတား)", "Kyimyindaing (ကြည့်မြင်တိုင်)",
    "Lanmadaw (လမ်းမတော်)", "Latha (လသာ)", "Mayangon (မရမ်းကုန်း)",
    "Mingala Taungnyunt (မင်္ဂလာတောင်ညွန့်)", "Mingaladon (မင်္ဂလာဒုံ)",
    "North Dagon (ဒဂုံမြောက်ပိုင်း)", "North Okkalapa (မြောက်ဥက္ကလာပ)",
    "Pabedan (ပန်းဘဲတန်း)", "Pazundaung (ပုဇွန်တောင်)", "Sanchaung (စမ်းချောင်း)",
    "Seikkan (ဆိပ်ကမ်း)", "Shwepyitha (ရွှေပြည်သာ)", "South Dagon (ဒဂုံတောင်ပိုင်း)",
    "South Okkalapa (တောင်ဥက္ကလာပ)", "Tamwe (တာမွေ)", "Thaketa (သာကေတ)",
    "Thingangyun (သင်္ဃန်းကျွန်း)", "Yankin (ရန်ကင်း)"
  ];

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    phoneNumber: "",
    township: "",
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    // --- Validations ---
    const phoneRegex = /^(09)?\d{9}$/;
    if (formData.phoneNumber && !phoneRegex.test(formData.phoneNumber)) {
      setError("Phone number must be valid (e.g., 09123456789 or 123456789).");
      return;
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(formData.password)) {
      setError("Password must be at least 8 characters, include an uppercase letter, a number, and a special character.");
      return;
    }

    setLoading(true);
    try {
      await api.post("/users/register", formData);
      setMessage("🎉 Registration successful! Redirecting to login...");
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      const errorData = err.response?.data;
      const errorMessage = typeof errorData === "string" ? errorData : (errorData?.message || "Registration failed!");
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-slate-950 text-white p-4">
      <div className="relative w-full max-w-sm">
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-teal-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl"></div>

        <div className="bg-slate-900/60 backdrop-blur-xl p-8 rounded-2xl shadow-2xl border border-slate-800/80 relative z-10 w-full max-w-md mx-auto max-h-[90vh] overflow-y-auto">
          <Link to="/" className="absolute top-4 left-4 text-slate-400 hover:text-teal-400 flex items-center gap-1 text-xs font-semibold transition">
            <ArrowLeft className="w-4 h-4" /> Home
          </Link>
          <div className="text-center mb-8 mt-4">
            <h2 className="text-3xl font-extrabold bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent">
              Create Account
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              Join the Hnaung Kyoe Platform
            </p>
          </div>

          {message && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 rounded-xl mb-4 text-xs text-center">
              {message}
            </div>
          )}
          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3 rounded-xl mb-4 text-xs text-center">
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                Username
              </label>
              <input
                type="text"
                name="username"
                onChange={handleChange}
                className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-xl p-2.5 text-sm text-white focus:outline-none transition"
                placeholder="johndoe"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                Email
              </label>
              <input
                type="email"
                name="email"
                onChange={handleChange}
                className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-xl p-2.5 text-sm text-white focus:outline-none transition"
                placeholder="example@gmail.com"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                Phone Number
              </label>
              <input
                type="text"
                name="phoneNumber"
                onChange={handleChange}
                className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-xl p-2.5 text-sm text-white focus:outline-none transition"
                placeholder="09xxxxxxxxx"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                Township (မြို့နယ်) <span className="text-rose-500">*</span>
              </label>
              <select
                name="township"
                onChange={handleChange}
                value={formData.township}
                className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-xl p-2.5 text-sm text-white focus:outline-none transition cursor-pointer appearance-none"
                required
              >
                <option value="" disabled>Select your township</option>
                {YANGON_TOWNSHIPS.map((township) => (
                  <option key={township} value={township.split(" (")[0]}>
                    {township}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  onChange={handleChange}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-xl p-2.5 text-sm text-white focus:outline-none transition pr-10"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-teal-400 transition"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-slate-950 font-bold p-3 rounded-xl transition duration-300 shadow-lg shadow-teal-500/20 mt-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? "Creating..." : "Sign Up"}
            </button>
          </form>

          <div className="text-center mt-5">
            <p className="text-xs text-gray-400">
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-teal-400 hover:text-teal-300 font-semibold transition underline decoration-teal-500/30 underline-offset-4"
              >
                Sign In here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;
