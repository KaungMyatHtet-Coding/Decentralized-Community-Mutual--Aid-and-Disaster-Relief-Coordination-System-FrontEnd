import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api";

const PAGE_SIZE = 10;

function VolunteerList() {
  const navigate = useNavigate();
  const [volunteers, setVolunteers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [confirmFire, setConfirmFire] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchVolunteers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/admin/volunteers", {
        params: { search: debouncedSearch },
      });
      setVolunteers(res.data);
    } catch (err) {
      setError("Failed to load volunteer list.");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    fetchVolunteers();
  }, [fetchVolunteers]);

  const handleFire = async (volunteer) => {
    try {
      await api.patch(`/admin/volunteers/${volunteer.id}/fire`);
      setMessage(`✅ ${volunteer.user?.username} has been removed from volunteers.`);
      setConfirmFire(null);
      fetchVolunteers();
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setError("Failed to fire volunteer.");
      setConfirmFire(null);
    }
  };

  const totalPages = Math.ceil(volunteers.length / PAGE_SIZE);
  const paginated = volunteers.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-6xl w-full mx-auto space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 border-b border-slate-800 pb-5">
          <div>
            <h1 className="text-2xl font-black bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              ✅ Volunteer List
            </h1>
            <p className="text-xs text-gray-400 mt-1">
              {volunteers.length} active volunteer
              {volunteers.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => navigate("/admin/applications")}
              className="bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/20 text-sm px-4 py-2 rounded-xl transition cursor-pointer font-semibold"
            >
              📝 Applications
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

        {/* Search Bar */}
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
              🔍
            </span>
            <input
              type="text"
              placeholder="Search by username..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 focus:border-blue-500 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white focus:outline-none transition"
            />
          </div>
          {search && (
            <button
              onClick={() => setSearch("")}
              className="bg-slate-900 border border-slate-800 text-gray-400 px-3 rounded-xl text-sm hover:bg-slate-800 transition cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>

        {/* Table */}
        {loading ? (
          <div className="text-center py-10 text-blue-400 animate-pulse text-sm">
            Loading volunteers...
          </div>
        ) : (
          <div className="bg-slate-900/30 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/60 text-[10px] uppercase font-mono tracking-wider text-gray-400">
                    <th className="p-4">#</th>
                    <th className="p-4">Username</th>
                    <th className="p-4">Email</th>
                    <th className="p-4">Phone</th>
                    <th className="p-4">Approved Date</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50 text-xs text-gray-300">
                  {paginated.map((vol, index) => (
                    <tr key={vol.id} className="hover:bg-slate-900/20 transition">
                      <td className="p-4 font-mono text-gray-500">
                        {(currentPage - 1) * PAGE_SIZE + index + 1}
                      </td>
                      <td className="p-4 font-bold text-white">
                        {vol.user?.username || "—"}
                      </td>
                      <td className="p-4 text-gray-400 font-mono text-[11px]">
                        {vol.user?.email || "—"}
                      </td>
                      <td className="p-4 text-gray-400">
                        {vol.user?.phoneNumber || "—"}
                      </td>
                      <td className="p-4 text-gray-500 font-mono">
                        {vol.appliedAt
                          ? new Date(vol.appliedAt).toLocaleDateString()
                          : "—"}
                      </td>
                      <td className="p-4">
                        <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 font-mono">
                          {vol.status}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => setConfirmFire(vol)}
                          className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 px-2.5 py-1 rounded-lg text-[10px] font-semibold cursor-pointer transition"
                        >
                          🔥 Fire
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {paginated.length === 0 && !loading && (
                <div className="text-center py-16 text-gray-500 text-sm">
                  {search
                    ? `No volunteers found for "${search}"`
                    : "No active volunteers."}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
              className="bg-slate-900 border border-slate-800 text-gray-400 px-3 py-1.5 rounded-lg text-xs disabled:opacity-30 hover:bg-slate-800 transition cursor-pointer"
            >
              ← Prev
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-8 h-8 rounded-lg text-xs font-mono transition cursor-pointer ${
                  page === currentPage
                    ? "bg-blue-500 text-slate-950 font-bold"
                    : "bg-slate-900 border border-slate-800 text-gray-400 hover:bg-slate-800"
                }`}
              >
                {page}
              </button>
            ))}
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
              className="bg-slate-900 border border-slate-800 text-gray-400 px-3 py-1.5 rounded-lg text-xs disabled:opacity-30 hover:bg-slate-800 transition cursor-pointer"
            >
              Next →
            </button>
          </div>
        )}
      </div>

      {/* Fire Confirmation Modal */}
      {confirmFire && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setConfirmFire(null)}
        >
          <div
            className="bg-slate-900 border border-rose-500/30 rounded-2xl p-6 max-w-sm w-full space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-bold text-rose-400">🔥 Confirm Fire</h3>
            <p className="text-sm text-gray-300">
              Are you sure you want to remove{" "}
              <span className="font-bold text-white">
                {confirmFire.user?.username}
              </span>{" "}
              from volunteers? Their role will be reset to PUBLIC.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmFire(null)}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-sm py-2.5 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleFire(confirmFire)}
                className="flex-1 bg-rose-500 hover:bg-rose-600 text-white font-bold text-sm py-2.5 rounded-xl transition cursor-pointer"
              >
                Yes, Fire
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default VolunteerList;
