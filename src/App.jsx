import {
  Navigate,
  Route,
  BrowserRouter as Router,
  Routes,
} from "react-router-dom";
import Campaigns from "./pages/Campaigns";
import Dashboard from "./pages/Dashboard";
import DonateForm from "./pages/DonateForm";
import DonationHistory from "./pages/DonationHistory";
import Login from "./pages/Login";
import ManageDonations from "./pages/ManageDonations";
import ManagePosts from "./pages/ManagePosts"; // path ကိုယ့် project structure အတိုင်း ပြင်ပါ
import NewsFeed from "./pages/NewsFeed"; // path ကိုယ့် project structure အတိုင်း ပြင်ပါ
import Register from "./pages/Register";
import AdminDashboard from "./pages/admin/AdminDashboard";
import VolunteerList from "./pages/admin/VolunteerList";
import VolunteerApplications from "./pages/admin/VolunteerApplications";

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
      </Routes>
    </Router>
  );
}

export default App;
