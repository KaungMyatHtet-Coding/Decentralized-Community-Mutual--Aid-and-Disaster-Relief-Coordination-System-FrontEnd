import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api";

function VolunteerApplications() {
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [processing, setProcessing] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/admin/volunteers/applications", {
        params: { search: debouncedSearch },
      });
      setApplications(res.data);
    } catch (err) {
      setError("Failed to load applications.");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const handleApprove = async (app) => {
    setProcessing(app.id);
    try {
      await api.patch(`/admin/volunteers/applications/${app.id}/approve`);
      setMessage(`✅ ${app.user?.username} approved as volunteer!`); // ✅ applicant → user
      fetchApplications();
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setError("Failed to approve application.");
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (app) => {
    setProcessing(app.id);
    try {
      await api.patch(`/admin/volunteers/applications/${app.id}/reject`);
      setMessage(`❌ ${app.user?.username}'s application rejected.`); // ✅ applicant → user
      fetchApplications();
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setError("Failed to reject application.");
    } finally {
      setProcessing(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-6xl w-full mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 border-b border-slate-800 pb-5">
          <div>
            <h1 className="text-2xl font-black bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">
              📝 Volunteer Applications
            </h1>
            <p className="text-xs text-gray-400 mt-1">
              {applications.length} pending application
              {applications.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => navigate("/admin/volunteers")}
              className="bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 text-sm px-4 py-2 rounded-xl transition cursor-pointer font-semibold"
            >
              ✅ Volunteer List
            </button>
            <button
              onClick={() => navigate("/admin/dashboard")}
              className="bg-slate-900 hover:bg-slate-800 text-sm border border-slate-800 px-4 py-2 rounded-xl transition cursor-pointer"
            >
              ← Dashboard
            </button>
          </div>
        </div>

        {/* Messages */}
        {message && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 rounded-xl text-sm text-center">
            {message}
          </div>
        )}
        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3 rounded-xl text-sm text-center">
            {error}
          </div>
        )}

        {/* Search */}
        <div className="relative max-w-sm">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
            🔍
          </span>
          <input
            type="text"
            placeholder="Search applicant name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 focus:border-orange-500 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white focus:outline-none transition"
          />
        </div>

        {/* Applications Cards */}
        {loading ? (
          <div className="text-center py-10 text-orange-400 animate-pulse text-sm">
            Loading applications...
          </div>
        ) : (
          <div className="space-y-3">
            {applications.map((app) => (
              <div
                key={app.id}
                className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 hover:border-slate-700 transition"
              >
                {/* Applicant Info */}
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 font-black text-sm">
                    {app.user?.username?.[0]?.toUpperCase() || "?"}{" "}
                    {/* ✅ applicant → user */}
                  </div>
                  <div>
                    <p className="font-bold text-white text-sm">
                      {app.user?.username || "Unknown"}{" "}
                      {/* ✅ applicant → user */}
                    </p>
                    <p className="text-[11px] text-gray-400 font-mono">
                      {app.user?.email || "—"} {/* ✅ applicant → user */}
                    </p>
                    <p className="text-[10px] text-gray-500 mt-0.5">
                      Applied:{" "}
                      {app.appliedAt /* ✅ createdAt → appliedAt */
                        ? new Date(app.appliedAt).toLocaleDateString()
                        : "—"}
                    </p>
                  </div>
                </div>

                {/* Status + Actions */}
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-mono bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse">
                    {app.status}
                  </span>
                  <button
                    disabled={processing === app.id}
                    onClick={() => handleApprove(app)}
                    className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition disabled:opacity-40"
                  >
                    {processing === app.id ? "..." : "✅ Approve"}
                  </button>
                  <button
                    disabled={processing === app.id}
                    onClick={() => handleReject(app)}
                    className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition disabled:opacity-40"
                  >
                    {processing === app.id ? "..." : "❌ Reject"}
                  </button>
                </div>
              </div>
            ))}

            {applications.length === 0 && (
              <div className="text-center py-20 bg-slate-900/20 border border-slate-800 border-dashed rounded-2xl">
                <p className="text-gray-400 text-sm">
                  🎉 No pending applications right now.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default VolunteerApplications;
