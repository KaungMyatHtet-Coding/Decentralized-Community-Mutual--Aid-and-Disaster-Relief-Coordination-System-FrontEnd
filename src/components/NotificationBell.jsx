import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  const unread = notifications.filter((n) => !n.read).length;

  const fetchNotifications = async () => {
    try {
      const res = await api.get("/notifications/my");
      // ✅ Newest first
      const sorted = res.data.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
      );
      setNotifications(sorted);
    } catch (err) {
      console.error("Notification fetch failed", err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ✅ Mark all read ပြုပြင်ရန်
  const markAllRead = async () => {
    try {
      await api.put("/notifications/mark-all-read"); // 👈 api.patch ကို api.put သို့ ပြောင်းလဲခြင်း
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  // ✅ Clear all ပြုပြင်ရန်
  const clearAll = async () => {
    try {
      await api.put("/notifications/mark-all-read"); // 👈 api.patch ကို api.put သို့ ပြောင်းလဲခြင်း
      setNotifications([]);
    } catch (err) {
      console.error(err);
    }
  };

  // ✅ Notification တစ်ခုချင်းစီ နှိပ်လိုက်သည့်အခါ Mark Read လုပ်ပြီး လမ်းကြောင်းမှန်သို့ ပို့ပေးရန်
  const handleNotificationClick = async (n, userRole) => {
    if (!n.read) {
      try {
        await api.put(`/notifications/${n.id}/read`); // 👈 ပိုမိုစိတ်ချရသော PUT Method သို့ ပြောင်းလဲခြင်း
        setNotifications((prev) =>
          prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)),
        );
      } catch (err) {
        console.error("Error marking notification as read:", err);
      }
    }

    // 👤 Role စစ်ဆေးခြင်း
    const isAdmin =
      userRole === "ROLE_SUPER_ADMIN" || userRole === "ROLE_SUB_ADMIN";
    const isVolunteer = userRole === "ROLE_VOLUNTEER";

    // 🎯 Admin ဖြစ်ခဲ့ရင် Noti ရဲ့ အကြောင်းအရာအလိုက် လမ်းကြောင်းကို မှန်ကန်အောင် ခွဲခြားခြင်း
    let adminItemDonationRoute = "/admin/donation-approvals"; // 👈 Default: အလှူရှင် အသစ်လှူဒါန်းစဉ် သွားမည့် Review Page

    if (n.title) {
      const titleLower = n.title.toLowerCase();
      const messageLower = n.message ? n.message.toLowerCase() : "";

      // 💡 Volunteer က ပစ္စည်းသွားကောက်ပြီး "Received" သို့မဟုတ် "Accepted" လုပ်လိုက်တဲ့ Noti ဆိုရင်...
      if (
        titleLower.includes("collected") ||
        titleLower.includes("received") ||
        titleLower.includes("accepted") ||
        messageLower.includes("ကောက်ခံရရှိ") ||
        messageLower.includes("လက်ခံလိုက်ပါပြီ")
      ) {
        adminItemDonationRoute = "/admin/store"; // 🏬 ဂိုဒေါင်သွင်းရန် စိစစ်မည့် စာမျက်နှာသို့ လမ်းကြောင်းလွှဲမည်
      }
    }

    // 🔄 အဆင့်မြှင့်တင်ထားသော လမ်းကြောင်းပြမြေပုံ (Route Map)
    const routeMap = {
      DONATION: isAdmin ? "/admin/donation-approvals" : "/my-donations",

      // 🏬 ITEM_DONATION လမ်းကြောင်းကို Intelligent ဖြစ်အောင် Update လုပ်ထားပါသည်
      ITEM_DONATION: isAdmin
        ? adminItemDonationRoute // 👈 အပေါ်က စစ်ထုတ်ချက်အရ လမ်းကြောင်းမှန်အတိုင်း သွားပါလိမ့်မည်
        : isVolunteer
          ? `/volunteer/assignments/${n.referenceId}` // Volunteer ဖြစ်ရင် သူ့ Assignment Detail ဆီ သွားမည်
          : "/my-item-donations", // ရိုးရိုး Donor ဖြစ်ရင် သူ့ရဲ့ အလှူမှတ်တမ်းဆီ သွားမည်

      // 🆘 AID_REQUEST — Volunteer ဆိုရင် /volunteer/aid-tasks သို့ တန်းသွားမည်
      AID_REQUEST: isAdmin
        ? `/admin/aid-requests`
        : isVolunteer
          ? `/volunteer/aid-tasks`   // ✅ Volunteer → Available Tasks
          : `/aid-requests`,         // Public → Aid Request list

      SOS_ALERT: isAdmin ? "/admin/aid-requests" : isVolunteer ? "/volunteer/aid-tasks" : "/dashboard",

      DELIVERY_REPORT: isAdmin ? "/admin/delivery-reviews" : "/volunteer/aid-tasks",

      CAMPAIGN: `/campaigns/${n.referenceId}`,

      VOLUNTEER: isAdmin ? "/admin/volunteers" : "/volunteer/assigned",
    };

    // 🚀 သက်ဆိုင်ရာ လမ်းကြောင်းအမှန်အတိုင်း ခေါ်ယူပြီး ကူးပြောင်းခြင်း
    const route = routeMap[n.referenceType];
    if (route) {
      setOpen(false); // Bell Dropdown Menu ကို ပိတ်ခြင်း
      navigate(route); // စာမျက်နှာသို့ သွားခြင်း
    }
  };
  // ✅ Time ago
  const timeAgo = (dateStr) => {
    if (!dateStr) return "—";
    const diff = Math.floor((new Date() - new Date(dateStr)) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
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

  // Get current user role from localStorage
  // ✅ ဒါနဲ့ အစားထိုး
  const userRole = localStorage.getItem("role");

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
            {/* ✅ Header buttons */}
            <div className="flex gap-2">
              {unread > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-[10px] text-teal-400 hover:underline cursor-pointer"
                >
                  ✓ All read
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={clearAll}
                  className="text-[10px] text-rose-400 hover:underline cursor-pointer"
                >
                  🗑️ Clear
                </button>
              )}
            </div>
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
                  onClick={() => handleNotificationClick(n, userRole)}
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
                      {/* ✅ Time ago */}
                      <p className="text-[10px] text-gray-600 mt-1 font-mono">
                        {timeAgo(n.createdAt)}
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
                {notifications.length} total · {unread} unread
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default NotificationBell;
