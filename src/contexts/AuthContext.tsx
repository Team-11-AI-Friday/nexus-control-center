import React, { createContext, useContext, useState, useCallback } from "react";
import type { AppUser } from "@/data/users";
import { authenticateUser, getRoleDashboardPath } from "@/data/users";
import type { UserRole } from "@/types/deviation";

interface AuthContextType {
  currentUser: AppUser | null;
  role: UserRole | null;
  loading: boolean;
  signIn: (email: string, password: string) => { success: boolean; error?: string; redirectPath?: string };
  signOut: () => void;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(() => {
    // Restore session from localStorage
    const stored = localStorage.getItem("deviq_user");
    return stored ? JSON.parse(stored) : null;
  });
  const [loading] = useState(false);

  const role = currentUser?.role ?? null;

  const signIn = useCallback((email: string, password: string): { success: boolean; error?: string; redirectPath?: string } => {
    const user = authenticateUser(email, password);
    if (!user) {
      return { success: false, error: "Invalid email or password. Please try again." };
    }
    setCurrentUser(user);
    localStorage.setItem("deviq_user", JSON.stringify(user));
    const redirectPath = getRoleDashboardPath(user.role);
    return { success: true, redirectPath };
  }, []);

  const signOut = useCallback(() => {
    setCurrentUser(null);
    localStorage.removeItem("deviq_user");
  }, []);

  const hasPermission = useCallback(
    (permission: string): boolean => {
      if (!currentUser) return false;
      if (currentUser.permissions.includes("*")) return true;
      return currentUser.permissions.includes(permission);
    },
    [currentUser]
  );

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        role,
        loading,
        signIn,
        signOut,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
