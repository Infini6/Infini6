import React, { useState } from "react";
import { PageContainer } from "../components/layout/PageContainer";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { navigationApi } from "../services/journeyApi";
import { NavigationLocation } from "../types";
import { DoubleActionButton } from "../components/common/DoubleActionButton";
import {
  MapPin,
  Building,
  Plus,
  Edit2,
  Trash2,
  Navigation,
  Compass,
  CheckCheck,
} from "lucide-react";

export const NavigationConfigPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedFloor, setSelectedFloor] = useState("Floor 2");
  const [editingNode, setEditingNode] = useState<NavigationLocation | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [newNodeName, setNewNodeName] = useState("");
  const [newNodeType, setNewNodeType] = useState<NavigationLocation["type"]>("CONSULTATION_ROOM");
  const [newNodeRoom, setNewNodeRoom] = useState("");
  const [newNodeDirections, setNewNodeDirections] = useState("");

  const { data: nodes = [], isLoading } = useQuery({
    queryKey: ["navigation-nodes"],
    queryFn: () => navigationApi.getNavigationLocations(),
  });

  const filteredNodes = nodes.filter((n) => n.floor === selectedFloor);

  const handleSaveNode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingNode) return;
    try {
      await navigationApi.saveLocation(editingNode);
      setToastMessage(`Updated navigation location ${editingNode.name}.`);
      setEditingNode(null);
      queryClient.invalidateQueries({ queryKey: ["navigation-nodes"] });
    } catch (err: any) {
      alert(err.message || "Failed to update node.");
    }
  };

  const handleCreateNode = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await navigationApi.saveLocation({
        hospitalId: "hosp-001",
        name: newNodeName,
        type: newNodeType,
        building: "Main Hospital Tower",
        block: "Wing A",
        floor: selectedFloor,
        room: newNodeRoom,
        directions: newNodeDirections || "Follow hallway signage",
      });
      setToastMessage(`Created navigation location ${newNodeName}.`);
      setShowAddModal(false);
      setNewNodeName("");
      setNewNodeRoom("");
      setNewNodeDirections("");
      queryClient.invalidateQueries({ queryKey: ["navigation-nodes"] });
    } catch (err: any) {
      alert(err.message || "Failed to create node.");
    }
  };

  return (
    <PageContainer
      title="Hospital Indoor Floorplan & Navigation Config"
      subtitle="Manage hospital digital waypoints, consultation rooms, elevators, and QR kiosk location beacons"
      actions={
        <button
          onClick={() => setShowAddModal(true)}
          className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs flex items-center gap-1.5 transition"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Waypoint Location</span>
        </button>
      }
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

        {/* Floor Switcher */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-700">Select Floor:</span>
            {["Ground Floor", "Floor 1", "Floor 2", "Floor 3"].map((floor) => (
              <button
                key={floor}
                onClick={() => setSelectedFloor(floor)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  selectedFloor === floor
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {floor}
              </button>
            ))}
          </div>

          <span className="text-xs text-slate-500">
            {filteredNodes.length} Locations configured on this level
          </span>
        </div>

        {/* Visual Hospital Floorplan Grid */}
        <div className="bg-slate-900 rounded-2xl p-6 text-white border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
            <div className="flex items-center gap-2">
              <Compass className="w-5 h-5 text-blue-400" />
              <div>
                <h3 className="text-sm font-bold">Interactive Floor Map Layout ({selectedFloor})</h3>
                <p className="text-xs text-slate-400">Main Outpatient Tower — Wing A & B</p>
              </div>
            </div>
            <span className="text-xs font-mono bg-slate-800 text-blue-300 px-2.5 py-1 rounded border border-slate-700">
              Indoor Waypoint Grid Active
            </span>
          </div>

          {/* Floorplan visual schematic canvas */}
          <div className="relative w-full h-80 bg-slate-950 rounded-xl border border-slate-800 p-4 flex flex-wrap gap-4 items-center justify-around overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:16px_16px] opacity-30" />

            {filteredNodes.map((node) => (
              <div
                key={node.id}
                onClick={() => setEditingNode(node)}
                className="relative z-10 p-3 bg-slate-800/90 border border-slate-700 hover:border-blue-400 rounded-xl cursor-pointer transition shadow-md group text-center min-w-36 hover:scale-105"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-600/30 text-blue-400 flex items-center justify-center mx-auto mb-2 border border-blue-500/30 group-hover:bg-blue-600 group-hover:text-white transition">
                  <MapPin className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-slate-100 truncate">{node.name}</h4>
                <span className="text-[10px] text-slate-400 block font-mono">
                  {node.room || node.type}
                </span>
                <span className="text-[9px] text-blue-300 uppercase font-bold mt-1 inline-block">
                  {node.type}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Nodes List Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-200">
            <h3 className="text-sm font-bold text-slate-900">Waypoint Locations Directory</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[11px]">
                  <th className="py-3 px-4">Location Name</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Building & Room</th>
                  <th className="py-3 px-4">Turn-by-Turn Directions</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredNodes.map((n) => (
                  <tr key={n.id} className="hover:bg-blue-50/40">
                    <td className="py-3 px-4 font-bold text-slate-900">{n.name}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold text-[10px]">
                        {n.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      {n.building} • {n.floor} ({n.room})
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-[11px]">
                      {n.directions}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setEditingNode(n)}
                        className="px-2.5 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-50 rounded"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {editingNode && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-3">Edit Navigation Location</h3>
            <form onSubmit={handleSaveNode} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Location Title</label>
                <input
                  type="text"
                  value={editingNode.name}
                  onChange={(e) => setEditingNode({ ...editingNode, name: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Room / Suite</label>
                  <input
                    type="text"
                    value={editingNode.room || ""}
                    onChange={(e) => setEditingNode({ ...editingNode, room: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Floor Level</label>
                  <input
                    type="text"
                    value={editingNode.floor}
                    onChange={(e) => setEditingNode({ ...editingNode, floor: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Directions</label>
                <input
                  type="text"
                  value={editingNode.directions}
                  onChange={(e) => setEditingNode({ ...editingNode, directions: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingNode(null)}
                  className="px-3 py-1.5 text-slate-700 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold"
                >
                  Save Location
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-3">Add New Navigation Location</h3>
            <form onSubmit={handleCreateNode} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Location Title</label>
                <input
                  type="text"
                  required
                  value={newNodeName}
                  onChange={(e) => setNewNodeName(e.target.value)}
                  placeholder="e.g. Suite 204 - Cardiology"
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Type</label>
                  <select
                    value={newNodeType}
                    onChange={(e) => setNewNodeType(e.target.value as any)}
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  >
                    <option value="CONSULTATION_ROOM">Consultation Room</option>
                    <option value="COUNTER">Counter / Reception</option>
                    <option value="RADIOLOGY">Radiology / Imaging</option>
                    <option value="LABORATORY">Laboratory</option>
                    <option value="PHARMACY">Pharmacy</option>
                    <option value="WAITING_AREA">Waiting Area</option>
                    <option value="EMERGENCY">Emergency Room</option>
                    <option value="HELP_DESK">Help Desk</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Room Code</label>
                  <input
                    type="text"
                    value={newNodeRoom}
                    onChange={(e) => setNewNodeRoom(e.target.value)}
                    placeholder="e.g. CARD-204"
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Directions</label>
                <input
                  type="text"
                  value={newNodeDirections}
                  onChange={(e) => setNewNodeDirections(e.target.value)}
                  placeholder="e.g. Take Elevator B to 2nd Floor, turn right"
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 text-slate-700 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold"
                >
                  Create Location
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageContainer>
  );
};
