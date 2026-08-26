import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import { MOCK_STAFF_USERS } from "../auth/mockStaff";
import { INITIAL_HOSPITALS } from "../services/mockDatabase";
import heroImage from "../assets/images/hospital_ward_hero_1787757928212.jpg";
import {
  Stethoscope,
  Lock,
  Mail,
  Eye,
  EyeOff,
  Building2,
  ShieldCheck,
  AlertCircle,
  ArrowRight,
  UserCheck,
  Clock,
  MapPin,
  ChevronRight,
  Compass,
  Activity,
  HelpCircle,
  X,
  User,
} from "lucide-react";
import { RoleBadge } from "../components/common/RoleBadge";

export const LoginPage: React.FC = () => {
  const [identifier, setIdentifier] = useState("marcus.vance@cityhospital.org");
  const [password, setPassword] = useState("HospitalAdmin@2026");
  const [showPassword, setShowPassword] = useState(false);
  const [selectedHospital, setSelectedHospital] = useState("hosp-001");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSignInModal, setShowSignInModal] = useState(false);
  const [showFaqModal, setShowFaqModal] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname || "/dashboard";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password.trim()) {
      setError("Please enter your staff email and secure password.");
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
      setShowSignInModal(false);
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err?.message || "Invalid credentials or unauthorized facility access.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickDemoSelect = async (staff: (typeof MOCK_STAFF_USERS)[0]) => {
    setIdentifier(staff.email);
    setPassword("StaffSecurePass#2026");
    setSelectedHospital(staff.hospitalId);
    setError(null);
    setIsSubmitting(true);
    try {
      await login({
        identifier: staff.email,
        password: "StaffSecurePass#2026",
        hospitalId: staff.hospitalId,
      });
      setShowSignInModal(false);
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err?.message || "Failed to sign in with demo profile.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* Top Navigation Bar */}
      <header className="border-b border-slate-100 bg-white/95 sticky top-0 z-30 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 py-4 flex items-center justify-between">
          {/* Logo & Subtitle */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <div className="font-extrabold text-base tracking-tight text-slate-900 leading-none">
                Smart Hospital
              </div>
              <div className="text-[11px] font-medium text-slate-400 mt-1">
                Queue & Navigation System
              </div>
            </div>
          </div>

          {/* Right Navigation Actions */}
          <div className="flex items-center gap-4 sm:gap-6">
            <button
              onClick={() => setShowFaqModal(true)}
              className="text-xs font-semibold text-slate-600 hover:text-blue-600 transition flex items-center gap-1.5 cursor-pointer"
            >
              <HelpCircle className="w-4 h-4 text-slate-400" />
              <span>Visit FAQs</span>
            </button>

            <button
              onClick={() => setShowSignInModal(true)}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold shadow-xs hover:shadow-md transition-all cursor-pointer"
            >
              Sign In
            </button>
          </div>
        </div>
      </header>

      {/* Main Hero Section */}
      <main className="flex-1 max-w-7xl mx-auto px-6 sm:px-8 py-12 lg:py-20 w-full flex flex-col justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-14 items-center">
          {/* Left Column: Hero Text & Actions */}
          <div className="lg:col-span-6 space-y-6">
            {/* Pill Tag */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50/90 border border-blue-100 text-blue-600 text-xs font-semibold">
              <MapPin className="w-3.5 h-3.5 text-blue-600" />
              <span>Seamless Patient Journey</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.1]">
              Skip the wait. <span className="text-blue-600">Know your turn.</span>
            </h1>

            {/* Description */}
            <p className="text-base text-slate-600 leading-relaxed max-w-lg">
              Book appointments, track your live queue position, follow a guided journey through the hospital, and get notified every step of the way. All in one place.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => setShowSignInModal(true)}
                className="px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-bold shadow-md shadow-blue-500/20 hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer"
              >
                <span>Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => setShowSignInModal(true)}
                className="px-6 py-3.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200/80 text-slate-700 text-sm font-bold shadow-xs hover:border-slate-300 transition-all flex items-center gap-2 cursor-pointer"
              >
                <UserCheck className="w-4 h-4 text-slate-400" />
                <span>Demo Staff Access</span>
              </button>
            </div>

            {/* Subtext link */}
            <div className="pt-2">
              <p className="text-xs text-slate-500">
                Hospital staff?{" "}
                <button
                  onClick={() => setShowSignInModal(true)}
                  className="font-semibold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
                >
                  Sign in to staff portal
                </button>
              </p>
            </div>
          </div>

          {/* Right Column: Hero Image with Floating Wait Badge */}
          <div className="lg:col-span-6 relative">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-slate-200/80 border border-slate-100 bg-slate-50 aspect-4/3">
              <img
                src={heroImage}
                alt="Modern Smart Hospital Clinical Ward"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />

              {/* Floating "Avg. wait time" badge (as in reference image) */}
              <div className="absolute bottom-5 left-5 bg-white/95 backdrop-blur-md rounded-2xl p-3.5 px-4 shadow-xl border border-slate-100 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 font-medium block">
                    Avg. wait time
                  </span>
                  <span className="text-sm font-bold text-slate-900 leading-tight">
                    12 min
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* "Everything for a smoother hospital visit" Section */}
        <div className="mt-20 pt-16 border-t border-slate-100">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Everything for a smoother hospital visit
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-2">
              Synchronized clinical tools designed for frictionless patient flow and transparent waiting rooms.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-slate-50/60 border border-slate-100 hover:border-blue-200 hover:bg-white transition-all shadow-xs group">
              <div className="w-11 h-11 rounded-xl bg-blue-100/60 text-blue-600 flex items-center justify-center mb-4 group-hover:bg-blue-600 group-hover:text-white transition">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1.5">
                Real-Time Queue Tracking
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Live tokens with precise queue position estimations and sound notifications when it is your turn.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50/60 border border-slate-100 hover:border-blue-200 hover:bg-white transition-all shadow-xs group">
              <div className="w-11 h-11 rounded-xl bg-indigo-100/60 text-indigo-600 flex items-center justify-center mb-4 group-hover:bg-indigo-600 group-hover:text-white transition">
                <Compass className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1.5">
                Indoor Wayfinding Navigation
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Step-by-step visual routing across hospital wings, elevator connections, and consultation rooms.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50/60 border border-slate-100 hover:border-blue-200 hover:bg-white transition-all shadow-xs group">
              <div className="w-11 h-11 rounded-xl bg-emerald-100/60 text-emerald-600 flex items-center justify-center mb-4 group-hover:bg-emerald-600 group-hover:text-white transition">
                <Activity className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1.5">
                Doctor Presence & Absence Engine
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Instant doctor availability tracking and automated reassignment workflows to prevent schedule delays.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Clean Minimal Footer */}
      <footer className="border-t border-slate-100 bg-white py-6 px-6 sm:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <span>Smart Hospital Queue & Wayfinding System • HIPAA Compliant</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>City General Hospital</span>
            <span>•</span>
            <span>Memorial Health Center</span>
            <span>•</span>
            <span>Metro Cardiology Clinic</span>
          </div>
        </div>
      </footer>

      {/* Staff Sign-In Modal */}
      {showSignInModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100 relative animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm">
                  <Stethoscope className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Hospital Staff Sign In</h3>
                  <p className="text-xs text-slate-500">Clinical & Operations Portal</p>
                </div>
              </div>
              <button
                onClick={() => setShowSignInModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-rose-800 text-xs">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Hospital Facility
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <select
                    value={selectedHospital}
                    onChange={(e) => setSelectedHospital(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 text-xs border border-slate-200 rounded-xl bg-slate-50/80 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium text-slate-800 transition"
                  >
                    {INITIAL_HOSPITALS.map((hosp) => (
                      <option key={hosp.id} value={hosp.id}>
                        {hosp.name} ({hosp.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Staff Email or ID
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="e.g. marcus.vance@cityhospital.org"
                    className="w-full pl-9 pr-3 py-2.5 text-xs border border-slate-200 rounded-xl bg-slate-50/80 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-900 transition"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(true)}
                    className="text-[11px] font-semibold text-blue-600 hover:text-blue-700"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-9 pr-10 py-2.5 text-xs border border-slate-200 rounded-xl bg-slate-50/80 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-900 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs tracking-wider shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>Authenticating...</span>
                ) : (
                  <>
                    <span>SIGN IN TO PORTAL</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Quick Demo Profiles */}
            <div className="mt-5 pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <UserCheck className="w-3 h-3 text-blue-600" />
                  <span>Instant 1-Click Demo Profiles</span>
                </span>
              </div>
              <div className="grid grid-cols-1 gap-1.5 max-h-44 overflow-y-auto pr-1">
                {MOCK_STAFF_USERS.map((staff) => (
                  <button
                    key={staff.id}
                    type="button"
                    onClick={() => handleQuickDemoSelect(staff)}
                    className="flex items-center justify-between p-2 rounded-xl border border-slate-100 hover:border-blue-300 hover:bg-blue-50/40 transition text-left group cursor-pointer"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-[10px] shrink-0 border border-slate-200">
                        {staff.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800 group-hover:text-blue-700 truncate">
                          {staff.name}
                        </p>
                        <p className="text-[10px] text-slate-400 truncate">
                          {staff.departmentName || staff.staffId}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <RoleBadge role={staff.role} />
                      <ChevronRight className="w-3 h-3 text-slate-300 group-hover:text-blue-600 transition" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FAQs Modal */}
      {showFaqModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-blue-600" />
                <span>Frequently Asked Questions</span>
              </h3>
              <button
                onClick={() => setShowFaqModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs text-slate-600 mb-6 max-h-80 overflow-y-auto pr-1">
              <div>
                <h4 className="font-bold text-slate-800 mb-1">How does live token sequencing work?</h4>
                <p>Tokens are calculated using machine learning based on current clinical consultation lengths, emergency intake, and active counter service rates.</p>
              </div>
              <div>
                <h4 className="font-bold text-slate-800 mb-1">Can I navigate across different hospital floors?</h4>
                <p>Yes, the smart indoor wayfinding system calculates optimal pathways including elevator routes, wheelchair-accessible ramps, and department checkpoints.</p>
              </div>
              <div>
                <h4 className="font-bold text-slate-800 mb-1">What happens if my assigned doctor is absent?</h4>
                <p>The system automatically triggers an absence notification and recommends alternative specialists in the same department without losing your queue priority.</p>
              </div>
            </div>

            <button
              onClick={() => setShowFaqModal(false)}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              Close FAQs
            </button>
          </div>
        </div>
      )}

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95">
            <h3 className="text-base font-bold text-slate-900 mb-2 flex items-center gap-2">
              <Lock className="w-4 h-4 text-blue-600" />
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
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition cursor-pointer"
            >
              Close Notice
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
