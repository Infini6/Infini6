import React from "react";
import { Link } from "react-router-dom";
import { PageContainer } from "../components/layout/PageContainer";
import { useQuery } from "@tanstack/react-query";
import { operationsApi } from "../services/journeyApi";
import { useRealtimeSubscription } from "../websocket/useRealtime";
import {
  Activity,
  Radio,
  Clock,
  Users,
  AlertTriangle,
  Building,
  ArrowRight,
  TrendingUp,
} from "lucide-react";

export const OperationsPage: React.FC = () => {
  useRealtimeSubscription("*");

  const { data: workloads = [] } = useQuery({
    queryKey: ["operations", "departments"],
    queryFn: operationsApi.getDepartmentWorkloads,
    refetchInterval: 4000,
  });

  const { data: summary } = useQuery({
    queryKey: ["dashboard-metrics"],
    queryFn: operationsApi.getSummary,
  });

  return (
    <PageContainer
      title="Live Hospital Operations & Queues Board"
      subtitle="Full-screen continuous operational telemetry across all hospital departments"
    >
      <div className="space-y-6">
        {/* Live Broadcast Header Banner */}
        <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
            <div>
              <h3 className="text-sm font-bold tracking-wide uppercase text-slate-100 flex items-center gap-2">
                <span>Live Operational Feed</span>
                <span className="text-[10px] bg-blue-600 px-2 py-0.5 rounded text-white font-mono">
                  LIVE SOCKET
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Synchronized across Central Kiosks, Department LCD Monitors, and Mobile Patient Apps
              </p>
            </div>
          </div>
          <div className="text-right font-mono text-xs text-slate-300">
            {new Date().toLocaleTimeString()}
          </div>
        </div>

        {/* Master Department Status Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {workloads.map((dept) => (
            <div
              key={dept.departmentId}
              className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 flex flex-col justify-between hover:shadow-md transition"
            >
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4 text-blue-600" />
                    <h4 className="text-sm font-bold text-slate-900">{dept.departmentName}</h4>
                  </div>
                  {dept.status === "DELAYED" ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                      ⚠ HIGH LOAD
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      ● NORMAL
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="p-3 bg-slate-50 rounded-xl text-center">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                      Waiting in Hall
                    </span>
                    <span className="text-2xl font-bold text-slate-900">{dept.waiting}</span>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-xl text-center">
                    <span className="text-[10px] text-blue-600 uppercase font-semibold block">
                      In Consultation
                    </span>
                    <span className="text-2xl font-bold text-blue-700">{dept.inConsultation}</span>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600">
                  <p className="flex justify-between">
                    <span className="text-slate-400">Average Wait:</span>
                    <strong className={dept.avgWaitTime > 30 ? "text-rose-600" : "text-slate-800"}>
                      {dept.avgWaitTime} minutes
                    </strong>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-slate-400">Doctors on Duty:</span>
                    <span>{dept.doctorsOnDuty} Doctors</span>
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 mt-4">
                <Link
                  to={`/queue?dept=${dept.departmentId}`}
                  className="w-full py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold rounded-lg text-xs flex items-center justify-center gap-1 transition"
                >
                  <span>Open Station Queue Console</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </PageContainer>
  );
};
