import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import { apiService } from '../../services/api';
import { queryKeys } from '../../query/queryKeys';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { ArrowLeft, Building, MapPin, Activity, Stethoscope, RefreshCw } from 'lucide-react';

export const DepartmentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const hospitalId = user?.hospital?.id || '';

  const { data: dept, isLoading } = useQuery({
    queryKey: queryKeys.departments.detail(id || ''),
    queryFn: () => apiService.getDepartmentById(id || ''),
    enabled: Boolean(id),
  });

  const { data: services = [] } = useQuery({
    queryKey: queryKeys.services.all(hospitalId),
    queryFn: () => apiService.getServices(hospitalId),
    enabled: Boolean(hospitalId),
  });

  const { data: doctors = [] } = useQuery({
    queryKey: queryKeys.doctors.all(hospitalId),
    queryFn: () => apiService.getDoctors(hospitalId),
    enabled: Boolean(hospitalId),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!dept) {
    return (
      <div className="space-y-4">
        <Link to="/departments">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Departments
          </Button>
        </Link>
        <div className="p-8 bg-white rounded-xl border border-slate-200 text-center text-slate-500 text-xs">
          Department not found.
        </div>
      </div>
    );
  }

  const deptServices = services.filter((s) => s.department_id === dept.id);
  const deptDoctors = doctors.filter((d) => d.department_id === dept.id);

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center gap-3">
        <Link to="/departments">
          <Button variant="outline" size="sm" className="h-8 w-8 p-0">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900">{dept.name}</h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              {dept.status}
            </span>
          </div>
          <p className="text-xs text-slate-500">{dept.floor} • {dept.location}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Doctors in Department */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-emerald-600" />
              Specialist Physicians ({deptDoctors.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {deptDoctors.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No doctors currently assigned to this department.</p>
            ) : (
              deptDoctors.map((doc) => (
                <div key={doc.id} className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{doc.profile?.name}</h4>
                    <p className="text-[11px] text-slate-500">{doc.specialization}</p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700">
                    {doc.status}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Clinical Services Offered */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-600" />
              Clinical & Diagnostic Services ({deptServices.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {deptServices.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No services cataloged for this department yet.</p>
            ) : (
              deptServices.map((srv) => (
                <div key={srv.id} className="p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-900">{srv.name}</h4>
                    <span className="text-[10px] font-semibold text-blue-600 font-mono">
                      ~{srv.expected_duration} min
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">{srv.description}</p>
                  {srv.requirements && (
                    <p className="text-[10px] text-amber-700 font-medium">Req: {srv.requirements}</p>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
