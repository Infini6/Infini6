import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import { PageContainer } from "../components/layout/PageContainer";
import { useQuery } from "@tanstack/react-query";
import { operationsApi, analyticsApi } from "../services/journeyApi";
import { doctorApi } from "../services/doctorApi";
import { departmentApi } from "../services/hospitalApi";
import { useRealtimeSubscription } from "../websocket/useRealtime";
import {
  Users,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Stethoscope,
  ArrowRight,
  TrendingUp,
  Activity,
  UserCheck,
  AlertCircle,
  Sparkles,
  RefreshCw,
  Building2,
} from "lucide-react";
import {
  DoctorAvailabilityBadge,
  AlertSeverityBadge,
} from "../components/common/StatusBadge";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Listen to live websocket events to refresh queries seamlessly
  useRealtimeSubscription("*");

  const { data: summary, isLoading: isSummaryLoading, refetch: refetchSummary } = useQuery({
    queryKey: ["dashboard-metrics"],
    queryFn: operationsApi.getSummary,
  });

  const { data: workloads = [] } = useQuery({
    queryKey: ["operations", "departments"],
    queryFn: operationsApi.getDepartmentWorkloads,
  });

  const { data: doctors = [] } = useQuery({
    queryKey: ["doctors"],
    queryFn: () => doctorApi.getDoctors(),
  });

  const { data: alerts = [] } = useQuery({
    queryKey: ["alerts"],
    queryFn: operationsApi.getAlerts,
  });

  const { data: analytics } = useQuery({
    queryKey: ["analytics-overview"],
    queryFn: analyticsApi.getAnalyticsOverview,
  });

  const activeAlerts = alerts.filter((a) => !a.resolved);

  return (
    <PageContainer
      title="Hospital Operations Command Center"
      subtitle={`Live operational tracking for ${user?.hospitalName || "Metropolitan Central Hospital"}`}
      actions={
        <div className="flex items-center gap-2">
          <button
            onClick={() => refetchSummary()}
            className="p-2 text-slate-600 hover:bg-slate-100 rounded-xl border border-slate-200/80 bg-white shadow-2xs text-xs flex items-center gap-1.5 transition active:scale-95"
            title="Refresh Server Metrics"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline font-medium">Refresh</span>
          </button>
          <Link
            to="/queue"
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-semibold rounded-xl shadow-sm shadow-indigo-200/50 flex items-center gap-1.5 transition active:scale-[0.98]"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Open Live Queue Station</span>
          </Link>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Welcome Greeting Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 text-white shadow-xl shadow-slate-950/10 flex flex-col sm:flex-row sm:items-center justify-between gap-5 border border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-semibold px-2.5 py-0.5 bg-indigo-500/20 border border-indigo-400/30 rounded-full text-indigo-200">
                Staff On Duty: {user?.name}
              </span>
              <span className="text-xs text-slate-400">
                {new Date().toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric", year: "numeric" })}
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white">
              Hospital Operations Overview
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Real-time monitoring across clinical departments, outpatient queues, doctor availability, and smart patient journeys.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl px-4 py-2.5 text-center shadow-inner">
              <span className="text-[10px] uppercase font-bold text-indigo-300 tracking-wider block">
                Queue Fairness
              </span>
              <span className="text-lg font-extrabold text-white">
                {summary?.queueFairnessScore || 94}%
              </span>
            </div>
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl px-4 py-2.5 text-center shadow-inner">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                Active Alerts
              </span>
              <span className={`text-lg font-extrabold ${activeAlerts.length > 0 ? "text-amber-400" : "text-emerald-400"}`}>
                {activeAlerts.length}
              </span>
            </div>
          </div>
        </div>

        {/* 5 Core Metric Cards (Spec: Appointments, Waiting, In Consult, Completed, Delayed) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
          {/* Appointments */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Appointments
              </span>
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-900 mt-2">
              {summary?.todayAppointmentsCount ?? 124}
            </p>
            <span className="text-[11px] text-slate-500 mt-0.5 block">
              Scheduled for today
            </span>
          </div>

          {/* Waiting */}
          <div className="bg-white p-4 rounded-2xl border border-amber-200/80 shadow-xs bg-amber-50/10 hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">
                Waiting
              </span>
              <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-bold text-amber-900 mt-2">
              {summary?.waitingCount ?? 18}
            </p>
            <span className="text-[11px] text-amber-700 mt-0.5 block font-semibold">
              Avg wait: {summary?.averageWaitTimeMinutes ?? 18} min
            </span>
          </div>

          {/* In Consultation */}
          <div className="bg-white p-4 rounded-2xl border border-indigo-200/80 shadow-xs bg-indigo-50/10 hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-indigo-800 uppercase tracking-wider">
                In Consult
              </span>
              <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                <Activity className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-bold text-indigo-900 mt-2">
              {summary?.inConsultationCount ?? 6}
            </p>
            <span className="text-[11px] text-indigo-700 mt-0.5 block">
              Doctors actively serving
            </span>
          </div>

          {/* Completed */}
          <div className="bg-white p-4 rounded-2xl border border-emerald-200/80 shadow-xs bg-emerald-50/10 hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
                Completed
              </span>
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-bold text-emerald-900 mt-2">
              {summary?.completedCount ?? 82}
            </p>
            <span className="text-[11px] text-emerald-700 mt-0.5 block">
              Discharged / Rx given
            </span>
          </div>

          {/* Delayed / Action Required */}
          <div className="bg-white p-4 rounded-2xl border border-rose-200/80 shadow-xs bg-rose-50/10 col-span-2 sm:col-span-1 hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-rose-800 uppercase tracking-wider">
                Delayed / Risk
              </span>
              <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-bold text-rose-900 mt-2">
              {summary?.delayedCount ?? 7}
            </p>
            <span className="text-[11px] text-rose-700 mt-0.5 block font-semibold">
              Requires attention
            </span>
          </div>
        </div>

        {/* Live Department Queues Board (Spec section 14 & 60) */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-indigo-600" />
                <span>Live Department Queue Operations</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Real-time queue load, active tokens, and expected turnaround by clinical station
              </p>
            </div>
            <Link
              to="/queue"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 group"
            >
              <span>View Full Station Board</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {workloads.map((dept) => (
              <div
                key={dept.departmentId}
                onClick={() => navigate(`/queue?dept=${dept.departmentId}`)}
                className="p-4 rounded-2xl border border-slate-200/80 hover:border-indigo-300 hover:shadow-md transition-all bg-slate-50/50 hover:bg-white cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold text-slate-900 group-hover:text-indigo-700 transition">
                    {dept.departmentName}
                  </h4>
                  {dept.status === "DELAYED" ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                      ⚠ Delayed
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      ● Normal
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2 py-2.5 border-y border-slate-100 my-2 text-center">
                  <div>
                    <span className="text-[10px] text-slate-400 font-medium block">Waiting</span>
                    <span className="text-sm font-bold text-slate-900">{dept.waiting}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-medium block">In Consult</span>
                    <span className="text-sm font-bold text-indigo-700">{dept.inConsultation}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-medium block">Avg Wait</span>
                    <span className={`text-sm font-bold ${dept.avgWaitTime > 30 ? "text-rose-600" : "text-slate-800"}`}>
                      {dept.avgWaitTime} min
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                  <span>{dept.doctorsOnDuty} Doctors on duty</span>
                  <span className="text-indigo-600 font-semibold group-hover:underline flex items-center gap-0.5">
                    Manage Queue →
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Two Column Layout: Doctor Availability + Operational Alerts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Doctor Availability Widget (Spec section 14 & 59) */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Stethoscope className="w-4 h-4 text-indigo-600" />
                  <span>Attending Doctor Availability</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Real-time status and active consultation rooms
                </p>
              </div>
              <Link
                to="/doctors"
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 group"
              >
                <span>Manage Staff</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>

            <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto pr-1">
              {doctors.map((doc) => (
                <div
                  key={doc.id}
                  className="py-3 flex items-center justify-between gap-3 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-bold text-slate-900 truncate">
                        {doc.name}
                      </p>
                      <span className="text-[10px] font-mono font-medium text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded-md border border-slate-200">
                        {doc.roomNumber}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">
                      {doc.departmentName} • {doc.specialization}
                    </p>
                    {doc.statusMessage && (
                      <p className="text-[11px] text-indigo-700 font-medium mt-0.5">
                        {doc.statusMessage}
                      </p>
                    )}
                  </div>
                  <div className="shrink-0 flex flex-col items-end gap-1">
                    <DoctorAvailabilityBadge status={doc.availability} />
                    {doc.availability === "UNAVAILABLE" && (
                      <Link
                        to="/doctors"
                        className="text-[10px] font-bold text-rose-600 hover:underline"
                      >
                        Review Affected
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Operational Alerts Widget (Spec section 38) */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  <span>Hospital Operational Alerts</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Critical conditions requiring clinical coordination
                </p>
              </div>
              <Link
                to="/alerts"
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 group"
              >
                <span>Alert Center</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>

            <div className="space-y-3">
              {alerts.length === 0 ? (
                <div className="p-6 text-center text-slate-500 text-xs">
                  ✓ All hospital operations are running normally with no active alerts.
                </div>
              ) : (
                alerts.slice(0, 3).map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-3.5 rounded-xl border ${
                      alert.severity === "CRITICAL"
                        ? "bg-rose-50/50 border-rose-200"
                        : alert.severity === "WARNING"
                        ? "bg-amber-50/50 border-amber-200"
                        : "bg-indigo-50/50 border-indigo-100"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2">
                        <AlertSeverityBadge severity={alert.severity} />
                        <span className="text-xs font-bold text-slate-900">
                          {alert.title}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 shrink-0">
                        {alert.timestamp}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1">{alert.description}</p>
                    {alert.actionRequired && (
                      <div className="mt-2.5 flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-slate-800">
                          Action: {alert.actionRequired}
                        </span>
                        {alert.actionRoute && (
                          <Link
                            to={alert.actionRoute}
                            className="px-2.5 py-1 text-xs font-semibold bg-white border border-slate-200 rounded-lg text-slate-800 hover:bg-slate-50 shadow-2xs transition"
                          >
                            Resolve Now
                          </Link>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Hourly Patient Flow Mini-Chart */}
        {analytics?.hourlyThroughput && (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-indigo-600" />
                  <span>Today's Outpatient Hourly Volume & Waiting Times</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Volume of checked-in patients vs average clinic turnaround
                </p>
              </div>
            </div>

            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.hourlyThroughput}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="time" tick={{ fontSize: 11, fill: "#64748b" }} />
                  <YAxis tick={{ fontSize: 11, fill: "#64748b" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      color: "#fff",
                      borderRadius: "12px",
                      fontSize: "12px",
                      border: "none",
                      boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                    }}
                  />
                  <Bar dataKey="patients" fill="#4f46e5" name="Patients Served" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="waitAvg" fill="#f59e0b" name="Avg Wait (min)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  );
};
