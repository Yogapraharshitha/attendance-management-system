import React, { useEffect, useState } from "react";
import { attendanceApi } from "../api/api";
import StatusBadge from "../components/StatusBadge";

export default function MyAttendance() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    attendanceApi
      .me()
      .then((res) => setData(res.data))
      .catch(() => setError("Could not load your attendance record."));
  }, []);

  if (error) return <div className="empty-state">{error}</div>;
  if (!data) return <div className="empty-state">Loading your attendance...</div>;

  const { summary, history } = data;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">My Attendance</h1>
          <div className="page-subtitle">Your personal attendance record</div>
        </div>
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-label">Attendance Rate</div>
          <div className="stat-value accent-primary">{summary.attendance_rate}%</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Present</div>
          <div className="stat-value accent-success">{summary.present}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Absent</div>
          <div className="stat-value accent-danger">{summary.absent}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Half Day</div>
          <div className="stat-value accent-warning">{summary.half_day}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">On Leave</div>
          <div className="stat-value accent-warning">{summary.on_leave}</div>
        </div>
      </div>

      <div className="card">
        <div style={{ fontWeight: 700, marginBottom: 16 }}>Attendance History</div>
        {history.length === 0 ? (
          <div className="empty-state">No attendance records yet.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Check-In</th>
                <th>Check-Out</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {history.map((r) => (
                <tr key={r.attendance_id}>
                  <td>{r.attendance_date}</td>
                  <td>{r.check_in_time || "—"}</td>
                  <td>{r.check_out_time || "—"}</td>
                  <td><StatusBadge status={r.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}