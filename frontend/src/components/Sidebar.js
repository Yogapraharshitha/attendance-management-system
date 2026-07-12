import React from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const adminManagerLinks = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/employees", label: "Employees" },
  { to: "/attendance", label: "Attendance" },
  { to: "/attendance/summary", label: "Reports" },
];

const employeeLinks = [{ to: "/my-attendance", label: "My Attendance" }];

export default function Sidebar() {
  const { user, logout, isEmployee } = useAuth();
  const links = isEmployee ? employeeLinks : adminManagerLinks;

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        Twite<span>Attendance</span>
      </div>
      <nav className="sidebar-nav">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) => `sidebar-link${isActive ? " active" : ""}`}
          >
            {link.label}
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-footer">
        <div className="sidebar-user">
          Signed in as {user?.username || "admin"} ({user?.role || "admin"})
        </div>
        <button className="logout-btn" onClick={logout}>
          Log out
        </button>
      </div>
    </aside>
  );
}