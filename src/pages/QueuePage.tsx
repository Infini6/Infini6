import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import { PageContainer } from "../components/layout/PageContainer";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { queueApi } from "../services/queueApi";
import { departmentApi } from "../services/hospitalApi";
import { doctorApi } from "../services/doctorApi";
import { useRealtimeSubscription } from "../websocket/useRealtime";
import { QueueEntry, QueueStatus } from "../types";
import { DoubleActionButton } from "../components/common/DoubleActionButton";
import { QueueStatusBadge } from "../components/common/StatusBadge";
import {
  Clock,
  PhoneCall,
  CheckCircle2,
  AlertCircle,
  ArrowRightLeft,
  UserX,
  Volume2,
  Users,
  Building,
  Stethoscope,
  Sparkles,
  ArrowRight,
  Filter,
  CheckCheck,
} from "lucide-react";

export const QueuePage: React.FC = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialDept = searchParams.get("dept") || (user?.departmentId ? user.departmentId : "dept-cardiology");

  const [selectedDeptId, setSelectedDeptId] = useState<string>(initialDept);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>("ALL");
  const [transferModalEntry, setTransferModalEntry] = useState<QueueEntry | null>(null);
  const [targetTransferDept, setTargetTransferDept] = useState<string>("dept-radiology");
  const [actionSuccessToast, setActionSuccessToast] = useState<string | null>(null);

  const queryClient = useQueryClient();

  // Listen to realtime queue events
  useRealtimeSubscription("*");

  const { data: departments = [] } = useQuery({
    queryKey: ["departments"],
    queryFn: () => departmentApi.getDepartments(),
  });

  const { data: doctors = [] } = useQuery({
    queryKey: ["doctors", selectedDeptId],
    queryFn: () => doctorApi.getDoctors({ departmentId: selectedDeptId }),
  });

  const { data: queueEntries = [], isLoading } = useQuery({
    queryKey: ["queues", selectedDeptId, selectedDoctorId],
    queryFn: () =>
      queueApi.getQueueEntries({
        departmentId: selectedDeptId,
        doctorId: selectedDoctorId !== "ALL" ? selectedDoctorId : undefined,
      }),
    refetchInterval: 5000,
  });

  const activeDepartment = departments.find((d) => d.id === selectedDeptId) || departments[0];

  // Separate active/current vs waiting vs completed
  const currentlyServing = queueEntries.find(
    (q) => q.status === "IN_PROGRESS" || q.status === "CALLED"
  );
  const waitingList = queueEntries.filter((q) => q.status === "WAITING");
  const completedList = queueEntries.filter(
    (q) => q.status === "COMPLETED" || q.status === "NO_SHOW" || q.status === "SKIPPED"
  );

  const playCallChime = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } catch {
      // Ignore audio failure
    }
  };

  const handleCallNext = async () => {
    try {
      const called = await queueApi.callNext(
        selectedDeptId,
        selectedDoctorId !== "ALL" ? selectedDoctorId : undefined,
        user?.name
      );
      if (called) {
        playCallChime();
        setActionSuccessToast(`Token ${called.tokenNumber} (${called.patientName}) called to Room!`);
        queryClient.invalidateQueries({ queryKey: ["queues"] });
      } else {
        setActionSuccessToast("No waiting patients in this station queue.");
      }
    } catch (err: any) {
      alert(err.message || "Failed to call next patient.");
    }
  };

  const handleUpdateStatus = async (
    queueId: string,
    status: "IN_PROGRESS" | "COMPLETED" | "SKIPPED" | "NO_SHOW",
    tokenStr?: string
  ) => {
    try {
      await queueApi.updateStatus(queueId, status, user?.name);
      setActionSuccessToast(`Token ${tokenStr || "patient"} marked as ${status}.`);
      queryClient.invalidateQueries({ queryKey: ["queues"] });
    } catch (err: any) {
      alert(err.message || "Failed to update queue state.");
    }
  };

  const handleTransferSubmit = async () => {
    if (!transferModalEntry) return;
    try {
      await queueApi.updateStatus(
        transferModalEntry.id,
        "TRANSFERRED",
        user?.name,
        targetTransferDept
      );
      const targetName = departments.find((d) => d.id === targetTransferDept)?.name || "Department";
      setActionSuccessToast(`Patient transferred to ${targetName}.`);
      setTransferModalEntry(null);
      queryClient.invalidateQueries({ queryKey: ["queues"] });
    } catch (err: any) {
      alert(err.message || "Failed to transfer patient.");
    }
  };

  useEffect(() => {
    if (actionSuccessToast) {
      const timer = setTimeout(() => setActionSuccessToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [actionSuccessToast]);

  return (
    <PageContainer
      title="Live Queue Management Station"
      subtitle="Operational station console for calling patients, managing consultation progress, and monitoring wait times"
      actions={
        <div className="flex items-center gap-2">
          <DoubleActionButton
            id="call-next-btn-header"
            onAction={handleCallNext}
            variant="primary"
            size="md"
            loadingText="Selecting Next Patient..."
            className="shadow-sm shadow-indigo-200/50"
          >
            <PhoneCall className="w-4 h-4 mr-1.5" />
            <span>CALL NEXT PATIENT</span>
          </DoubleActionButton>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Department Filter Tabs */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-2.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 w-full sm:w-auto">
            {departments.map((dept) => {
              const isSelected = dept.id === selectedDeptId;
              return (
                <button
                  key={dept.id}
                  onClick={() => {
                    setSelectedDeptId(dept.id);
                    setSearchParams({ dept: dept.id });
                    setSelectedDoctorId("ALL");
                  }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                    isSelected
                      ? "bg-indigo-600 text-white shadow-xs shadow-indigo-200"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <Building className="w-3.5 h-3.5" />
                  <span>{dept.name}</span>
                </button>
              );
            })}
          </div>

          {/* Doctor Filter */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <span className="text-xs text-slate-500 font-medium">Doctor Filter:</span>
            <select
              value={selectedDoctorId}
              onChange={(e) => setSelectedDoctorId(e.target.value)}
              className="px-3 py-1.5 text-xs font-medium border border-slate-200/80 rounded-xl bg-slate-50/70 focus:bg-white focus:ring-2 focus:ring-indigo-500 text-slate-800 transition"
            >
              <option value="ALL">All Station Doctors</option>
              {doctors.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  {doc.name} ({doc.roomNumber})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Action Toast Alert */}
        {actionSuccessToast && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200/80 rounded-2xl flex items-center justify-between text-xs text-emerald-800 animate-in fade-in slide-in-from-top-1 shadow-xs">
            <div className="flex items-center gap-2">
              <CheckCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-semibold">{actionSuccessToast}</span>
            </div>
            <button
              onClick={() => setActionSuccessToast(null)}
              className="text-emerald-600 hover:text-emerald-900 font-bold p-1"
            >
              ✕
            </button>
          </div>
        )}

        {/* Top Grid: Currently Serving Hero Card + Station Queue Telemetry */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* CURRENTLY SERVING HERO CARD (Spec section 23) */}
          <div className="lg:col-span-2 bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 rounded-3xl p-6 text-white shadow-xl shadow-slate-950/10 border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-bold uppercase tracking-widest text-emerald-300">
                    Station Active Console
                  </span>
                  <span className="text-xs text-slate-400">• {activeDepartment?.name}</span>
                </div>
                <span className="text-xs font-mono font-medium bg-slate-800/80 text-slate-300 px-2.5 py-0.5 rounded-lg border border-slate-700">
                  {activeDepartment?.roomNumber || "Wing 200"}
                </span>
              </div>

              {currentlyServing ? (
                <div className="py-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div>
                    <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold block">
                      Currently Serving Token
                    </span>
                    <div className="flex items-baseline gap-3 mt-1.5">
                      <span className="text-4xl sm:text-5xl font-black tracking-tight text-white font-mono bg-indigo-500/20 px-3.5 py-1.5 rounded-2xl border border-indigo-400/40 shadow-inner">
                        {currentlyServing.tokenNumber}
                      </span>
                      <div>
                        <h3 className="text-lg font-bold text-slate-100">
                          {currentlyServing.patientName}
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5">
                          MRN: <span className="font-mono text-slate-300">{currentlyServing.patientMrn}</span> • {currentlyServing.serviceName}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-800/60 backdrop-blur-xs border border-slate-700/60 p-4 rounded-2xl space-y-2 text-xs text-slate-300 shrink-0 min-w-56">
                    <p className="flex justify-between">
                      <span className="text-slate-400">Doctor:</span>
                      <strong className="text-white font-semibold">{currentlyServing.doctorName}</strong>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-slate-400">Consultation Room:</span>
                      <strong className="text-white font-semibold">{currentlyServing.roomNumber}</strong>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-slate-400">Status:</span>
                      <span className="font-bold text-amber-300">{currentlyServing.status}</span>
                    </p>
                    {currentlyServing.calledAt && (
                      <p className="flex justify-between">
                        <span className="text-slate-400">Called at:</span>
                        <span>{currentlyServing.calledAt}</span>
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="py-10 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-slate-800/80 text-slate-400 flex items-center justify-center mx-auto mb-3 border border-slate-700">
                    <Clock className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-slate-200">
                    No Patient Currently in Consultation
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto leading-relaxed">
                    {waitingList.length > 0
                      ? `${waitingList.length} patient(s) waiting in queue. Press "Call Next Patient" to advance the station queue.`
                      : "The queue is currently clear for this department."}
                  </p>
                </div>
              )}
            </div>

            {/* Action Bar for Currently Serving Patient */}
            <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <DoubleActionButton
                  id="call-next-btn-main"
                  onAction={handleCallNext}
                  variant="primary"
                  size="md"
                  loadingText="Calling..."
                  disabled={waitingList.length === 0}
                  className="bg-indigo-600 hover:bg-indigo-500"
                >
                  <PhoneCall className="w-4 h-4 mr-1.5" />
                  <span>Call Next ({waitingList.length} Waiting)</span>
                </DoubleActionButton>

                {currentlyServing?.status === "CALLED" && (
                  <DoubleActionButton
                    onAction={() =>
                      handleUpdateStatus(
                        currentlyServing.id,
                        "IN_PROGRESS",
                        currentlyServing.tokenNumber
                      )
                    }
                    variant="success"
                    size="md"
                    loadingText="Starting..."
                  >
                    <CheckCircle2 className="w-4 h-4 mr-1.5" />
                    <span>Start Consultation</span>
                  </DoubleActionButton>
                )}

                {currentlyServing?.status === "IN_PROGRESS" && (
                  <DoubleActionButton
                    onAction={() =>
                      handleUpdateStatus(
                        currentlyServing.id,
                        "COMPLETED",
                        currentlyServing.tokenNumber
                      )
                    }
                    variant="success"
                    size="md"
                    loadingText="Completing..."
                  >
                    <CheckCircle2 className="w-4 h-4 mr-1.5" />
                    <span>Complete & Discharge</span>
                  </DoubleActionButton>
                )}
              </div>

              {currentlyServing && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      handleUpdateStatus(
                        currentlyServing.id,
                        "SKIPPED",
                        currentlyServing.tokenNumber
                      )
                    }
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 border border-slate-700 transition"
                  >
                    Skip
                  </button>
                  <button
                    onClick={() =>
                      handleUpdateStatus(
                        currentlyServing.id,
                        "NO_SHOW",
                        currentlyServing.tokenNumber
                      )
                    }
                    className="px-3 py-1.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-xs font-semibold text-rose-300 border border-rose-800/60 transition"
                  >
                    <UserX className="w-3.5 h-3.5 inline mr-1" />
                    No-Show
                  </button>
                  <button
                    onClick={() => setTransferModalEntry(currentlyServing)}
                    className="px-3 py-1.5 rounded-xl bg-indigo-950/40 hover:bg-indigo-900/60 text-xs font-semibold text-indigo-300 border border-indigo-800/60 transition"
                  >
                    <ArrowRightLeft className="w-3.5 h-3.5 inline mr-1" />
                    Transfer
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Department Queue Stats Sidebar */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-600" />
                <span>Station Queue Metrics</span>
              </h3>

              <div className="space-y-3">
                <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-600">Waiting Patients:</span>
                  <span className="text-base font-bold text-amber-700">
                    {waitingList.length}
                  </span>
                </div>
                <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-600">Average Turnaround:</span>
                  <span className="text-base font-bold text-slate-900">
                    {activeDepartment?.averageWaitTimeMinutes || 15} min
                  </span>
                </div>
                <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-600">Active Counters:</span>
                  <span className="text-base font-bold text-indigo-700">
                    {activeDepartment?.activeCounters || 2} Counters
                  </span>
                </div>
                <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-600">Completed Today:</span>
                  <span className="text-base font-bold text-emerald-700">
                    {completedList.filter((c) => c.status === "COMPLETED").length}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100">
              <p className="text-[11px] text-slate-500 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                <span>Backend Smart Queue calculates ETA continuously.</span>
              </p>
            </div>
          </div>
        </div>

        {/* WAITING PATIENTS QUEUE TABLE */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600" />
                <span>Waiting Patients in Queue ({waitingList.length})</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Authoritative chronological & smart-priority queue managed by shared backend
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-4">Pos / Token</th>
                  <th className="py-3.5 px-4">Patient Information</th>
                  <th className="py-3.5 px-4">Service & Doctor</th>
                  <th className="py-3.5 px-4">Checked In</th>
                  <th className="py-3.5 px-4">Estimated Wait</th>
                  <th className="py-3.5 px-4">Priority</th>
                  <th className="py-3.5 px-4 text-right">Station Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {waitingList.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-slate-500 text-xs">
                      No patients currently waiting in this department queue.
                    </td>
                  </tr>
                ) : (
                  waitingList.map((entry, idx) => (
                    <tr
                      key={entry.id}
                      className="hover:bg-indigo-50/30 transition group"
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-[10px] border border-slate-200">
                            {idx + 1}
                          </span>
                          <span className="font-mono font-bold text-xs text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-200/80">
                            {entry.tokenNumber}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-slate-900">{entry.patientName}</p>
                        <p className="text-[11px] text-slate-400 font-mono">MRN: {entry.patientMrn}</p>
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="text-slate-800 font-medium">{entry.serviceName}</p>
                        <p className="text-[11px] text-slate-400">{entry.doctorName} • {entry.roomNumber}</p>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 font-medium">
                        {entry.checkedInAt}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/80">
                          ~{entry.estimatedWaitMinutes} min
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        {entry.priority === "ELDERLY" ? (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                            Elderly Assist
                          </span>
                        ) : entry.priority === "PRIORITY" ? (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            Clinical Priority
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-600">
                            Normal
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <DoubleActionButton
                          onAction={() =>
                            handleUpdateStatus(entry.id, "IN_PROGRESS", entry.tokenNumber)
                          }
                          variant="primary"
                          size="sm"
                          loadingText="Calling..."
                        >
                          <PhoneCall className="w-3 h-3 mr-1" />
                          <span>Call Token</span>
                        </DoubleActionButton>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recently Completed / History for Station */}
        {completedList.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
              Recently Processed Today ({completedList.length})
            </h3>
            <div className="flex flex-wrap gap-2">
              {completedList.slice(0, 10).map((item) => (
                <div
                  key={item.id}
                  className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-700 flex items-center gap-2"
                >
                  <span className="font-mono font-bold text-indigo-700">{item.tokenNumber}</span>
                  <span className="text-slate-500">• {item.patientName}</span>
                  <QueueStatusBadge status={item.status} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Transfer Patient Modal */}
      {transferModalEntry && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-indigo-600" />
                <span>Transfer Patient to Department</span>
              </h3>
              <button
                onClick={() => setTransferModalEntry(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-2xl mb-4 text-xs text-slate-700 space-y-1 border border-slate-100">
              <p><strong>Patient:</strong> {transferModalEntry.patientName} ({transferModalEntry.patientMrn})</p>
              <p><strong>Current Token:</strong> {transferModalEntry.tokenNumber} ({transferModalEntry.departmentName})</p>
            </div>

            <div className="space-y-3 mb-6">
              <label className="block text-xs font-semibold text-slate-700">
                Select Destination Department / Service:
              </label>
              <select
                value={targetTransferDept}
                onChange={(e) => setTargetTransferDept(e.target.value)}
                className="w-full p-2.5 text-xs border border-slate-200 rounded-xl bg-slate-50/70 font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 transition"
              >
                {departments
                  .filter((d) => d.id !== selectedDeptId)
                  .map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.building} - {d.floor})
                    </option>
                  ))}
              </select>
            </div>

            <div className="flex items-center justify-end gap-2.5">
              <button
                onClick={() => setTransferModalEntry(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Cancel
              </button>
              <DoubleActionButton
                onAction={handleTransferSubmit}
                variant="primary"
                size="md"
                loadingText="Transferring..."
              >
                Confirm Transfer
              </DoubleActionButton>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
};
