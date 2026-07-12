import React, { useEffect, useState, useCallback } from "react";
import { attendanceApi, employeeApi } from "../api/api";
import Pagination from "../components/Pagination";
import StatusBadge from "../components/StatusBadge";

const todayStr = () => new Date().toISOString().slice(0, 10);

export default function Attendance() {
  const [employees, setEmployees] = useState([]);
  const [records, setRecords] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [employeeFilter, setEmployeeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [loading, setLoading] = useState(true);

  const [markForm, setMarkForm] = useState({
    employee_id: "",
    attendance_date: todayStr(),
    check_in_time: "",
    check_out_time: "",
    status: "Present",
  });
  const [marking, setMarking] = useState(false);
  const [markError, setMarkError] = useState("");

  useEffect(() => {
    employeeApi.list({ page_size: 100, status: "Active" }).then((res) => setEmployees(res.data.data));
  }, []);

  const fetchRecords = useCallback(() => {
    setLoading(true);
    attendanceApi
      .list({
        employee_id: employeeFilter || undefined,
        status: statusFilter || undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
        page,
        page_size: 10,
      })
      .then((res) => {
        setRecords(res.data.data);
        setTotalPages(res.data.total_pages);
        setTotalItems(res.data.total_items);
      })
      .finally(() => setLoading(false));
  }, [employeeFilter, statusFilter, dateFrom, dateTo, page]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const handleMarkSubmit = async (e) => {
    e.preventDefault();
    setMarkError("");
    if (!markForm.employee_id) {
      setMarkError("Please select an employee.");
      return;
    }
    setMarking(true);
    try {
      await attendanceApi.mark({
        ...markForm,
        employee_id: Number(markForm.employee_id),
        check_in_time: markForm.check_in_time || undefined,
        check_out_time: markForm.check_out_time || undefined,
      });
      setPage(1);
      fetchRecords();
      setMarkForm({ ...markForm, employee_id: "", check_in_time: "", check_out_time: "" });
    } catch (err) {
      setMarkError(err.response?.data?.error || "Could not mark attendance.");
    } finally {
      setMarking(false);
    }
  };

 const handleExport = () => {
    const params = {};

    if (employeeFilter) {
      params.employee_id = employeeFilter;
    }

    if (dateFrom) {
      params.date_from = dateFrom;
    }

    if (dateTo) {
      params.date_to = dateTo;
    }

    const url = attendanceApi.exportCsvUrl(params);

    const token = localStorage.getItem("access_token");

    fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error("Export failed");
        }
        return res.blob();
      })
      .then((blob) => {
        const link = document.createElement("a");
        link.href = window.URL.createObjectURL(blob);
        link.download = "attendance_report.csv";
        link.click();
      })
      .catch((err) => {
        console.error(err);
        alert("Failed to export CSV");
      });
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Attendance</h1>
          <div className="page-subtitle">Mark daily attendance and review records</div>
        </div>
        <button className="btn btn-secondary" onClick={handleExport}>
          Export CSV
        </button>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ fontWeight: 700, marginBottom: 14 }}>Mark Attendance</div>
        {markError && <div className="error-banner">{markError}</div>}
        <form onSubmit={handleMarkSubmit} className="toolbar" style={{ marginBottom: 0 }}>
          <select
            className="select"
            value={markForm.employee_id}
            onChange={(e) => setMarkForm({ ...markForm, employee_id: e.target.value })}
            required
          >
            <option value="" disabled>
              Select employee
            </option>
            {employees.map((e) => (
              <option key={e.employee_id} value={e.employee_id}>
                {e.employee_code} - {e.name}
              </option>
            ))}
          </select>
          <input
            type="date"
            className="input"
            value={markForm.attendance_date}
            onChange={(e) => setMarkForm({ ...markForm, attendance_date: e.target.value })}
          />
          <select
            className="select"
            value={markForm.status}
            onChange={(e) => setMarkForm({ ...markForm, status: e.target.value })}
          >
            <option value="Present">Present</option>
            <option value="Absent">Absent</option>
            <option value="Half Day">Half Day</option>
            <option value="On Leave">On Leave</option>
          </select>
          <input
            type="time"
            className="input"
            title="Check-in time"
            value={markForm.check_in_time}
            onChange={(e) => setMarkForm({ ...markForm, check_in_time: e.target.value })}
          />
          <input
            type="time"
            className="input"
            title="Check-out time"
            value={markForm.check_out_time}
            onChange={(e) => setMarkForm({ ...markForm, check_out_time: e.target.value })}
          />
          <button className="btn btn-primary" type="submit" disabled={marking}>
            {marking ? "Saving..." : "Mark"}
          </button>
        </form>
      </div>

      <div className="card">
        <div className="toolbar">
          <select
            className="select"
            value={employeeFilter}
            onChange={(e) => {
              setEmployeeFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Employees</option>
            {employees.map((e) => (
              <option key={e.employee_id} value={e.employee_id}>
                {e.employee_code} - {e.name}
              </option>
            ))}
          </select>
          <select
            className="select"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Status</option>
            <option value="Present">Present</option>
            <option value="Absent">Absent</option>
            <option value="Half Day">Half Day</option>
            <option value="On Leave">On Leave</option>
          </select>
          <input
            type="date"
            className="input"
            value={dateFrom}
            onChange={(e) => {
              setDateFrom(e.target.value);
              setPage(1);
            }}
          />
          <span style={{ color: "var(--color-text-muted)" }}>to</span>
          <input
            type="date"
            className="input"
            value={dateTo}
            onChange={(e) => {
              setDateTo(e.target.value);
              setPage(1);
            }}
          />
        </div>

        {loading ? (
          <div className="empty-state">Loading records...</div>
        ) : records.length === 0 ? (
          <div className="empty-state">No attendance records found for these filters.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Date</th>
                <th>Check-In</th>
                <th>Check-Out</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <tr key={r.attendance_id}>
                  <td>
                    <span className="mono">{r.employee_code}</span> &nbsp;{r.employee_name}
                  </td>
                  <td>{r.attendance_date}</td>
                  <td>{r.check_in_time || "—"}</td>
                  <td>{r.check_out_time || "—"}</td>
                  <td><StatusBadge status={r.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <Pagination page={page} totalPages={totalPages} totalItems={totalItems} onPageChange={setPage} />
      </div>
    </div>
  );
}