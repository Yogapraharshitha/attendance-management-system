import React, { useState } from "react";
import { authApi } from "../api/api";

export default function ForgotPasswordModal({ onClose }) {
  const [step, setStep] = useState("request"); // "request" | "reset" | "done"
  const [username, setUsername] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [info, setInfo] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRequestCode = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await authApi.forgotPassword(username);
      setInfo(res.data.message);
      setStep("reset");
    } catch (err) {
      setError(err.response?.data?.error || "Could not send reset code.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await authApi.resetPasswordOtp({ username, otp, new_password: newPassword });
      setStep("done");
    } catch (err) {
      setError(err.response?.data?.error || "Could not reset password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-title">Forgot Password</div>

        {error && <div className="error-banner">{error}</div>}

        {step === "request" && (
          <form onSubmit={handleRequestCode}>
            <div className="form-group">
              <label className="form-label">Username</label>
              <input
                className="input"
                style={{ width: "100%" }}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoFocus
              />
            </div>
            <div className="modal-actions">
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? "Sending..." : "Send Reset Code"}
              </button>
            </div>
          </form>
        )}

        {step === "reset" && (
          <form onSubmit={handleResetSubmit}>
            <div style={{ fontSize: 13, color: "var(--color-text-muted)", marginBottom: 14 }}>
              {info}
            </div>
            <div className="form-group">
              <label className="form-label">6-digit code from email</label>
              <input
                className="input"
                style={{ width: "100%" }}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                maxLength={6}
                required
                autoFocus
              />
            </div>
            <div className="form-group">
              <label className="form-label">New Password</label>
              <input
                className="input"
                style={{ width: "100%" }}
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                minLength={6}
                required
              />
            </div>
            <div className="modal-actions">
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? "Resetting..." : "Reset Password"}
              </button>
            </div>
          </form>
        )}

        {step === "done" && (
          <div>
            <div style={{ fontSize: 14, marginBottom: 18 }}>
              Your password has been reset. You can now log in with your new password.
            </div>
            <div className="modal-actions">
              <button className="btn btn-primary" onClick={onClose}>
                Back to Login
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}