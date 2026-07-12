import React, { createContext, useContext, useState } from "react";
import { authApi } from "../api/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  });

  const login = async (username, password) => {
    const response = await authApi.login(username, password);
    const { access_token, user: userData } = response.data;
    localStorage.setItem("access_token", access_token);
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
    setUser(null);
  };

  const isAuthenticated = Boolean(user && localStorage.getItem("access_token"));
  const isAdmin = user?.role === "admin";
  const isManager = user?.role === "manager";
  const isEmployee = user?.role === "employee";

  return (
    <AuthContext.Provider
      value={{ user, login, logout, isAuthenticated, isAdmin, isManager, isEmployee }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}