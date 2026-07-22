import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

function ManagePosts() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingPost, setEditingPost] = useState(null); // null = create, object = edit
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const authorId = localStorage.getItem("userId"); // Login.jsx မှ သိမ်းထားသည်

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    imageUrl: "",
    status: "PUBLISHED",
  });

  const fetchPosts = async () => {
    try {
      const res = await api.get("/posts/all"); // Admin endpoint
      setPosts(res.data);
    } catch (err) {
      setError("Failed to load posts.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const resetForm = () => {
    setFormData({ title: "", content: "", imageUrl: "", status: "PUBLISHED" });
    setEditingPost(null);
    setShowForm(false);
    setMessage("");
  };

  const handleEdit = (post) => {
    setEditingPost(post);
    setFormData({
      title: post.title,
      content: post.content,
      imageUrl: post.imageUrl || "",
      status: post.status,
    });
    setShowForm(true);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const formDataUpload = new FormData();
      formDataUpload.append("file", file);
      
      const res = await api.post("/upload/photo", formDataUpload, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setFormData({ ...formData, imageUrl: res.data.url });
    } catch (err) {
      setError("Failed to upload image. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage("");
    setError("");

    try {
      if (editingPost) {
        // Update
        await api.put(`/posts/${editingPost.id}`, formData);
        setMessage("✅ Post updated successfully!");
      } else {
        // Create
        await api.post("/posts", { ...formData, authorId: parseInt(authorId) });
        setMessage("✅ Post created successfully!");
      }
      fetchPosts();
      setTimeout(() => resetForm(), 1500);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save post.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this post?")) return;
    try {
      await api.delete(`/posts/${id}`);
      setPosts((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      setError("Failed to delete post.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-5xl w-full mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-800 pb-5">
          <div>
            <h1 className="text-3xl font-extrabold bg-gradient-to-r from-rose-400 to-orange-400 bg-clip-text text-transparent">
              🛡️ Manage Posts
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              Create, edit and delete news posts.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => {
                resetForm();
                setShowForm(true);
              }}
              className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-sm px-4 py-2 rounded-xl transition cursor-pointer"
            >
              + New Post
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

        {/* Create / Edit Form */}
        {showForm && (
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h2 className="text-base font-bold text-white">
              {editingPost ? "✏️ Edit Post" : "📝 Create New Post"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                  Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-xl p-3 text-sm text-white focus:outline-none transition"
                  placeholder="Post title..."
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                  Content *
                </label>
                <textarea
                  required
                  rows={5}
                  value={formData.content}
                  onChange={(e) =>
                    setFormData({ ...formData, content: e.target.value })
                  }
                  className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-xl p-3 text-sm text-white focus:outline-none transition resize-none"
                  placeholder="Write your post content here..."
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                  Image (optional)
                </label>
                <div className="mt-1 flex items-center gap-4">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    disabled={uploading}
                    className="block w-full text-sm text-slate-400 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-teal-500/10 file:text-teal-400 hover:file:bg-teal-500/20 transition cursor-pointer"
                  />
                  {uploading && <span className="text-xs text-teal-400 animate-pulse">Uploading...</span>}
                </div>
                {formData.imageUrl && (
                  <div className="mt-3 relative w-full h-40 rounded-xl overflow-hidden border border-slate-700">
                    <img src={formData.imageUrl} alt="Post Preview" className="w-full h-full object-cover" />
                    <button 
                      type="button"
                      onClick={() => setFormData({...formData, imageUrl: ""})}
                      className="absolute top-2 right-2 bg-rose-500/80 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-rose-500 transition"
                      title="Remove Image"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value })
                  }
                  className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-xl p-3 text-sm text-white focus:outline-none transition"
                >
                  <option value="PUBLISHED">
                    ✅ PUBLISHED (Users မြင်ရသည်)
                  </option>
                  <option value="DRAFT">📝 DRAFT (Admin သာ မြင်ရသည်)</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={resetForm}
                  className="w-1/3 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-sm py-3 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-2/3 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-slate-950 font-black text-sm py-3 rounded-xl transition cursor-pointer disabled:opacity-50"
                >
                  {submitting
                    ? "Saving..."
                    : editingPost
                      ? "Update Post"
                      : "Create Post"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Posts Table */}
        {loading && (
          <div className="text-center py-10 text-teal-400 animate-pulse text-sm">
            Loading posts...
          </div>
        )}

        {!loading && (
          <div className="bg-slate-900/30 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/60 text-[10px] uppercase font-mono tracking-wider text-gray-400">
                    <th className="p-4">#</th>
                    <th className="p-4">Title</th>
                    <th className="p-4">Township</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Author</th>
                    <th className="p-4">Date</th>
                    <th className="p-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50 text-xs text-gray-300">
                  {posts.map((post) => (
                    <tr
                      key={post.id}
                      className="hover:bg-slate-900/20 transition"
                    >
                      <td className="p-4 font-mono text-gray-500">{post.id}</td>
                      <td className="p-4 font-semibold text-white max-w-xs truncate">
                        {post.title}
                      </td>
                      <td className="p-4">
                        <span className="bg-slate-800 text-gray-300 px-2 py-0.5 rounded text-[10px] font-mono border border-slate-700">
                          {post.township || "Global"}
                        </span>
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                            post.status === "PUBLISHED"
                              ? "bg-emerald-500/10 text-emerald-400"
                              : "bg-amber-500/10 text-amber-400"
                          }`}
                        >
                          {post.status}
                        </span>
                      </td>
                      <td className="p-4 text-gray-400">
                        {post.author?.username || "—"}
                      </td>
                      <td className="p-4 text-gray-500 font-mono">
                        {new Date(post.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex gap-2 justify-center">
                          <button
                            onClick={() => handleEdit(post)}
                            className="bg-teal-500/10 hover:bg-teal-500/20 text-teal-400 border border-teal-500/20 px-2.5 py-1 rounded-lg text-[10px] font-semibold cursor-pointer transition"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(post.id)}
                            className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 px-2.5 py-1 rounded-lg text-[10px] font-semibold cursor-pointer transition"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {posts.length === 0 && (
                <div className="text-center py-16 text-gray-500 text-sm">
                  No posts yet. Create your first post!
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ManagePosts;
