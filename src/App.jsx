import {
  Navigate,
  Route,
  BrowserRouter as Router,
  Routes,
} from "react-router-dom";
import AdminAidRequests from "./pages/admin/AdminAidRequests";
import AdminCampaigns from "./pages/admin/AdminCampaigns";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AuditLogs from "./pages/admin/AuditLogs";
import DonationApprovals from "./pages/admin/DonationApprovals";
import ManageUsers from "./pages/admin/ManageUsers";
import VolunteerApplications from "./pages/admin/VolunteerApplications";
import VolunteerList from "./pages/admin/VolunteerList";
import AidRequests from "./pages/AidRequests";
import Campaigns from "./pages/Campaigns";
import Dashboard from "./pages/Dashboard";
import DonateForm from "./pages/DonateForm";
import DonationHistory from "./pages/DonationHistory";
import Login from "./pages/Login";
import ManageDonations from "./pages/ManageDonations";
import ManagePosts from "./pages/ManagePosts"; // path ကိုယ့် project structure အတိုင်း ပြင်ပါ
import MyItemDonations from "./pages/MyItemDonations";
import NewsFeed from "./pages/NewsFeed"; // path ကိုယ့် project structure အတိုင်း ပြင်ပါ
import Register from "./pages/Register";
import VolunteerApply from "./pages/VolunteerApply";
import VolunteerAssignments from "./pages/VolunteerAssignments";
import VolunteerAssignmentsList from "./pages/VolunteerAssignmentsList";
import ProfilePage from "./pages/ProfilePage";
import ProfileViewPage from "./pages/ProfileViewPage"
import VolunteerHistory from "./pages/VolunteerHistory";
import AdminDonationApprovals from "./pages/AdminDonationApprovals";
import StorePage from "./pages/admin/StorePage"
// ... အပေါ်က Import တွေ အားလုံးကို မူလအတိုင်း ထားပါ ...

function App() {
  return (
    <Router>
      <Routes>
        {/* URL က / အလွတ်ဖြစ်နေရင် /login ဆီ တန်းပို့ပေးမယ့်အပိုင်း */}
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/campaigns" element={<Campaigns />} />
        <Route path="/donate/:campaignId" element={<DonateForm />} />
        <Route path="/admin/donations" element={<ManageDonations />} />
        <Route path="/donation-history" element={<DonationHistory />} />
        <Route path="/news" element={<NewsFeed />} />
        <Route path="/admin/posts" element={<ManagePosts />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/volunteers" element={<VolunteerList />} />
        <Route path="/admin/applications" element={<VolunteerApplications />} />
        <Route path="/aid-requests" element={<AidRequests />} />
        <Route path="/volunteer-apply" element={<VolunteerApply />} />
        <Route path="/admin/aid-requests" element={<AdminAidRequests />} />
        <Route path="/admin/campaigns" element={<AdminCampaigns />} />
        <Route path="/admin/audit-logs" element={<AuditLogs />} />
        <Route path="/admin/users" element={<ManageUsers />} />
        <Route path="/my-item-donations" element={<MyItemDonations />} />
        {/* 💡 (၁) မူလ DonationApprovals ကို ဒီလမ်းကြောင်းအတိုင်း ထားချင်ထားပါ */}
        <Route
          path="/admin/donation-approvals"
          element={<DonationApprovals />}
        />
        {/* 💡 (၂) Notification က လှမ်းခေါ်တဲ့ /admin/item-donations အတွက် လမ်းကြောင်းအသစ် တိုးပေးလိုက်ပါ */}
        <Route
          path="/admin/item-donations"
          element={<AdminDonationApprovals />}
        />
        <Route
          path="/volunteer/assignments"
          element={<VolunteerAssignmentsList />}
        />
        <Route
          path="/volunteer/assignments/:id"
          element={<VolunteerAssignments />}
        />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/profile/view" element={<ProfileViewPage />} />
        <Route path="/volunteer/history" element={<VolunteerHistory />} />
        // ညီလေးရဲ့ Admin Router Area ထဲမှာ သွားထည့်ပေးပါ
        <Route path="/admin/store" element={<StorePage />} />
      </Routes>
    </Router>
  );
}



export default App;
