import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Sidebar from "./components/Sidebar";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Employees from "./pages/Employees";
import Attendance from "./pages/Attendance";
import AttendanceSummary from "./pages/AttendanceSummary";
import MyAttendance from "./pages/MyAttendance";

function AppLayout({ children }) {
  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content">{children}</main>
    </div>
  );
}

function LoginRoute() {
  const { isAuthenticated, isEmployee } = useAuth();
  if (isAuthenticated) {
    return <Navigate to={isEmployee ? "/my-attendance" : "/dashboard"} replace />;
  }
  return <Login />;
}

function Landing() {
  const { isEmployee } = useAuth();
  return <Navigate to={isEmployee ? "/my-attendance" : "/dashboard"} replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginRoute />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Dashboard />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/employees"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Employees />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/attendance"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Attendance />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/attendance/summary"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <AttendanceSummary />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-attendance"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <MyAttendance />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Landing />
              </ProtectedRoute>
            }
          />
          <Route
            path="*"
            element={
              <ProtectedRoute>
                <Landing />
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}