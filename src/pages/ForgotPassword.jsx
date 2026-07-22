import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import api from "../api";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");
    setLoading(true);
    try {
      const response = await api.post("/auth/forgot-password", { email });
      setMessage(response.data);
    } catch (err) {
      setError(err.response?.data || "Something went wrong. Please try again.");
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
          <Link to="/login" className="absolute top-4 left-4 text-slate-400 hover:text-teal-400 flex items-center gap-1 text-xs font-semibold transition">
            <ArrowLeft className="w-4 h-4" /> Back to Login
          </Link>
          <div className="text-center mb-8 mt-4">
            <h2 className="text-2xl font-extrabold bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent">
              Forgot Password
            </h2>
            <p className="text-sm text-gray-400 mt-2">
              Enter your email to receive a reset link.
            </p>
          </div>

          {message && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 rounded-xl mb-5 text-xs text-center font-medium">
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
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-xl p-3 text-sm text-white focus:outline-none transition-all duration-200"
                placeholder="Enter your email"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-slate-950 font-bold p-3 rounded-xl transition duration-300 shadow-lg shadow-teal-500/20 active:scale-98 cursor-pointer disabled:opacity-50"
            >
              {loading ? "Sending..." : "Send Reset Link"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
