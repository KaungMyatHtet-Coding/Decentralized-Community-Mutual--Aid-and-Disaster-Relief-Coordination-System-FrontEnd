import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api";

function Login() {
  const [credentials, setCredentials] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) =>
    setCredentials({ ...credentials, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await api.post("/auth/login", credentials);

      // ✨ userId ပါ ထုတ်ယူလိုက်တာ
      const { token, role, username, userId ,profileCompleted} = response.data;

      localStorage.setItem("token", token);
      localStorage.setItem("role", role);
      localStorage.setItem("username", username);
      localStorage.setItem("userId", userId); // ✨ သိမ်းလိုက်တာ — ဒါမှ DonateForm မှာ သုံးလို့ရမယ်
      localStorage.setItem("profileCompleted", profileCompleted);

      setTimeout(() => {
        if (role === "ROLE_SUPER_ADMIN" || role === "ROLE_SUB_ADMIN") {
          navigate("/admin/dashboard");
        } else {
          navigate("/dashboard");
        }
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || "Invalid email or password!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-slate-950 text-white p-4">
      <div className="relative w-full max-w-sm">
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-teal-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl"></div>

        <div className="bg-slate-900/60 backdrop-blur-xl p-8 rounded-2xl shadow-2xl border border-slate-800/80 relative z-10">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-extrabold bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent">
              Hnaung Kyoe 🔗
            </h2>
            <p className="text-sm text-gray-400 mt-2">
              Welcome back! Please sign in
            </p>
          </div>

          {message && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 rounded-xl mb-5 text-xs text-center font-medium animate-pulse">
              {message}
            </div>
          )}
          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3 rounded-xl mb-5 text-xs text-center">
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                onChange={handleChange}
                className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-xl p-3 text-sm text-white focus:outline-none transition-all duration-200"
                placeholder="Enter your email"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <input
                type="password"
                name="password"
                onChange={handleChange}
                className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-xl p-3 text-sm text-white focus:outline-none transition-all duration-200"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-slate-950 font-bold p-3 rounded-xl transition duration-300 shadow-lg shadow-teal-500/20 active:scale-98 cursor-pointer disabled:opacity-50"
            >
              {loading ? "Connecting..." : "Sign In"}
            </button>
          </form>

          <div className="text-center mt-6">
            <p className="text-xs text-gray-400">
              Don't have an account?{" "}
              <Link
                to="/register"
                className="text-teal-400 hover:text-teal-300 font-semibold transition underline decoration-teal-500/30 underline-offset-4"
              >
                Sign Up here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
