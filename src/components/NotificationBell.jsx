import { useEffect, useState, useRef } from "react";
import api from "../api";

function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const unread = notifications.filter((n) => !n.read).length;

  const fetchNotifications = async () => {
    try {
      const res = await api.get("/notifications/my");
      setNotifications(res.data);
    } catch (err) {
      console.error("Notification fetch failed", err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // 30 seconds တစ်ကြိမ် auto refresh
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Outside click ဆိုရင် dropdown ပိတ်
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const markAllRead = async () => {
    try {
      await api.patch("/notifications/mark-all-read");
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const markOne = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
      );
    } catch (err) {
      console.error(err);
    }
  };

  const typeIcon = (type) => {
    const map = {
      REQUEST_CREATED: "🆘",
      STATUS_CHANGED: "🔄",
      DONATION_RECEIVED: "💚",
      CAMPAIGN_COMPLETED: "🎉",
      VOLUNTEER_APPROVED: "✅",
      VOLUNTEER_REJECTED: "❌",
    };
    return map[type] || "🔔";
  };

  return (
    <div className="relative" ref={ref}>
      {/* Bell Button */}
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 transition cursor-pointer"
      >
        <span className="text-lg">🔔</span>
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden">
          {/* Header */}
          <div className="flex justify-between items-center px-4 py-3 border-b border-slate-800">
            <span className="text-sm font-bold text-white">
              🔔 Notifications
              {unread > 0 && (
                <span className="ml-2 bg-rose-500/20 text-rose-400 text-[10px] px-1.5 py-0.5 rounded-full font-mono">
                  {unread} new
                </span>
              )}
            </span>
            {unread > 0 && (
              <button
                onClick={markAllRead}
                className="text-[10px] text-teal-400 hover:underline cursor-pointer"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/50">
            {notifications.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-xs">
                No notifications yet
              </div>
            ) : (
              notifications.slice(0, 20).map((n) => (
                <div
                  key={n.id}
                  onClick={() => markOne(n.id)}
                  className={`px-4 py-3 cursor-pointer hover:bg-slate-800/50 transition ${
                    !n.read ? "bg-teal-500/5 border-l-2 border-teal-500" : ""
                  }`}
                >
                  <div className="flex gap-2 items-start">
                    <span className="text-base mt-0.5">{typeIcon(n.type)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-white truncate">
                        {n.title}
                      </p>
                      <p className="text-[11px] text-gray-400 mt-0.5 leading-relaxed line-clamp-2">
                        {n.message}
                      </p>
                      <p className="text-[10px] text-gray-600 mt-1 font-mono">
                        {n.createdAt
                          ? new Date(n.createdAt).toLocaleString()
                          : "—"}
                      </p>
                    </div>
                    {!n.read && (
                      <div className="w-2 h-2 bg-teal-400 rounded-full mt-1 shrink-0" />
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-2 border-t border-slate-800 text-center">
              <span className="text-[10px] text-gray-500 font-mono">
                {notifications.length} total notifications
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default NotificationBell;
