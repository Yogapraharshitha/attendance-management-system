import React, { useEffect, useState } from "react";
import { dashboardApi } from "../api/api";

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    dashboardApi
      .stats()
      .then((res) => setStats(res.data))
      .catch(() => setError("Could not load dashboard statistics."));
  }, []);

  if (error) return <div className="empty-state">{error}</div>;
  if (!stats) return <div className="empty-state">Loading dashboard...</div>;

  const maxDeptCount = Math.max(1, ...stats.department_wise_count.map((d) => d.count));

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <div className="page-subtitle">Snapshot of today's workforce and attendance</div>
        </div>
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-label">Total Employees</div>
          <div className="stat-value">{stats.total_employees}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Active Employees</div>
          <div className="stat-value accent-primary">{stats.active_employees}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Present Today</div>
          <div className="stat-value accent-success">{stats.present_today}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Absent Today</div>
          <div className="stat-value accent-danger">{stats.absent_today}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">On Leave Today</div>
          <div className="stat-value accent-warning">{stats.on_leave_today}</div>
        </div>
      </div>

      <div className="card">
        <div style={{ fontWeight: 700, marginBottom: 16 }}>Department-wise Employee Count</div>
        {stats.department_wise_count.length === 0 ? (
          <div className="empty-state">No departments found.</div>
        ) : (
          <div className="dept-list">
            {stats.department_wise_count.map((d) => (
              <div className="dept-row" key={d.department}>
                <span style={{ width: 140 }}>{d.department}</span>
                <div className="bar-track">
                  <div
                    className="bar-fill"
                    style={{ width: `${(d.count / maxDeptCount) * 100}%` }}
                  />
                </div>
                <span style={{ width: 30, textAlign: "right", fontWeight: 600 }}>{d.count}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}