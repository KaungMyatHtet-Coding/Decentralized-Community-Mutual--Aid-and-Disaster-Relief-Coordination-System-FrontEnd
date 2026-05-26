import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

export default function ProfileViewPage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const role = localStorage.getItem("role") || "";
  const isVolunteer =
    role === "ROLE_VOLUNTEER" || role === "ROLE_SENIOR_VOLUNTEER";

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get("/profile");
        setProfile(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const initials = profile?.fullName
    ? profile.fullName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "K";

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-12">
      {/* Top Navigation */}
      <div className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50">
        <div className="max-w-2xl mx-auto px-5 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition"
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-xl font-bold">My Profile</h1>
          <button
            onClick={() => navigate("/profile")}
            className="px-6 py-2.5 bg-teal-500 hover:bg-teal-400 text-black font-semibold rounded-2xl text-sm transition"
          >
            Edit Profile
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-5 pt-6 space-y-6">
        {/* Profile Header Card */}
        <div className="bg-slate-900 rounded-3xl p-8 text-center border border-slate-700">
          <div className="w-24 h-24 mx-auto bg-gradient-to-br from-teal-400 to-cyan-500 rounded-2xl flex items-center justify-center text-5xl font-bold shadow-xl mb-5">
            {initials}
          </div>
          <h2 className="text-3xl font-bold mb-1">{profile?.fullName}</h2>
          <p className="text-teal-400">
            {role.replace("ROLE_", "").replace("_", " ")} • {profile?.division}
          </p>
        </div>

        {/* Personal & Address - Two Column Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Personal Info */}
          <div className="bg-slate-900 rounded-3xl p-6 border border-slate-700">
            <h3 className="text-teal-400 uppercase tracking-widest text-xs font-semibold mb-5">
              Personal Info
            </h3>
            <Info label="Full Name" value={profile?.fullName} />
            <Info label="Phone" value={profile?.phoneNumber} />
            <Info label="Date of Birth" value={profile?.dateOfBirth} />
            <Info label="Gender" value={profile?.gender} />
            <Info label="NRC" value={profile?.nrc} />
          </div>

          {/* Address */}
          <div className="bg-slate-900 rounded-3xl p-6 border border-slate-700">
            <h3 className="text-teal-400 uppercase tracking-widest text-xs font-semibold mb-5">
              Address
            </h3>
            <Info label="Division" value={profile?.division} />
            <Info label="Township" value={profile?.township} />
            <Info label="Street" value={profile?.streetAddress} />
            <Info label="Postal Code" value={profile?.postalCode} />
          </div>
        </div>

        {/* Volunteer Info - One Big Card */}
        {isVolunteer && (
          <div className="bg-slate-900 rounded-3xl p-6 border border-slate-700">
            <h3 className="text-teal-400 uppercase tracking-widest text-xs font-semibold mb-6">
              Volunteer Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
              <Info
                label="Skills"
                value={profile?.skills?.replace(/,\s*/g, " • ")}
              />
              <Info
                label="Available Days"
                value={profile?.availableDays?.replace(/,\s*/g, " • ")}
              />
              <Info label="Time Slots" value={profile?.availableTimes} />
              <Info
                label="Experience"
                value={
                  profile?.yearsOfExperience
                    ? `${profile.yearsOfExperience} years`
                    : "0 years"
                }
              />
              <Info label="Vehicle" value={profile?.vehicleType} />
              <Info
                label="Emergency Contact"
                value={
                  profile?.emergencyContactName
                    ? `${profile.emergencyContactName} • ${profile.emergencyContactPhone}`
                    : "—"
                }
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Small reusable component
const Info = ({ label, value }) => (
  <div className="flex justify-between py-2 border-b border-slate-800 last:border-none">
    <span className="text-slate-400 text-sm">{label}</span>
    <span className="text-right font-medium text-white break-words max-w-[180px]">
      {value || "—"}
    </span>
  </div>
);
