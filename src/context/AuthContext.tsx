import React, {
  createContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { User } from "../types";
import {
  login as apiLogin,
  logout as apiLogout,
  getCurrentUser,
  isTokenValid,
} from "../api/auth";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = () => {
      try {
        // Check if token is valid
        if (isTokenValid()) {
          const currentUser = getCurrentUser();
          if (currentUser) {
            setUser({
              ...currentUser,
              role: currentUser.role === "admin" ? "admin" : "user",
              createdAt:
                "createdAt" in currentUser &&
                typeof currentUser.createdAt === "string"
                  ? currentUser.createdAt
                  : "",
              updatedAt:
                "updatedAt" in currentUser &&
                typeof currentUser.updatedAt === "string"
                  ? currentUser.updatedAt
                  : "",
            });
          } else {
            setUser(null);
          }
        } else {
          // If token is invalid, log the user out
          apiLogout();
        }
      } catch (error) {
        console.error("Error initializing auth", error);
        // Clear any invalid auth data
        apiLogout();
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await apiLogin({ email, password });
      const responseUser = response.user as UserWithDates;
      setUser({
        ...responseUser,
        role: responseUser.role === "admin" ? "admin" : "user",
        createdAt: responseUser.createdAt ?? "",
        updatedAt: responseUser.updatedAt ?? "",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    apiLogout();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContext };

interface UserWithDates {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: "admin" | "user";
  tenantId: number;
  createdAt?: string;
  updatedAt?: string;
}
