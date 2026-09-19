import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Alert } from '../../components/ui/Alert';
import { Shield, UserCheck, Stethoscope, ArrowRight } from 'lucide-react';
import { UserRole } from '../../types/auth.types';

export const LoginPage: React.FC = () => {
  const { login, switchRole } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err?.message || 'Login failed. Please verify credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemoLogin = (role: UserRole) => {
    switchRole(role);
    navigate('/dashboard');
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-slate-900">Hospital Portal Sign In</h3>
        <p className="text-xs text-slate-500 mt-1">
          Authorized personnel access for OPD queues, doctor duty, and care pathways.
        </p>
      </div>

      {error && (
        <Alert variant="destructive" title="Authentication Error">
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Staff / Doctor Email"
          type="email"
          placeholder="doctor@hospital.org"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <Input
          label="Password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <Button type="submit" className="w-full" isLoading={isLoading}>
          Sign In to Portal
        </Button>
      </form>

      {/* 1-Click Quick Demo Switcher */}
      <div className="pt-4 border-t border-slate-200">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-3 text-center">
          Instant Role Preview (Testing & Demo)
        </div>

        <div className="grid grid-cols-1 gap-2">
          <button
            type="button"
            onClick={() => handleQuickDemoLogin('HOSPITAL_ADMIN')}
            className="flex items-center justify-between p-2.5 rounded-lg border border-purple-200 bg-purple-50/50 hover:bg-purple-100/60 text-purple-900 transition-colors text-left group"
          >
            <div className="flex items-center gap-2.5">
              <Shield className="w-4 h-4 text-purple-600" />
              <div>
                <div className="text-xs font-bold leading-none">Hospital Admin</div>
                <div className="text-[10px] text-purple-600">Eleanor Vance • City General</div>
              </div>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-purple-400 group-hover:translate-x-0.5 transition-transform" />
          </button>

          <button
            type="button"
            onClick={() => handleQuickDemoLogin('DOCTOR')}
            className="flex items-center justify-between p-2.5 rounded-lg border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100/60 text-emerald-900 transition-colors text-left group"
          >
            <div className="flex items-center gap-2.5">
              <Stethoscope className="w-4 h-4 text-emerald-600" />
              <div>
                <div className="text-xs font-bold leading-none">Doctor (OB/GYN)</div>
                <div className="text-[10px] text-emerald-600">Dr. Priya Sharma • City General</div>
              </div>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-emerald-400 group-hover:translate-x-0.5 transition-transform" />
          </button>

          <button
            type="button"
            onClick={() => handleQuickDemoLogin('HOSPITAL_STAFF')}
            className="flex items-center justify-between p-2.5 rounded-lg border border-blue-200 bg-blue-50/50 hover:bg-blue-100/60 text-blue-900 transition-colors text-left group"
          >
            <div className="flex items-center gap-2.5">
              <UserCheck className="w-4 h-4 text-blue-600" />
              <div>
                <div className="text-xs font-bold leading-none">Hospital Staff</div>
                <div className="text-[10px] text-blue-600">Marcus Chen • Triage & Registration</div>
              </div>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-blue-400 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
};
