import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

function NewsFeed() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null); // Modal အတွက်
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const res = await api.get("/posts"); // Token မလို — public endpoint
        setPosts(res.data);
      } catch (err) {
        setError("Failed to load news feed.");
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-4xl w-full mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-800 pb-5">
          <div>
            <h1 className="text-3xl font-extrabold bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent">
              📰 News Feed
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              Latest updates from Hnaung Kyoe Platform.
            </p>
          </div>
          <button
            onClick={() => navigate("/dashboard")}
            className="bg-slate-900 hover:bg-slate-800 text-sm border border-slate-800 px-4 py-2 rounded-xl transition cursor-pointer"
          >
            ← Back to Dashboard
          </button>
        </div>

        {/* Loading / Error */}
        {loading && (
          <div className="text-center py-10 text-teal-400 animate-pulse text-sm">
            Loading latest news...
          </div>
        )}
        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl text-center text-sm">
            {error}
          </div>
        )}

        {/* Posts List */}
        {!loading && !error && (
          <div className="space-y-4">
            {posts.map((post) => (
              <div
                key={post.id}
                onClick={() => setSelected(post)}
                className="bg-slate-900/50 border border-slate-800/80 rounded-2xl overflow-hidden hover:border-slate-700 transition duration-300 cursor-pointer flex gap-4 p-5"
              >
                {/* Image (ရှိလျှင်) */}
                {post.imageUrl && (
                  <img
                    src={post.imageUrl}
                    alt={post.title}
                    className="w-24 h-24 object-cover rounded-xl flex-shrink-0 opacity-90"
                  />
                )}
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] bg-teal-500/10 text-teal-400 border border-teal-500/20 px-2 py-0.5 rounded font-mono uppercase">
                      {post.status}
                    </span>
                    <span className="text-[10px] text-gray-500 font-mono">
                      {new Date(post.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white">
                    {post.title}
                  </h3>
                  <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                    {post.content}
                  </p>
                  <p className="text-[10px] text-gray-600">
                    By: {post.author?.username || "Admin"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && posts.length === 0 && (
          <div className="text-center py-20 bg-slate-900/20 border border-slate-800 border-dashed rounded-2xl">
            <p className="text-gray-400 text-sm">
              No news posts available yet.
            </p>
          </div>
        )}
      </div>

      {/* Post Detail Modal */}
      {selected && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 space-y-4 max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {selected.imageUrl && (
              <img
                src={selected.imageUrl}
                alt={selected.title}
                className="w-full h-48 object-cover rounded-xl opacity-90"
              />
            )}
            <div className="flex items-center gap-2">
              <span className="text-[10px] bg-teal-500/10 text-teal-400 border border-teal-500/20 px-2 py-0.5 rounded font-mono uppercase">
                {selected.status}
              </span>
              <span className="text-[10px] text-gray-500 font-mono">
                {new Date(selected.createdAt).toLocaleDateString()}
              </span>
            </div>
            <h2 className="text-xl font-bold text-white">{selected.title}</h2>
            <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
              {selected.content}
            </p>
            <p className="text-[10px] text-gray-500">
              By: {selected.author?.username || "Admin"}
            </p>
            <button
              onClick={() => setSelected(null)}
              className="w-full bg-slate-800 hover:bg-slate-700 text-sm py-2.5 rounded-xl transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default NewsFeed;
