import React, { useState } from "react";
import { PageContainer } from "../components/layout/PageContainer";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { departmentApi } from "../services/hospitalApi";
import { Department } from "../types";
import { DoubleActionButton } from "../components/common/DoubleActionButton";
import {
  Building,
  MapPin,
  Clock,
  Users,
  Activity,
  Plus,
  Edit2,
  CheckCheck,
} from "lucide-react";

export const DepartmentsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const { data: departments = [], isLoading } = useQuery({
    queryKey: ["departments"],
    queryFn: () => departmentApi.getDepartments(),
  });

  const handleSaveDept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDept) return;
    try {
      await departmentApi.updateDepartment(editingDept.id, editingDept);
      setToastMessage(`Updated department ${editingDept.name}.`);
      setEditingDept(null);
      queryClient.invalidateQueries({ queryKey: ["departments"] });
    } catch (err: any) {
      alert(err.message || "Failed to update department.");
    }
  };

  return (
    <PageContainer
      title="Clinical Department Management"
      subtitle="Configure clinical units, consultation suites, room assignments, and operational capacity"
    >
      <div className="space-y-6">
        {toastMessage && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-800 shadow-xs">
            <div className="flex items-center gap-2">
              <CheckCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-semibold">{toastMessage}</span>
            </div>
            <button onClick={() => setToastMessage(null)} className="font-bold">
              ✕
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {departments.map((dept) => (
            <div
              key={dept.id}
              className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 flex flex-col justify-between hover:border-blue-300 transition"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{dept.name}</h3>
                    <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                      {dept.code}
                    </span>
                  </div>
                  {dept.status === "DELAYED" ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                      ⚠ Delayed
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                      ● Active
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-600 mb-4 line-clamp-2">{dept.description}</p>

                <div className="space-y-1.5 text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100 mb-4">
                  <p className="flex justify-between">
                    <span className="text-slate-400">Location:</span>
                    <strong className="text-slate-800">{dept.building} • {dept.block}</strong>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-slate-400">Floor & Wing:</span>
                    <strong className="text-blue-700">{dept.floor} ({dept.roomNumber})</strong>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-slate-400">Active Counters:</span>
                    <span>{dept.activeCounters} Counters Open</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-slate-400">Average Turnaround:</span>
                    <span className="font-bold text-slate-900">{dept.averageWaitTimeMinutes} min</span>
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500">{dept.activeDoctorsCount} Doctors Assigned</span>
                <button
                  onClick={() => setEditingDept(dept)}
                  className="px-2.5 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-50 rounded-md transition flex items-center gap-1"
                >
                  <Edit2 className="w-3 h-3" />
                  <span>Edit Config</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Edit Department Modal */}
      {editingDept && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-3">
              Edit Department Configuration
            </h3>
            <form onSubmit={handleSaveDept} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Department Name</label>
                <input
                  type="text"
                  value={editingDept.name}
                  onChange={(e) => setEditingDept({ ...editingDept, name: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Building</label>
                  <input
                    type="text"
                    value={editingDept.building}
                    onChange={(e) => setEditingDept({ ...editingDept, building: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Floor</label>
                  <input
                    type="text"
                    value={editingDept.floor}
                    onChange={(e) => setEditingDept({ ...editingDept, floor: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Room / Suite</label>
                  <input
                    type="text"
                    value={editingDept.roomNumber}
                    onChange={(e) => setEditingDept({ ...editingDept, roomNumber: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Active Counters</label>
                  <input
                    type="number"
                    value={editingDept.activeCounters}
                    onChange={(e) => setEditingDept({ ...editingDept, activeCounters: Number(e.target.value) })}
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingDept(null)}
                  className="px-3 py-1.5 text-slate-700 hover:bg-slate-100 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageContainer>
  );
};
