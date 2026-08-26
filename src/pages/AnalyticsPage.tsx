import React, { useState } from "react";
import { PageContainer } from "../components/layout/PageContainer";
import { useQuery } from "@tanstack/react-query";
import { analyticsApi } from "../services/journeyApi";
import {
  BarChart3,
  TrendingUp,
  Clock,
  Users,
  CheckCircle2,
  Calendar,
  Download,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
} from "recharts";

const COLORS = ["#2563eb", "#3b82f6", "#60a5fa", "#93c5fd", "#10b981", "#f59e0b"];

export const AnalyticsPage: React.FC = () => {
  const [timeRange, setTimeRange] = useState("Today");

  const { data: analytics, isLoading } = useQuery({
    queryKey: ["analytics-overview", timeRange],
    queryFn: analyticsApi.getAnalyticsOverview,
  });

  return (
    <PageContainer
      title="Hospital Operational Analytics & KPI Intelligence"
      subtitle="Comprehensive data insights on patient wait times, doctor consultation efficiency, and queue throughput"
      actions={
        <button
          onClick={() => alert("Exporting operational report as CSV...")}
          className="px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg shadow-2xs flex items-center gap-1.5 transition"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Report CSV</span>
        </button>
      }
    >
      <div className="space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-xs font-semibold text-slate-500 uppercase">Average Wait Time</span>
            <p className="text-2xl font-bold text-slate-900 mt-1">16.4 min</p>
            <span className="text-[11px] text-emerald-600 font-medium">↓ 12% vs last week</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-xs font-semibold text-slate-500 uppercase">On-Time Starts</span>
            <p className="text-2xl font-bold text-blue-700 mt-1">89.2%</p>
            <span className="text-[11px] text-slate-500">Appointments started ±10m</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-xs font-semibold text-slate-500 uppercase">No-Show Rate</span>
            <p className="text-2xl font-bold text-amber-700 mt-1">3.1%</p>
            <span className="text-[11px] text-emerald-600 font-medium">↓ 1.5% improvement</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-xs font-semibold text-slate-500 uppercase">Patient Satisfaction</span>
            <p className="text-2xl font-bold text-emerald-700 mt-1">4.8 / 5.0</p>
            <span className="text-[11px] text-slate-500">Based on 320 ratings</span>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Department Wait Times Bar Chart */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5">
            <h3 className="text-sm font-bold text-slate-900 mb-1">
              Average Wait Time by Clinical Department (Minutes)
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Comparison of benchmark target vs today's actuals
            </p>

            <div className="h-64 w-full">
              {analytics?.waitTimesByDepartment && (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.waitTimesByDepartment}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="department" tick={{ fontSize: 11, fill: "#64748b" }} />
                    <YAxis tick={{ fontSize: 11, fill: "#64748b" }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0f172a",
                        color: "#fff",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                    />
                    <Bar dataKey="avgWait" fill="#2563eb" name="Actual Wait (min)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="target" fill="#94a3b8" name="Target Target" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Hourly Volume Area Chart */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5">
            <h3 className="text-sm font-bold text-slate-900 mb-1">
              Hourly Patient Flow & Arrival Pattern
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Check-in influx volume vs completed consultations
            </p>

            <div className="h-64 w-full">
              {analytics?.hourlyThroughput && (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analytics.hourlyThroughput}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="time" tick={{ fontSize: 11, fill: "#64748b" }} />
                    <YAxis tick={{ fontSize: 11, fill: "#64748b" }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0f172a",
                        color: "#fff",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="patients"
                      stroke="#2563eb"
                      fill="#dbeafe"
                      name="Patients Checked In"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
};
