import React, { useState } from "react";

export default function CreateLoginModal({ employee, onClose, onCreated }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await onCreated({ employee_id: employee.employee_id, username, password });
      setSuccess(`Login created. Share these credentials with ${employee.name}.`);
    } catch (err) {
      setError(err.response?.data?.error || "Could not create login.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-title">Create Login for {employee.name}</div>

        {error && <div className="error-banner">{error}</div>}
        {success && (
          <div style={{ marginBottom: 16, fontSize: 14 }}>
            {success}
            <div className="mono" style={{ marginTop: 8 }}>
              Username: {username} <br /> Password: {password}
            </div>
          </div>
        )}

        {!success && (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Username</label>
              <input
                className="input"
                style={{ width: "100%" }}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Temporary Password</label>
              <input
                className="input"
                style={{ width: "100%" }}
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="modal-actions">
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? "Creating..." : "Create Login"}
              </button>
            </div>
          </form>
        )}

        {success && (
          <div className="modal-actions">
            <button className="btn btn-primary" onClick={onClose}>
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}