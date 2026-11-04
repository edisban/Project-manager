import { createContext } from "react";
import type { AuthUser, Credentials } from "@/api/types";

export interface AuthContextValue {
  user: AuthUser | null;
  /** True until the initial session check has finished. */
  isLoading: boolean;
  isAdmin: boolean;
  /** Set when the session ended on its own (expired / revoked) rather than by signing out. */
  sessionExpired: boolean;
  signIn: (credentials: Credentials) => Promise<AuthUser>;
  signUp: (credentials: Credentials) => Promise<AuthUser>;
  signOut: () => Promise<void>;
  /** Clears local session state after the account was deleted on the server. */
  endSession: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export const authKeys = { me: ["auth", "me"] as const };
