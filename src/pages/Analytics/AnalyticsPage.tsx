import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import { analyticsService } from '../../services/analyticsService';
import { queryKeys } from '../../query/queryKeys';
import { AnalyticsTimeRange } from '../../types/analytics.types';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import {
  BarChart3,
  Clock,
  Users,
  CheckCircle2,
  TrendingUp,
  RefreshCw,
  Calendar,
  AlertCircle,
  UserCheck,
  Activity,
  Stethoscope,
  Layers,
  Flame,
  ArrowUpRight,
  TrendingDown,
  Sparkles,
} from 'lucide-react';

export const AnalyticsPage: React.FC = () => {
  const { user } = useAuth();
  const hospitalId = user?.hospital?.id || '';
  const [timeRange, setTimeRange] = useState<AnalyticsTimeRange>('today');

  const {
    data: analytics,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: queryKeys.analytics.stats(hospitalId, timeRange),
    queryFn: () => analyticsService.getAnalyticsData(hospitalId, timeRange),
    enabled: Boolean(hospitalId),
  });

  const kpis = analytics?.kpis;

  const timeRangeLabel =
    timeRange === 'today'
      ? "Today's"
      : timeRange === '7d'
      ? 'Last 7 Days'
      : 'Last 30 Days';

  return (
    <div className="space-y-6">
      {/* Header with Title and Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Hospital Operations Analytics
            </h2>
            <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-700 border-blue-200">
              Supabase PostgreSQL
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Operational throughput, queue wait velocity, clinician workload, and specialty utilization.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Time Range Filter Switcher */}
          <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-medium">
            <button
              onClick={() => setTimeRange('today')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                timeRange === 'today'
                  ? 'bg-white text-blue-700 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setTimeRange('7d')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                timeRange === '7d'
                  ? 'bg-white text-blue-700 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Last 7 days
            </button>
            <button
              onClick={() => setTimeRange('30d')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                timeRange === '30d'
                  ? 'bg-white text-blue-700 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Last 30 days
            </button>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={() => refetch()}
            disabled={isFetching}
            className="text-xs gap-1.5 bg-white"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin text-blue-600' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Loading Skeleton */}
      {isLoading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-24 bg-slate-100 rounded-xl animate-pulse border border-slate-200" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-80 bg-slate-100 rounded-xl animate-pulse border border-slate-200" />
            <div className="h-80 bg-slate-100 rounded-xl animate-pulse border border-slate-200" />
          </div>
        </div>
      ) : isError ? (
        <div className="p-8 bg-rose-50 border border-rose-200 rounded-xl text-center">
          <AlertCircle className="w-8 h-8 mx-auto text-rose-600 mb-2" />
          <h3 className="text-sm font-bold text-rose-900">Failed to load analytics</h3>
          <p className="text-xs text-rose-600 mt-1">
            {(error as any)?.message || 'An unexpected database error occurred.'}
          </p>
          <Button size="sm" onClick={() => refetch()} className="mt-3 text-xs bg-rose-600 hover:bg-rose-700 text-white">
            Retry Loading
          </Button>
        </div>
      ) : (
        <>
          {/* 8 KPI Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {/* 1. Today's / Range Appointments */}
            <Card className="hover:border-blue-300 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-center justify-between text-slate-500">
                  <span className="text-[11px] font-semibold uppercase tracking-wider">
                    {timeRange === 'today' ? "Today's Appointments" : 'Total Appointments'}
                  </span>
                  <Calendar className="w-4 h-4 text-blue-600" />
                </div>
                <div className="text-2xl font-bold text-slate-900 mt-2">
                  {kpis?.appointmentsCount ?? 0}
                </div>
                <div className="text-[10px] text-slate-500 font-medium mt-1 flex items-center gap-1">
                  <span>Scope: {timeRangeLabel}</span>
                </div>
              </CardContent>
            </Card>

            {/* 2. Completed Consultations */}
            <Card className="hover:border-emerald-300 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-center justify-between text-slate-500">
                  <span className="text-[11px] font-semibold uppercase tracking-wider">
                    Completed Consultations
                  </span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-2xl font-bold text-slate-900 mt-2">
                  {kpis?.completedConsultations ?? 0}
                </div>
                <div className="text-[10px] text-emerald-600 font-medium mt-1 flex items-center gap-1">
                  <ArrowUpRight className="w-3 h-3" />
                  <span>
                    {kpis?.appointmentsCount
                      ? `${Math.round(((kpis.completedConsultations) / kpis.appointmentsCount) * 100)}% throughput`
                      : '0% throughput'}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* 3. Waiting Patients */}
            <Card className="hover:border-amber-300 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-center justify-between text-slate-500">
                  <span className="text-[11px] font-semibold uppercase tracking-wider">
                    Waiting Patients
                  </span>
                  <Users className="w-4 h-4 text-amber-600" />
                </div>
                <div className="text-2xl font-bold text-slate-900 mt-2">
                  {kpis?.waitingPatients ?? 0}
                </div>
                <div className="text-[10px] text-amber-600 font-medium mt-1">
                  In OPD Queue Halls
                </div>
              </CardContent>
            </Card>

            {/* 4. Average Waiting Time */}
            <Card className="hover:border-indigo-300 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-center justify-between text-slate-500">
                  <span className="text-[11px] font-semibold uppercase tracking-wider">
                    Average Waiting Time
                  </span>
                  <Clock className="w-4 h-4 text-indigo-600" />
                </div>
                <div className="text-2xl font-bold text-slate-900 mt-2">
                  {kpis?.avgWaitingTimeMinutes ?? 0}{' '}
                  <span className="text-xs font-normal text-slate-500">mins</span>
                </div>
                <div className="text-[10px] text-slate-500 font-medium mt-1">
                  Benchmark: &lt; 20m target
                </div>
              </CardContent>
            </Card>

            {/* 5. No-Show Rate */}
            <Card className="hover:border-rose-300 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-center justify-between text-slate-500">
                  <span className="text-[11px] font-semibold uppercase tracking-wider">
                    No-Show Rate
                  </span>
                  <TrendingDown className="w-4 h-4 text-rose-600" />
                </div>
                <div className="text-2xl font-bold text-slate-900 mt-2">
                  {kpis?.noShowRate ?? 0}%
                </div>
                <div className="text-[10px] text-slate-500 font-medium mt-1">
                  {kpis?.noShowCount ?? 0} missed appointments
                </div>
              </CardContent>
            </Card>

            {/* 6. Active Consultations */}
            <Card className="hover:border-blue-300 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-center justify-between text-slate-500">
                  <span className="text-[11px] font-semibold uppercase tracking-wider">
                    Active Consultations
                  </span>
                  <Activity className="w-4 h-4 text-blue-600" />
                </div>
                <div className="text-2xl font-bold text-slate-900 mt-2">
                  {kpis?.activeConsultations ?? 0}
                </div>
                <div className="text-[10px] text-blue-600 font-medium mt-1">
                  In Doctor Chambers
                </div>
              </CardContent>
            </Card>

            {/* 7. Available Doctors */}
            <Card className="hover:border-emerald-300 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-center justify-between text-slate-500">
                  <span className="text-[11px] font-semibold uppercase tracking-wider">
                    Available Doctors
                  </span>
                  <Stethoscope className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-2xl font-bold text-slate-900 mt-2">
                  {kpis?.availableDoctors ?? 0}{' '}
                  <span className="text-xs font-normal text-slate-500">
                    / {kpis?.totalDoctors ?? 0} active
                  </span>
                </div>
                <div className="text-[10px] text-emerald-600 font-medium mt-1">
                  Ready for Consultation
                </div>
              </CardContent>
            </Card>

            {/* 8. Queue Utilization */}
            <Card className="hover:border-purple-300 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-center justify-between text-slate-500">
                  <span className="text-[11px] font-semibold uppercase tracking-wider">
                    Queue Utilization
                  </span>
                  <Flame className="w-4 h-4 text-purple-600" />
                </div>
                <div className="text-2xl font-bold text-slate-900 mt-2">
                  {kpis?.queueUtilization ?? 0}%
                </div>
                <div className="text-[10px] text-purple-600 font-medium mt-1">
                  OPD Floor Capacity Used
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row 1: Appointments by Department & Appointments Over Time */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 1: Appointments by Department */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-blue-600" />
                    Appointments by Department
                  </span>
                  <Badge variant="outline" className="text-[10px]">
                    By Clinical Specialty
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="w-full h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={analytics?.appointmentsByDepartment || []}
                      margin={{ top: 10, right: 10, left: -15, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis
                        dataKey="departmentName"
                        tick={{ fontSize: 11, fill: '#64748b' }}
                        axisLine={{ stroke: '#e2e8f0' }}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: '#64748b' }}
                        axisLine={{ stroke: '#e2e8f0' }}
                        tickLine={false}
                        allowDecimals={false}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#ffffff',
                          borderRadius: '8px',
                          border: '1px solid #e2e8f0',
                          fontSize: '12px',
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                      <Bar dataKey="count" name="Total Appointments" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="completed" name="Completed" fill="#10b981" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="waiting" name="Waiting" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Chart 2: Appointments Over Time */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-indigo-600" />
                    Appointments Over Time ({timeRangeLabel})
                  </span>
                  <Badge variant="outline" className="text-[10px]">
                    {timeRange === 'today' ? 'Hourly Curve' : 'Daily Volume'}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="w-full h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={analytics?.appointmentsOverTime || []}
                      margin={{ top: 10, right: 10, left: -15, bottom: 5 }}
                    >
                      <defs>
                        <linearGradient id="colorApts" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis
                        dataKey="timeLabel"
                        tick={{ fontSize: 11, fill: '#64748b' }}
                        axisLine={{ stroke: '#e2e8f0' }}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: '#64748b' }}
                        axisLine={{ stroke: '#e2e8f0' }}
                        tickLine={false}
                        allowDecimals={false}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#ffffff',
                          borderRadius: '8px',
                          border: '1px solid #e2e8f0',
                          fontSize: '12px',
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                      <Area
                        type="monotone"
                        dataKey="appointments"
                        name="Scheduled / Booked"
                        stroke="#6366f1"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorApts)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row 2: Average Waiting Time Trend & Completed Consultations */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 3: Average Waiting Time Trend */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-600" />
                    Average Waiting Time Trend (Minutes)
                  </span>
                  <span className="text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    Target: &le; 20m
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="w-full h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={analytics?.waitingTimeTrend || []}
                      margin={{ top: 10, right: 10, left: -15, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis
                        dataKey="timeLabel"
                        tick={{ fontSize: 11, fill: '#64748b' }}
                        axisLine={{ stroke: '#e2e8f0' }}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: '#64748b' }}
                        axisLine={{ stroke: '#e2e8f0' }}
                        tickLine={false}
                        unit="m"
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#ffffff',
                          borderRadius: '8px',
                          border: '1px solid #e2e8f0',
                          fontSize: '12px',
                        }}
                      />
                      <ReferenceLine
                        y={20}
                        stroke="#ef4444"
                        strokeDasharray="4 4"
                        label={{ value: 'Target Max (20m)', position: 'insideTopRight', fill: '#ef4444', fontSize: 10 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="avgWaitTime"
                        name="Average Wait Time (mins)"
                        stroke="#f59e0b"
                        strokeWidth={2.5}
                        dot={{ r: 3, fill: '#f59e0b' }}
                        activeDot={{ r: 5 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Chart 4: Completed Consultations */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Completed Consultations Velocity
                  </span>
                  <Badge variant="outline" className="text-[10px] text-emerald-700 bg-emerald-50">
                    Discharged / Concluded
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="w-full h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={analytics?.completedConsultationsTrend || []}
                      margin={{ top: 10, right: 10, left: -15, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis
                        dataKey="timeLabel"
                        tick={{ fontSize: 11, fill: '#64748b' }}
                        axisLine={{ stroke: '#e2e8f0' }}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: '#64748b' }}
                        axisLine={{ stroke: '#e2e8f0' }}
                        tickLine={false}
                        allowDecimals={false}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#ffffff',
                          borderRadius: '8px',
                          border: '1px solid #e2e8f0',
                          fontSize: '12px',
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                      <Bar dataKey="completed" name="Completed Consultations" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row 3: No-Show Trend & Doctor Workload */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 5: No-Show Trend */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <TrendingDown className="w-4 h-4 text-rose-600" />
                    No-Show & Drop-Off Trend
                  </span>
                  <Badge variant="outline" className="text-[10px] text-rose-700 bg-rose-50">
                    Missed Encounters
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="w-full h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={analytics?.noShowTrend || []}
                      margin={{ top: 10, right: 10, left: -15, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis
                        dataKey="timeLabel"
                        tick={{ fontSize: 11, fill: '#64748b' }}
                        axisLine={{ stroke: '#e2e8f0' }}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: '#64748b' }}
                        axisLine={{ stroke: '#e2e8f0' }}
                        tickLine={false}
                        allowDecimals={false}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#ffffff',
                          borderRadius: '8px',
                          border: '1px solid #e2e8f0',
                          fontSize: '12px',
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                      <Line
                        type="monotone"
                        dataKey="noShows"
                        name="No-Show Count"
                        stroke="#e11d48"
                        strokeWidth={2}
                        dot={{ r: 3, fill: '#e11d48' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Chart 6: Doctor Workload */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Stethoscope className="w-4 h-4 text-blue-600" />
                    Doctor Workload & Case Allocation
                  </span>
                  <Badge variant="outline" className="text-[10px]">
                    Consultations Breakdown
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="w-full h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={analytics?.doctorWorkload || []}
                      layout="vertical"
                      margin={{ top: 10, right: 10, left: 30, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                      <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
                      <YAxis
                        type="category"
                        dataKey="doctorName"
                        tick={{ fontSize: 10, fill: '#64748b' }}
                        width={90}
                        axisLine={{ stroke: '#e2e8f0' }}
                        tickLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#ffffff',
                          borderRadius: '8px',
                          border: '1px solid #e2e8f0',
                          fontSize: '12px',
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                      <Bar dataKey="completed" name="Completed" stackId="a" fill="#10b981" />
                      <Bar dataKey="active" name="In Progress" stackId="a" fill="#3b82f6" />
                      <Bar dataKey="scheduled" name="Scheduled" stackId="a" fill="#94a3b8" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Chart 7: Service Utilization */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-purple-600" />
                  Clinical Service Utilization & Patient Demand
                </span>
                <span className="text-xs text-slate-500">
                  Total Active Clinical Services: {analytics?.serviceUtilization?.length || 0}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="w-full h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={analytics?.serviceUtilization || []}
                    margin={{ top: 10, right: 10, left: -15, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="serviceName"
                      tick={{ fontSize: 10, fill: '#64748b' }}
                      axisLine={{ stroke: '#e2e8f0' }}
                      tickLine={false}
                      angle={-15}
                      textAnchor="end"
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      axisLine={{ stroke: '#e2e8f0' }}
                      tickLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip
                      formatter={(val: any, name: any) => [
                        `${val} encounters`,
                        name === 'count' ? 'Encounters' : name,
                      ]}
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0',
                        fontSize: '12px',
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '15px' }} />
                    <Bar dataKey="count" name="Patient Encounters" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};
