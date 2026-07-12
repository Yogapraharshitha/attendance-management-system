import React, { useEffect, useState } from "react";

const emptyForm = {
  name: "",
  email: "",
  mobile_number: "",
  department_id: "",
  designation: "",
  status: "Active",
};

export default function EmployeeFormModal({ employee, departments, onClose, onSave }) {
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (employee) {
      setForm({
        name: employee.name,
        email: employee.email,
        mobile_number: employee.mobile_number,
        department_id: employee.department_id,
        designation: employee.designation,
        status: employee.status,
      });
    } else {
      setForm(emptyForm);
    }
  }, [employee]);

  const handleChange = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await onSave({ ...form, department_id: Number(form.department_id) });
    } catch (err) {
      setError(err.response?.data?.error || "Could not save employee.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-title">{employee ? "Edit Employee" : "Add Employee"}</div>

        {error && <div className="error-banner">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group full-width">
              <label className="form-label">Full Name</label>
              <input className="input" value={form.name} onChange={handleChange("name")} required />
            </div>
            <div className="form-group full-width">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                className="input"
                value={form.email}
                onChange={handleChange("email")}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Mobile Number</label>
              <input
                className="input"
                value={form.mobile_number}
                onChange={handleChange("mobile_number")}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Designation</label>
              <input
                className="input"
                value={form.designation}
                onChange={handleChange("designation")}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Department</label>
              <select
                className="select"
                value={form.department_id}
                onChange={handleChange("department_id")}
                required
              >
                <option value="" disabled>
                  Select department
                </option>
                {departments.map((d) => (
                  <option key={d.department_id} value={d.department_id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="select" value={form.status} onChange={handleChange("status")}>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? "Saving..." : "Save Employee"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}