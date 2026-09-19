import { ProfileRow, HospitalRow, UserRole } from './database.types';

export type { UserRole };

export interface AuthUser {
  id: string;
  email: string;
  profile: ProfileRow;
  hospital: HospitalRow;
}

export interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}
