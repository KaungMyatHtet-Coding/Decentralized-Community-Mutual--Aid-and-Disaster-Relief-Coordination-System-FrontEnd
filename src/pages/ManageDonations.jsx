import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import api from "../api";

const ManageDonations = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [analyticsStats, setAnalyticsStats] = useState(null);

  const COLORS = ["#10B981", "#3B82F6", "#F59E0B", "#EF4444", "#8B5CF6"];

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await api.get("/item-donations/admin/analytics-stats").catch(() => null);
      if (response?.data) setAnalyticsStats(response.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  // Prepare Chart Data
  const barChartData = analyticsStats
    ? [
        {
          name: "Money (Lakhs)",
          Received: (analyticsStats.totalMoneyReceived || 0) / 100000,
          Distributed: (analyticsStats.totalMoneyDistributed || 0) / 100000,
        },
        ...(analyticsStats.categoryStats?.map((item) => ({
          name: item.category,
          Received: item.received,
          Distributed: item.distributed,
        })) || []),
      ]
    : [
        { name: "Money", Received: 45, Distributed: 30 },
        { name: "FOOD", Received: 120, Distributed: 85 },
        { name: "MEDICINE", Received: 80, Distributed: 40 },
        { name: "CLOTHING", Received: 200, Distributed: 150 },
      ];

  const pieChartData = analyticsStats?.categoryStats?.map((item) => ({
    name: item.category,
    value: item.available,
  })) || [
    { name: "FOOD", value: 40 },
    { name: "MEDICINE", value: 20 },
    { name: "CLOTHING", value: 25 },
    { name: "MONEY", value: 15 },
  ];

  return (
    <div className="p-6 bg-slate-900 min-h-screen text-slate-100">
      {/* Top Bar */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => navigate("/admin/dashboard")}
          className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-400 transition-all"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-emerald-400">📊 Donation Analytics</h1>
          <p className="text-sm text-slate-400">အလှူပစ္စည်းနှင့် ငွေသားစီးဆင်းမှု စာရင်းဇယားများ</p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart */}
        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl">
          <h2 className="text-lg font-semibold mb-4">Received vs Distributed</h2>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={barChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="name" stroke="#94A3B8" />
              <YAxis stroke="#94A3B8" />
              <Tooltip contentStyle={{ backgroundColor: "#1E293B", border: "none" }} />
              <Legend />
              <Bar dataKey="Received" fill="#10B981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Distributed" fill="#3B82F6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart with Percentage */}
        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl">
          <h2 className="text-lg font-semibold mb-4">Available Stock Breakdown</h2>
          <ResponsiveContainer width="100%" height={350}>
            <PieChart>
              <Pie
                data={pieChartData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
              >
                {pieChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default ManageDonations;
