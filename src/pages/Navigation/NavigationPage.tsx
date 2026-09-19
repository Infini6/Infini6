import React, { useState, useMemo } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { navigationService } from '../../services/navigationService';
import { apiService } from '../../services/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../query/queryKeys';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Modal, ConfirmDialog } from '../../components/ui/Modal';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { NavigationLocationRow, NavigationCategory } from '../../types/database.types';
import { NAVIGATION_CATEGORY_CONFIG } from '../../utils/constants';
import { useToast } from '../../hooks/useToast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { navigationFormSchema, NavigationFormValues } from '../../lib/validations/adminSchemas';
import { 
  Compass, 
  MapPin, 
  Building, 
  Plus, 
  Edit, 
  Trash2, 
  RefreshCw,
  Layers,
  Search,
  CheckCircle2,
  XCircle,
  ChevronRight,
  ChevronDown,
  FolderTree,
  Table as TableIcon,
  Power,
  ShieldCheck,
  Stethoscope,
  Microscope,
  Pill,
  Radio,
  FileSpreadsheet
} from 'lucide-react';

type ViewMode = 'HIERARCHY' | 'TABLE' | 'MAP';

export const NavigationPage: React.FC = () => {
  const { user } = useAuth();
  const hospitalId = user?.hospital?.id || '';
  const isAdmin = user?.profile?.role === 'HOSPITAL_ADMIN';
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useToast();

  const [viewMode, setViewMode] = useState<ViewMode>('HIERARCHY');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  // Hierarchy expanded nodes state
  const [expandedBuildings, setExpandedBuildings] = useState<Record<string, boolean>>({});
  const [expandedBlocks, setExpandedBlocks] = useState<Record<string, boolean>>({});
  const [expandedFloors, setExpandedFloors] = useState<Record<string, boolean>>({});

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingNode, setEditingNode] = useState<NavigationLocationRow | null>(null);
  const [deletingNode, setDeletingNode] = useState<NavigationLocationRow | null>(null);

  // 1. Fetch Locations
  const { data: locations = [], isLoading, refetch, isFetching } = useQuery({
    queryKey: queryKeys.navigation.all(hospitalId),
    queryFn: () => navigationService.getLocations(hospitalId),
    enabled: Boolean(hospitalId),
  });

  // 2. Fetch Departments for linkage
  const { data: departments = [] } = useQuery({
    queryKey: queryKeys.departments.all(hospitalId),
    queryFn: () => apiService.getDepartments(hospitalId),
    enabled: Boolean(hospitalId),
  });

  const form = useForm<NavigationFormValues>({
    resolver: zodResolver(navigationFormSchema),
    defaultValues: {
      name: '',
      building: 'Main Hospital Building',
      block: 'Block A',
      floor: 'Floor 1',
      room: '',
      counter: '',
      category: 'CONSULTATION',
      status: 'ACTIVE',
      coord_x: 100,
      coord_y: 100,
    },
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.navigation.all(hospitalId) });
  };

  // --------------------------------------------------------------------------
  // MUTATIONS
  // --------------------------------------------------------------------------
  const createMutation = useMutation({
    mutationFn: (values: NavigationFormValues) =>
      navigationService.createLocation(
        {
          hospital_id: hospitalId,
          building: values.building,
          block: values.block,
          floor: values.floor,
          room: values.room,
          name: values.name || values.room,
          counter: values.counter || null,
          category: values.category as NavigationCategory,
          status: values.status || 'ACTIVE',
          department_id: values.department_id || null,
          coordinates: { x: values.coord_x, y: values.coord_y },
        },
        user?.id
      ),
    onSuccess: (newLoc) => {
      invalidate();
      setIsAddModalOpen(false);
      form.reset();
      showSuccess('Navigation Node Added', `${newLoc.name || newLoc.room} (${newLoc.block}) mapped in hospital graph.`);
    },
    onError: (err: any) => {
      showError('Error', err?.message || 'Failed to add navigation location.');
    },
  });

  const editMutation = useMutation({
    mutationFn: ({ id, values }: { id: string; values: NavigationFormValues }) =>
      navigationService.updateLocation(
        id,
        {
          building: values.building,
          block: values.block,
          floor: values.floor,
          room: values.room,
          name: values.name || values.room,
          counter: values.counter || null,
          category: values.category as NavigationCategory,
          status: values.status,
          department_id: values.department_id || null,
          coordinates: { x: values.coord_x, y: values.coord_y },
        },
        user?.id
      ),
    onSuccess: (updated) => {
      invalidate();
      setEditingNode(null);
      showSuccess('Navigation Node Updated', `${updated.name || updated.room} saved.`);
    },
    onError: (err: any) => {
      showError('Error', err?.message || 'Failed to update location.');
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'ACTIVE' | 'INACTIVE' }) =>
      navigationService.toggleLocationStatus(id, status, user?.id),
    onSuccess: (updated) => {
      invalidate();
      showSuccess('Status Toggled', `${updated.name || updated.room} is now ${updated.status}.`);
    },
    onError: (err: any) => {
      showError('Error', err?.message || 'Failed to toggle location status.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => navigationService.deleteLocation(id, user?.id),
    onSuccess: () => {
      invalidate();
      setDeletingNode(null);
      showSuccess('Node Removed', 'Navigation location deleted from wayfinding graph.');
    },
    onError: (err: any) => {
      showError('Error', err?.message || 'Failed to delete location.');
    },
  });

  const handleOpenEdit = (loc: NavigationLocationRow) => {
    setEditingNode(loc);
    form.reset({
      name: loc.name || loc.room,
      building: loc.building,
      block: loc.block,
      floor: loc.floor,
      room: loc.room,
      counter: loc.counter || '',
      category: loc.category || 'CONSULTATION',
      department_id: loc.department_id || '',
      status: loc.status || 'ACTIVE',
      coord_x: loc.coordinates?.x || 100,
      coord_y: loc.coordinates?.y || 100,
    });
  };

  // --------------------------------------------------------------------------
  // FILTERING & SEARCH
  // --------------------------------------------------------------------------
  const filteredLocations = useMemo(() => {
    return locations.filter((loc) => {
      if (selectedCategory !== 'ALL' && loc.category !== selectedCategory) return false;
      if (statusFilter !== 'ALL' && loc.status !== statusFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = (loc.name || '').toLowerCase().includes(q);
        const matchesRoom = (loc.room || '').toLowerCase().includes(q);
        const matchesBuilding = (loc.building || '').toLowerCase().includes(q);
        const matchesBlock = (loc.block || '').toLowerCase().includes(q);
        const matchesFloor = (loc.floor || '').toLowerCase().includes(q);
        const matchesCounter = (loc.counter || '').toLowerCase().includes(q);
        const matchesCat = (loc.category || '').toLowerCase().includes(q);
        return (
          matchesName ||
          matchesRoom ||
          matchesBuilding ||
          matchesBlock ||
          matchesFloor ||
          matchesCounter ||
          matchesCat
        );
      }
      return true;
    });
  }, [locations, selectedCategory, statusFilter, searchQuery]);

  // --------------------------------------------------------------------------
  // HIERARCHICAL TREE STRUCTURING
  // Building -> Block -> Floor -> Rooms/Stations
  // --------------------------------------------------------------------------
  const hierarchyTree = useMemo(() => {
    const tree: Record<string, Record<string, Record<string, NavigationLocationRow[]>>> = {};

    for (const loc of filteredLocations) {
      const bldg = loc.building || 'Main Hospital Building';
      const blk = loc.block || 'Block A';
      const flr = loc.floor || 'Floor 1';

      if (!tree[bldg]) tree[bldg] = {};
      if (!tree[bldg][blk]) tree[bldg][blk] = {};
      if (!tree[bldg][blk][flr]) tree[bldg][blk][flr] = [];

      tree[bldg][blk][flr].push(loc);
    }

    return tree;
  }, [filteredLocations]);

  // Auto-expand tree root nodes on first load
  React.useEffect(() => {
    if (locations.length > 0) {
      const bldgs: Record<string, boolean> = {};
      const blks: Record<string, boolean> = {};
      const flrs: Record<string, boolean> = {};

      locations.forEach((l) => {
        bldgs[l.building] = true;
        blks[`${l.building}-${l.block}`] = true;
        flrs[`${l.building}-${l.block}-${l.floor}`] = true;
      });

      setExpandedBuildings((prev) => (Object.keys(prev).length === 0 ? bldgs : prev));
      setExpandedBlocks((prev) => (Object.keys(prev).length === 0 ? blks : prev));
      setExpandedFloors((prev) => (Object.keys(prev).length === 0 ? flrs : prev));
    }
  }, [locations]);

  const toggleBuilding = (b: string) => setExpandedBuildings((p) => ({ ...p, [b]: !p[b] }));
  const toggleBlock = (key: string) => setExpandedBlocks((p) => ({ ...p, [key]: !p[key] }));
  const toggleFloor = (key: string) => setExpandedFloors((p) => ({ ...p, [key]: !p[key] }));

  // Station counts
  const totalNodes = locations.length;
  const activeNodesCount = locations.filter((l) => l.status !== 'INACTIVE').length;
  const inactiveNodesCount = totalNodes - activeNodesCount;

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Hospital Spatial Navigation & Wayfinding</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage hierarchical buildings, blocks, floors, clinical rooms, triage counters, radiology, lab, and pharmacy wayfinding.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => refetch()}
            disabled={isFetching}
            className="text-xs gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin text-blue-600' : ''}`} />
            Refresh
          </Button>

          {isAdmin && (
            <Button
              size="sm"
              onClick={() => {
                form.reset({
                  name: '',
                  building: 'Main Hospital Building',
                  block: 'Block A',
                  floor: 'Floor 1',
                  room: '',
                  counter: '',
                  category: 'CONSULTATION',
                  status: 'ACTIVE',
                  coord_x: 100,
                  coord_y: 100,
                });
                setIsAddModalOpen(true);
              }}
              className="text-xs gap-1.5 bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Navigation Node
            </Button>
          )}
        </div>
      </div>

      {/* Summary Metrics & View Mode Switcher */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
        <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-slate-500 font-medium">Total Wayfinding Nodes</span>
          <div className="text-lg font-bold text-slate-900 mt-0.5">{totalNodes} Stations</div>
        </div>
        <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-slate-500 font-medium">Active In Patient Wayfinding</span>
          <div className="text-lg font-bold text-emerald-600 mt-0.5">{activeNodesCount} Active</div>
        </div>
        <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-slate-500 font-medium">Deactivated / Maintenance</span>
          <div className="text-lg font-bold text-amber-600 mt-0.5">{inactiveNodesCount} Inactive</div>
        </div>
        <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <span className="text-slate-500 font-medium">Navigation View Mode</span>
          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg mt-1">
            <button
              onClick={() => setViewMode('HIERARCHY')}
              className={`flex-1 py-1 px-2 rounded-md font-bold text-[11px] transition-all flex items-center justify-center gap-1 ${
                viewMode === 'HIERARCHY'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FolderTree className="w-3 h-3" />
              Hierarchy
            </button>
            <button
              onClick={() => setViewMode('TABLE')}
              className={`flex-1 py-1 px-2 rounded-md font-bold text-[11px] transition-all flex items-center justify-center gap-1 ${
                viewMode === 'TABLE'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TableIcon className="w-3 h-3" />
              Directory
            </button>
            <button
              onClick={() => setViewMode('MAP')}
              className={`flex-1 py-1 px-2 rounded-md font-bold text-[11px] transition-all flex items-center justify-center gap-1 ${
                viewMode === 'MAP'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Compass className="w-3 h-3" />
              Digital Twin
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search building, block, floor, room, counter, pharmacy..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-2 text-xs">
          <span className="font-semibold text-slate-600">Category:</span>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="h-8 border border-slate-300 rounded-lg px-2.5 py-0 text-xs font-semibold bg-white text-slate-900"
          >
            <option value="ALL">All Categories</option>
            <option value="CONSULTATION">Consultation Rooms</option>
            <option value="RADIOLOGY">Radiology & Scans</option>
            <option value="LABORATORY">Diagnostic Laboratory</option>
            <option value="PHARMACY">Central Pharmacy</option>
            <option value="REGISTRATION">Registration & Triage</option>
            <option value="COUNTER">Counter Desks</option>
            <option value="ROOM">Clinical Rooms</option>
            <option value="DEPARTMENT">Department Zones</option>
            <option value="OTHER">Other Facilities</option>
          </select>
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2 text-xs">
          <span className="font-semibold text-slate-600">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="h-8 border border-slate-300 rounded-lg px-2.5 py-0 text-xs font-semibold bg-white text-slate-900"
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active Only</option>
            <option value="INACTIVE">Inactive / Disabled</option>
          </select>
        </div>
      </div>

      {/* ---------------------------------------------------------------------- */}
      {/* VIEW 1: HIERARCHICAL TREE VIEW                                         */}
      {/* Building -> Block -> Floor -> Room / Department                        */}
      {/* ---------------------------------------------------------------------- */}
      {viewMode === 'HIERARCHY' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Hospital Hierarchy Structure (Building &rarr; Block &rarr; Floor &rarr; Station)
            </span>
            <span className="text-xs text-slate-400 font-medium">
              Ready for Patient Portal Navigation Sync
            </span>
          </div>

          {isLoading ? (
            <div className="text-center py-20 text-slate-500 text-xs">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto text-blue-600 mb-2" />
              Loading hospital spatial hierarchy...
            </div>
          ) : Object.keys(hierarchyTree).length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400 bg-white rounded-xl border border-slate-200">
              No navigation nodes matched the current filter.
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(hierarchyTree).map(([building, blocks]) => {
                const isBldgOpen = expandedBuildings[building] !== false;
                const buildingNodeCount = Object.values(blocks).reduce(
                  (acc, floors) => acc + Object.values(floors).reduce((fAcc, r) => fAcc + r.length, 0),
                  0
                );

                return (
                  <div key={building} className="rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
                    {/* Level 1: Building Header */}
                    <div
                      onClick={() => toggleBuilding(building)}
                      className="p-3.5 bg-slate-900 text-white flex items-center justify-between cursor-pointer select-none"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="p-1.5 rounded-lg bg-white/10 text-white">
                          <Building className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-white flex items-center gap-2">
                            {building}
                          </h3>
                          <span className="text-[10px] text-slate-300 font-medium">
                            Facility Zone • {buildingNodeCount} Mapped Station{buildingNodeCount === 1 ? '' : 's'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono bg-white/10 px-2 py-0.5 rounded text-white font-semibold">
                          Building
                        </span>
                        {isBldgOpen ? <ChevronDown className="w-4 h-4 text-slate-300" /> : <ChevronRight className="w-4 h-4 text-slate-300" />}
                      </div>
                    </div>

                    {/* Level 2: Blocks */}
                    {isBldgOpen && (
                      <div className="p-4 space-y-4 bg-slate-50/50">
                        {Object.entries(blocks).map(([block, floors]) => {
                          const blockKey = `${building}-${block}`;
                          const isBlkOpen = expandedBlocks[blockKey] !== false;
                          const blockNodeCount = Object.values(floors).reduce((acc, r) => acc + r.length, 0);

                          return (
                            <div key={blockKey} className="rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
                              {/* Block Header */}
                              <div
                                onClick={() => toggleBlock(blockKey)}
                                className="px-4 py-2.5 bg-slate-100 border-b border-slate-200 flex items-center justify-between cursor-pointer select-none"
                              >
                                <div className="flex items-center gap-2">
                                  <span className="w-2 h-2 rounded-full bg-blue-600" />
                                  <h4 className="text-xs font-bold text-slate-800">
                                    {block}
                                  </h4>
                                  <span className="text-[10px] text-slate-500 font-medium">
                                    ({blockNodeCount} stations)
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                  <span className="text-[10px] uppercase font-bold text-slate-400">Block</span>
                                  {isBlkOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                                </div>
                              </div>

                              {/* Level 3: Floors */}
                              {isBlkOpen && (
                                <div className="p-3 space-y-3">
                                  {Object.entries(floors).map(([floor, nodes]) => {
                                    const floorKey = `${building}-${block}-${floor}`;
                                    const isFloorOpen = expandedFloors[floorKey] !== false;

                                    return (
                                      <div key={floorKey} className="rounded-lg border border-slate-100 bg-slate-50/40 p-3">
                                        <div
                                          onClick={() => toggleFloor(floorKey)}
                                          className="flex items-center justify-between cursor-pointer select-none pb-2 border-b border-slate-200/60"
                                        >
                                          <div className="flex items-center gap-2">
                                            <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold text-[10px]">
                                              {floor}
                                            </span>
                                            <span className="text-xs font-semibold text-slate-700">
                                              {nodes.length} destination point{nodes.length === 1 ? '' : 's'}
                                            </span>
                                          </div>
                                          {isFloorOpen ? <ChevronDown className="w-3 h-3 text-slate-400" /> : <ChevronRight className="w-3 h-3 text-slate-400" />}
                                        </div>

                                        {/* Level 4: Rooms, Departments, Counters */}
                                        {isFloorOpen && (
                                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-3">
                                            {nodes.map((loc) => {
                                              const catConf = NAVIGATION_CATEGORY_CONFIG[loc.category] || NAVIGATION_CATEGORY_CONFIG.OTHER;
                                              const isActive = loc.status !== 'INACTIVE';

                                              return (
                                                <div
                                                  key={loc.id}
                                                  className={`p-3 rounded-xl border transition-all ${
                                                    isActive
                                                      ? 'bg-white border-slate-200 hover:border-blue-300 shadow-2xs'
                                                      : 'bg-slate-100/60 border-slate-200 opacity-60'
                                                  }`}
                                                >
                                                  <div className="flex items-start justify-between gap-1.5">
                                                    <div>
                                                      <span className={`inline-flex items-center px-2 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider ${catConf.bg} ${catConf.text}`}>
                                                        {catConf.label}
                                                      </span>
                                                      <h5 className="text-xs font-bold text-slate-900 mt-1">
                                                        {loc.name || loc.room}
                                                      </h5>
                                                      <div className="text-[11px] text-slate-500 mt-0.5">
                                                        {loc.room} {loc.counter ? `• ${loc.counter}` : ''}
                                                      </div>
                                                    </div>

                                                    <button
                                                      onClick={() =>
                                                        toggleStatusMutation.mutate({
                                                          id: loc.id,
                                                          status: isActive ? 'INACTIVE' : 'ACTIVE',
                                                        })
                                                      }
                                                      className={`p-1 rounded-lg border transition-all ${
                                                        isActive
                                                          ? 'bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100'
                                                          : 'bg-slate-200 border-slate-300 text-slate-600 hover:bg-slate-300'
                                                      }`}
                                                      title={isActive ? 'Deactivate this node' : 'Activate this node'}
                                                    >
                                                      <Power className="w-3 h-3" />
                                                    </button>
                                                  </div>

                                                  <div className="flex items-center justify-between text-[10px] text-slate-500 pt-2 mt-2 border-t border-slate-100">
                                                    <span className="font-mono text-slate-400">
                                                      X: {loc.coordinates?.x}, Y: {loc.coordinates?.y}
                                                    </span>

                                                    {isAdmin && (
                                                      <div className="flex items-center gap-1">
                                                        <button
                                                          onClick={() => handleOpenEdit(loc)}
                                                          className="p-1 rounded hover:bg-slate-100 text-slate-500 hover:text-blue-600"
                                                          title="Edit node"
                                                        >
                                                          <Edit className="w-3 h-3" />
                                                        </button>
                                                        <button
                                                          onClick={() => setDeletingNode(loc)}
                                                          className="p-1 rounded hover:bg-rose-50 text-slate-400 hover:text-rose-600"
                                                          title="Delete node"
                                                        >
                                                          <Trash2 className="w-3 h-3" />
                                                        </button>
                                                      </div>
                                                    )}
                                                  </div>
                                                </div>
                                              );
                                            })}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* VIEW 2: FLAT DIRECTORY TABLE VIEW                                      */}
      {/* ---------------------------------------------------------------------- */}
      {viewMode === 'TABLE' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Building & Block</TableHead>
                <TableHead>Floor</TableHead>
                <TableHead>Room / Station Name</TableHead>
                <TableHead>Counter Designation</TableHead>
                <TableHead>Station Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-slate-500 text-xs">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto text-blue-600 mb-2" />
                    Loading wayfinding table...
                  </TableCell>
                </TableRow>
              ) : filteredLocations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-slate-400 text-xs">
                    No navigation nodes match filter.
                  </TableCell>
                </TableRow>
              ) : (
                filteredLocations.map((loc) => {
                  const catConf = NAVIGATION_CATEGORY_CONFIG[loc.category] || NAVIGATION_CATEGORY_CONFIG.OTHER;
                  const isActive = loc.status !== 'INACTIVE';

                  return (
                    <TableRow key={loc.id}>
                      <TableCell className="font-semibold text-xs text-slate-900">
                        <div className="flex items-center gap-2">
                          <Building className="w-3.5 h-3.5 text-slate-400" />
                          <span>{loc.building}</span>
                          <span className="text-slate-400">({loc.block})</span>
                        </div>
                      </TableCell>

                      <TableCell className="text-xs text-slate-700">
                        <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200">
                          {loc.floor}
                        </span>
                      </TableCell>

                      <TableCell className="font-bold text-xs text-slate-900">
                        <div>{loc.name || loc.room}</div>
                        {loc.name && <div className="text-[10px] text-slate-500 font-normal">{loc.room}</div>}
                      </TableCell>

                      <TableCell className="text-xs text-slate-600">
                        {loc.counter || 'General Entrance'}
                      </TableCell>

                      <TableCell>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${catConf.bg} ${catConf.text}`}>
                          {catConf.label}
                        </span>
                      </TableCell>

                      <TableCell>
                        <Badge variant={isActive ? 'success' : 'secondary'} className="text-[10px]">
                          {isActive ? 'ACTIVE' : 'INACTIVE'}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs h-7 px-2"
                            onClick={() =>
                              toggleStatusMutation.mutate({
                                id: loc.id,
                                status: isActive ? 'INACTIVE' : 'ACTIVE',
                              })
                            }
                            title={isActive ? 'Deactivate node' : 'Activate node'}
                          >
                            <Power className={`w-3 h-3 mr-1 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                            {isActive ? 'Disable' : 'Enable'}
                          </Button>

                          {isAdmin && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-xs h-7 px-2"
                                onClick={() => handleOpenEdit(loc)}
                              >
                                <Edit className="w-3 h-3 mr-1 text-slate-500" /> Edit
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-xs h-7 px-2 text-rose-600 hover:bg-rose-50"
                                onClick={() => setDeletingNode(loc)}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* VIEW 3: DIGITAL TWIN SPATIAL GRID MAP                                 */}
      {/* ---------------------------------------------------------------------- */}
      {viewMode === 'MAP' && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Compass className="w-4 h-4 text-blue-600" />
              Hospital Wayfinding Digital Twin Spatial Map
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="w-full h-80 bg-slate-950 rounded-xl relative p-4 border border-slate-800 overflow-hidden flex items-center justify-center">
              <div className="absolute inset-0 opacity-15 bg-[linear-gradient(to_right,#334155_1px,transparent_1px),linear-gradient(to_bottom,#334155_1px,transparent_1px)] bg-[size:24px_24px]" />

              <div className="absolute top-3 left-4 text-[10px] text-blue-400 font-mono tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                HOSPITAL GEO-MAP • {filteredLocations.length} ACTIVE STATIONS MAPPED • PATIENT PORTAL WAYFINDING FEED
              </div>

              {filteredLocations.map((loc) => {
                const xPercent = Math.min(Math.max((loc.coordinates?.x || 100) / 5, 8), 88);
                const yPercent = Math.min(Math.max((loc.coordinates?.y || 100) / 4, 15), 80);
                const catConf = NAVIGATION_CATEGORY_CONFIG[loc.category] || NAVIGATION_CATEGORY_CONFIG.OTHER;
                const isActive = loc.status !== 'INACTIVE';

                return (
                  <div
                    key={loc.id}
                    style={{ left: `${xPercent}%`, top: `${yPercent}%` }}
                    className={`absolute transform -translate-x-1/2 -translate-y-1/2 group cursor-pointer ${
                      !isActive ? 'opacity-40' : ''
                    }`}
                    onClick={() => handleOpenEdit(loc)}
                  >
                    <div className="w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow-md flex items-center justify-center group-hover:scale-125 transition-transform">
                      <span className="w-1.5 h-1.5 rounded-full bg-white" />
                    </div>
                    <div className="absolute bottom-5 left-1/2 transform -translate-x-1/2 hidden group-hover:block bg-white text-slate-900 px-3 py-1.5 rounded-lg shadow-xl text-[10px] whitespace-nowrap font-bold z-20 border border-slate-200">
                      <div className="font-extrabold text-slate-950">{loc.name || loc.room}</div>
                      <div className="text-slate-500 font-normal">{loc.building} • {loc.block} ({loc.floor})</div>
                      <div className="text-blue-600 font-semibold">{catConf.label}</div>
                    </div>
                  </div>
                );
              })}

              <div className="text-center text-slate-500 text-xs z-10 select-none pointer-events-none">
                Hover over stations to inspect coordinates • Click node to edit
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* ADD NODE MODAL                                                         */}
      {/* ---------------------------------------------------------------------- */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Hospital Wayfinding Node"
        description="Register a building station, room, counter, or clinical department into the patient wayfinding system."
      >
        <form
          onSubmit={form.handleSubmit((values) => createMutation.mutate(values))}
          className="space-y-3.5 text-xs"
        >
          <Input
            label="Station Descriptive Label"
            placeholder="e.g. Ultrasound Scan Suite 2 / Phlebotomy Bay"
            {...form.register('name')}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Building Name"
              placeholder="e.g. Women & Child Health Wing"
              {...form.register('building')}
              error={form.formState.errors.building?.message}
            />
            <Input
              label="Block Designation"
              placeholder="e.g. Block B"
              {...form.register('block')}
              error={form.formState.errors.block?.message}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Floor Level"
              placeholder="e.g. Floor 2"
              {...form.register('floor')}
              error={form.formState.errors.floor?.message}
            />
            <Input
              label="Room Number / Zone"
              placeholder="e.g. Room 204"
              {...form.register('room')}
              error={form.formState.errors.room?.message}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Counter Designation (Optional)"
              placeholder="e.g. Counter C-4"
              {...form.register('counter')}
            />
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Station Category
              </label>
              <select
                {...form.register('category')}
                className="w-full text-xs rounded-lg border border-slate-300 bg-white p-2 text-slate-900"
              >
                <option value="CONSULTATION">Consultation Room</option>
                <option value="RADIOLOGY">Radiology / Ultrasound / MRI</option>
                <option value="LABORATORY">Diagnostic Laboratory</option>
                <option value="PHARMACY">Central Pharmacy</option>
                <option value="REGISTRATION">Registration & Triage</option>
                <option value="COUNTER">Counter Desk</option>
                <option value="ROOM">Clinical Room</option>
                <option value="DEPARTMENT">Department Zone</option>
                <option value="OTHER">General Facility</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Link Clinical Department (Optional)
            </label>
            <select
              {...form.register('department_id')}
              className="w-full text-xs rounded-lg border border-slate-300 bg-white p-2 text-slate-900"
            >
              <option value="">No Department Link (General Area)</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} (Floor {d.floor})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
            <Input
              label="Spatial Coordinate X (0-500)"
              type="number"
              {...form.register('coord_x')}
              error={form.formState.errors.coord_x?.message}
            />
            <Input
              label="Spatial Coordinate Y (0-500)"
              type="number"
              {...form.register('coord_y')}
              error={form.formState.errors.coord_y?.message}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" isLoading={createMutation.isPending}>
              Create Node
            </Button>
          </div>
        </form>
      </Modal>

      {/* ---------------------------------------------------------------------- */}
      {/* EDIT NODE MODAL                                                        */}
      {/* ---------------------------------------------------------------------- */}
      {editingNode && (
        <Modal
          isOpen={Boolean(editingNode)}
          onClose={() => setEditingNode(null)}
          title={`Edit Wayfinding Node — ${editingNode.name || editingNode.room}`}
          description="Update coordinates, room names, and station classifications."
        >
          <form
            onSubmit={form.handleSubmit((values) =>
              editMutation.mutate({ id: editingNode.id, values })
            )}
            className="space-y-3.5 text-xs"
          >
            <Input
              label="Station Descriptive Label"
              {...form.register('name')}
            />

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Building Name"
                {...form.register('building')}
                error={form.formState.errors.building?.message}
              />
              <Input
                label="Block Designation"
                {...form.register('block')}
                error={form.formState.errors.block?.message}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Floor Level"
                {...form.register('floor')}
                error={form.formState.errors.floor?.message}
              />
              <Input
                label="Room Number"
                {...form.register('room')}
                error={form.formState.errors.room?.message}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Counter Designation"
                {...form.register('counter')}
              />
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Category
                </label>
                <select
                  {...form.register('category')}
                  className="w-full text-xs rounded-lg border border-slate-300 bg-white p-2 text-slate-900"
                >
                  <option value="CONSULTATION">Consultation Room</option>
                  <option value="RADIOLOGY">Radiology / Ultrasound / MRI</option>
                  <option value="LABORATORY">Diagnostic Laboratory</option>
                  <option value="PHARMACY">Central Pharmacy</option>
                  <option value="REGISTRATION">Registration & Triage</option>
                  <option value="COUNTER">Counter Desk</option>
                  <option value="ROOM">Clinical Room</option>
                  <option value="DEPARTMENT">Department Zone</option>
                  <option value="OTHER">General Facility</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Clinical Department
              </label>
              <select
                {...form.register('department_id')}
                className="w-full text-xs rounded-lg border border-slate-300 bg-white p-2 text-slate-900"
              >
                <option value="">No Department Link</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
              <Input
                label="Spatial Coordinate X"
                type="number"
                {...form.register('coord_x')}
              />
              <Input
                label="Spatial Coordinate Y"
                type="number"
                {...form.register('coord_y')}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
              <Button type="button" variant="outline" size="sm" onClick={() => setEditingNode(null)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" isLoading={editMutation.isPending}>
                Save Changes
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* DELETE CONFIRMATION */}
      {deletingNode && (
        <ConfirmDialog
          isOpen={Boolean(deletingNode)}
          onClose={() => setDeletingNode(null)}
          onConfirm={() => deleteMutation.mutate(deletingNode.id)}
          title="Delete Navigation Location?"
          message={`Are you sure you want to remove ${deletingNode.name || deletingNode.room} (${deletingNode.block}) from the hospital wayfinding graph?`}
          confirmLabel="Delete Location"
          confirmVariant="destructive"
          isLoading={deleteMutation.isPending}
        />
      )}
    </div>
  );
};
