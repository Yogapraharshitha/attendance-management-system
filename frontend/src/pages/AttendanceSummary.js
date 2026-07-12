import React, { useEffect, useState } from "react";
import { attendanceApi, employeeApi } from "../api/api";
import StatusBadge from "../components/StatusBadge";

export default function AttendanceSummary() {
  const [summary, setSummary] = useState(null);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    employeeApi.list({ page_size: 100 }).then((res) => setEmployees(res.data.data));
  }, []);

  useEffect(() => {
    attendanceApi
      .summary({ date_from: dateFrom || undefined, date_to: dateTo || undefined })
      .then((res) => setSummary(res.data));
  }, [dateFrom, dateTo]);

  useEffect(() => {
    if (!selectedEmployee) {
      setHistory([]);
      return;
    }
    setHistoryLoading(true);
    attendanceApi
      .history(selectedEmployee)
      .then((res) => setHistory(res.data))
      .finally(() => setHistoryLoading(false));
  }, [selectedEmployee]);

  const total = summary
    ? summary.present + summary.absent + summary.half_day + summary.on_leave
    : 0;
  const presentPct = total > 0 ? Math.round((summary.present / total) * 100) : 0;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Reports</h1>
          <div className="page-subtitle">Attendance summary and employee-wise history</div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="toolbar" style={{ marginBottom: 20 }}>
          <span style={{ fontWeight: 700 }}>Attendance Summary</span>
          <input type="date" className="input" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          <span style={{ color: "var(--color-text-muted)" }}>to</span>
          <input type="date" className="input" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        </div>

        {summary && (
          <div className="stat-grid">
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
            <div className="stat-card">
              <div className="stat-label">Attendance Rate</div>
              <div className="stat-value accent-primary">{presentPct}%</div>
            </div>
          </div>
        )}
      </div>

      <div className="card">
        <div className="toolbar">
          <span style={{ fontWeight: 700 }}>Employee-wise History</span>
          <select
            className="select"
            value={selectedEmployee}
            onChange={(e) => setSelectedEmployee(e.target.value)}
          >
            <option value="">Select an employee</option>
            {employees.map((e) => (
              <option key={e.employee_id} value={e.employee_id}>
                {e.employee_code} - {e.name}
              </option>
            ))}
          </select>
        </div>

        {!selectedEmployee ? (
          <div className="empty-state">Choose an employee to view their attendance history.</div>
        ) : historyLoading ? (
          <div className="empty-state">Loading history...</div>
        ) : history.length === 0 ? (
          <div className="empty-state">No attendance records for this employee yet.</div>
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
