import React, { useEffect, useState, useCallback } from "react";
import { employeeApi } from "../api/api";
import { useAuth } from "../context/AuthContext";
import Pagination from "../components/Pagination";
import StatusBadge from "../components/StatusBadge";
import EmployeeFormModal from "../components/EmployeeFormModal";
import CreateLoginModal from "../components/CreateLoginModal";

export default function Employees() {
  const { isAdmin } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortBy, setSortBy] = useState("employee_id");
  const [order, setOrder] = useState("asc");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [loginModalEmployee, setLoginModalEmployee] = useState(null);

  useEffect(() => {
    employeeApi.departments().then((res) => setDepartments(res.data));
  }, []);

  const fetchEmployees = useCallback(() => {
    setLoading(true);
    employeeApi
      .list({
        search: search || undefined,
        department_id: departmentFilter || undefined,
        status: statusFilter || undefined,
        sort_by: sortBy,
        order,
        page,
        page_size: 10,
      })
      .then((res) => {
        setEmployees(res.data.data);
        setTotalPages(res.data.total_pages);
        setTotalItems(res.data.total_items);
      })
      .finally(() => setLoading(false));
  }, [search, departmentFilter, statusFilter, sortBy, order, page]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const handleSort = (column) => {
    if (sortBy === column) {
      setOrder(order === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setOrder("asc");
    }
  };

  const openAddModal = () => {
    setEditingEmployee(null);
    setModalOpen(true);
  };

  const openEditModal = (employee) => {
    setEditingEmployee(employee);
    setModalOpen(true);
  };

  const handleSave = async (formData) => {
    if (editingEmployee) {
      await employeeApi.update(editingEmployee.employee_id, formData);
    } else {
      await employeeApi.create(formData);
    }
    setModalOpen(false);
    setPage(1);
    fetchEmployees();
  };

  const handleDelete = async (employee) => {
    if (!window.confirm(`Delete ${employee.name}? This also removes their attendance history.`)) return;
    await employeeApi.remove(employee.employee_id);
    fetchEmployees();
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Employees</h1>
          <div className="page-subtitle">Manage employee records</div>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={openAddModal}>
            + Add Employee
          </button>
        )}
      </div>

      <div className="card">
        <div className="toolbar">
          <input
            className="input"
            placeholder="Search by name, email, or code..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            style={{ minWidth: 240 }}
          />
          <select
            className="select"
            value={departmentFilter}
            onChange={(e) => {
              setDepartmentFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d.department_id} value={d.department_id}>
                {d.name}
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
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>

        {loading ? (
          <div className="empty-state">Loading employees...</div>
        ) : employees.length === 0 ? (
          <div className="empty-state">No employees match your filters.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th onClick={() => handleSort("employee_code")}>Code</th>
                <th onClick={() => handleSort("name")}>Name</th>
                <th onClick={() => handleSort("email")}>Email</th>
                <th>Mobile</th>
                <th>Department</th>
                <th>Designation</th>
                <th onClick={() => handleSort("status")}>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {employees.map((emp) => (
                <tr key={emp.employee_id}>
                  <td className="mono">{emp.employee_code}</td>
                  <td>{emp.name}</td>
                  <td>{emp.email}</td>
                  <td>{emp.mobile_number}</td>
                  <td>{emp.department}</td>
                  <td>{emp.designation}</td>
                  <td><StatusBadge status={emp.status} /></td>
                  <td>
                    {isAdmin ? (
                      <div style={{ display: "flex", gap: 8 }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => openEditModal(emp)}>
                          Edit
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(emp)}>
                          Delete
                        </button>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => setLoginModalEmployee(emp)}
                        >
                          Create Login
                        </button>
                      </div>
                    ) : (
                      <span className="mono">view only</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <Pagination page={page} totalPages={totalPages} totalItems={totalItems} onPageChange={setPage} />
      </div>

      {modalOpen && (
        <EmployeeFormModal
          employee={editingEmployee}
          departments={departments}
          onClose={() => setModalOpen(false)}
          onSave={handleSave}
        />
      )}

      {loginModalEmployee && (
        <CreateLoginModal
          employee={loginModalEmployee}
          onClose={() => setLoginModalEmployee(null)}
          onCreated={(data) => employeeApi.registerLogin(data)}
        />
      )}
    </div>
  );
}