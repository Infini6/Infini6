import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import { INITIAL_HOSPITALS } from "../services/mockDatabase";
import heroImage from "../assets/images/hospital_ward_hero_1787757928212.jpg";
import {
  Stethoscope,
  Lock,
  Mail,
  Building2,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

export const LoginPage: React.FC = () => {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [selectedHospital, setSelectedHospital] = useState("hosp-001");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname || "/dashboard";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password.trim()) {
      setError("Please enter your staff ID/Email and password.");
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      await login({
        identifier: identifier.trim(),
        password: password.trim(),
        hospitalId: selectedHospital,
      });
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err?.message || "Invalid credentials or unauthorized facility access.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* Left Column: Visual & Branding (Hidden on Mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-indigo-950 overflow-hidden">
        <div className="absolute inset-0 bg-indigo-900/40 mix-blend-multiply z-10" />
        <img
          src={heroImage}
          alt="Smart Hospital"
          className="absolute inset-0 w-full h-full object-cover opacity-85"
        />
        
        {/* Branding Overlay */}
        <div className="relative z-20 flex flex-col justify-between p-12 w-full text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
              <Stethoscope className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight">Smart Hospital</span>
              <span className="text-xs font-semibold text-indigo-300 block leading-none mt-0.5">Staff Command Center</span>
            </div>
          </div>

          <div className="max-w-md">
            <h1 className="text-4xl font-extrabold tracking-tight leading-tight mb-4">
              Real-time clinical operations starts here.
            </h1>
            <p className="text-sm text-indigo-200/90 leading-relaxed mb-6">
              Connect to your facility command, check scheduled appointments, manage live patient queues, and orchestrate wayfinding workflows securely.
            </p>
            <div className="flex items-center gap-2 text-xs text-indigo-300/80 font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>HIPAA Compliant & End-to-End Encrypted Session</span>
            </div>
          </div>

          <div className="text-xs text-indigo-400 font-medium">
            © {new Date().getFullYear()} Smart Hospital Systems. All rights reserved.
          </div>
        </div>
      </div>

      {/* Right Column: Clean Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="max-w-md w-full">
          {/* Mobile Logo Branding */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-base tracking-tight text-slate-900 leading-none">Smart Hospital</span>
              <span className="text-[11px] font-semibold text-slate-500 mt-1 block">Staff Command Center</span>
            </div>
          </div>

          {/* Form Header */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900">Hospital Staff Sign In</h2>
            <p className="text-xs text-slate-500 mt-1">Please enter your authorized credentials to access your workspace.</p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-rose-800 text-xs">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            {/* Hospital Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Hospital Facility
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                <select
                  value={selectedHospital}
                  onChange={(e) => setSelectedHospital(e.target.value)}
                  className="w-full pl-9 pr-3 py-3 text-xs border border-slate-200 rounded-xl bg-slate-50/80 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800 transition"
                >
                  {INITIAL_HOSPITALS.map((hosp) => (
                    <option key={hosp.id} value={hosp.id}>
                      {hosp.name} ({hosp.code})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Staff ID / Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Staff ID or Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="e.g. marcus.vance@cityhospital.org or ADM-9021"
                  className="w-full pl-9 pr-3 py-3 text-xs border border-slate-200 rounded-xl bg-slate-50/80 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 transition"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your secure password"
                  className="w-full pl-9 pr-10 py-3 text-xs border border-slate-200 rounded-xl bg-slate-50/80 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600 transition"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-xs tracking-wider shadow-md shadow-indigo-500/10 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <span>Authenticating Workspace...</span>
              ) : (
                <>
                  <span>SIGN IN TO PORTAL</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Recovery and Privacy note */}
          <div className="mt-8 text-center">
            <span className="text-[11px] text-slate-400 flex items-center justify-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
              <span>HIPAA Compliant System Session</span>
            </span>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95">
            <h3 className="text-base font-bold text-slate-900 mb-2 flex items-center gap-2">
              <Lock className="w-4 h-4 text-indigo-600" />
              <span>Staff Password Recovery</span>
            </h3>
            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              In accordance with hospital security protocols, staff credentials must be verified through the Central IT Security Desk.
            </p>
            <div className="p-3.5 bg-slate-50 rounded-2xl text-xs text-slate-700 space-y-1.5 mb-4 border border-slate-100">
              <p><strong>IT Helpdesk:</strong> ext. 4400 / helpdesk@cityhospital.org</p>
              <p><strong>Hospital Admin:</strong> Dr. Marcus Vance (ADM-9021)</p>
            </div>
            <button
              onClick={() => setShowForgotModal(false)}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition cursor-pointer"
            >
              Close Notice
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
