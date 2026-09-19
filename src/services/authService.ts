import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { AuthUser, UserRole } from '../types/auth.types';
import { INITIAL_PROFILES, INITIAL_HOSPITALS } from './mockData';
import { apiService } from './api';

export const authService = {
  async getInitialSession(): Promise<AuthUser | null> {
    if (isSupabaseConfigured) {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const profile = await apiService.getProfileById(session.user.id);
        if (profile && profile.hospital_id) {
          const hospital = await apiService.getHospitalById(profile.hospital_id);
          if (hospital) {
            return {
              id: session.user.id,
              email: session.user.email || profile.email,
              profile,
              hospital,
            };
          }
        }
      }
    }

    // Default to initial demo admin user for immediate seamless testing
    const defaultProfile = INITIAL_PROFILES[0]; // Eleanor Vance (HOSPITAL_ADMIN)
    const defaultHospital = INITIAL_HOSPITALS[0]; // City General
    return {
      id: defaultProfile.id,
      email: defaultProfile.email,
      profile: defaultProfile,
      hospital: defaultHospital,
    };
  },

  async signInWithEmail(email: string, pass: string): Promise<AuthUser> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: pass,
      });
      if (error) throw error;
      if (!data.user) throw new Error('Authentication failed');

      const profile = await apiService.getProfileById(data.user.id);
      if (!profile || !profile.hospital_id) {
        throw new Error('User profile does not have an assigned hospital');
      }
      const hospital = await apiService.getHospitalById(profile.hospital_id);
      if (!hospital) {
        throw new Error('Assigned hospital not found');
      }

      return {
        id: data.user.id,
        email: data.user.email || profile.email,
        profile,
        hospital,
      };
    }

    // Demo/offline matching
    const profile = INITIAL_PROFILES.find((p) => p.email.toLowerCase() === email.toLowerCase());
    if (!profile) {
      throw new Error('Invalid email or password. (Demo emails: admin@citygeneral.health, priya.sharma@citygeneral.health, staff.marcus@citygeneral.health)');
    }
    const hospital = INITIAL_HOSPITALS.find((h) => h.id === profile.hospital_id) || INITIAL_HOSPITALS[0];

    return {
      id: profile.id,
      email: profile.email,
      profile,
      hospital,
    };
  },

  async signOut(): Promise<void> {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
  },

  switchDemoRole(role: UserRole): AuthUser {
    const profile = INITIAL_PROFILES.find((p) => p.role === role) || INITIAL_PROFILES[0];
    const hospital = INITIAL_HOSPITALS.find((h) => h.id === profile.hospital_id) || INITIAL_HOSPITALS[0];
    return {
      id: profile.id,
      email: profile.email,
      profile,
      hospital,
    };
  },
};
