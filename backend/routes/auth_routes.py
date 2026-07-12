import random
from datetime import datetime, timedelta

from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required
from werkzeug.security import check_password_hash, generate_password_hash

from extensions import db
from models import User, Employee
from decorators import role_required
from email_utils import send_email

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


@auth_bp.route("/login", methods=["POST"])
def login():
    """Authenticate a user and issue a JWT access token."""
    data = request.get_json(silent=True) or {}
    username = data.get("username", "").strip()
    password = data.get("password", "")

    if not username or not password:
        return jsonify({"error": "Username and password are required"}), 400

    user = User.query.filter_by(username=username).first()

    if not user or not user.is_active or not check_password_hash(user.password_hash, password):
        return jsonify({"error": "Invalid username or password"}), 401

    token = create_access_token(
        identity=str(user.user_id),
        additional_claims={
            "username": user.username,
            "role": user.role,
            "employee_id": user.employee_id,
        },
    )

    return jsonify({"access_token": token, "user": user.to_dict()}), 200


@auth_bp.route("/register-employee-login", methods=["POST"])
@jwt_required()
@role_required("admin")
def register_employee_login():
    """Admin-only: create a login account for an existing employee (role='employee')."""
    data = request.get_json(silent=True) or {}
    employee_id = data.get("employee_id")
    username = (data.get("username") or "").strip()
    password = data.get("password") or ""

    if not employee_id or not username or not password:
        return jsonify({"error": "employee_id, username and password are required"}), 400

    employee = Employee.query.get(employee_id)
    if not employee:
        return jsonify({"error": "Employee not found"}), 404

    if User.query.filter_by(username=username).first():
        return jsonify({"error": "Username already taken"}), 409

    if User.query.filter_by(employee_id=employee_id).first():
        return jsonify({"error": "This employee already has a login account"}), 409

    user = User(
        username=username,
        password_hash=generate_password_hash(password),
        role="employee",
        employee_id=employee_id,
        is_active=True,
    )
    db.session.add(user)
    db.session.commit()

    return jsonify(user.to_dict()), 201


@auth_bp.route("/me", methods=["GET"])
def me():
    """Simple health check for the auth blueprint."""
    return jsonify({"status": "auth service running"}), 200


@auth_bp.route("/forgot-password", methods=["POST"])
def forgot_password():
    """
    Request a password-reset OTP. Sends a 6-digit code to the account's
    registered email (own email for admin/manager, or the linked employee's
    email for employee-role accounts).
    """
    data = request.get_json(silent=True) or {}
    username = (data.get("username") or "").strip()

    generic_response = jsonify(
        {"message": "If that account exists and has an email on file, a reset code has been sent."}
    )

    if not username:
        return jsonify({"error": "Username is required"}), 400

    user = User.query.filter_by(username=username).first()
    if not user or not user.is_active:
        return generic_response, 200

    target_email = user.effective_email()
    if not target_email:
        return generic_response, 200

    otp = f"{random.randint(0, 999999):06d}"
    user.reset_otp_hash = generate_password_hash(otp)
    user.reset_otp_expires_at = datetime.utcnow() + timedelta(minutes=10)
    db.session.commit()

    try:
        send_email(
            target_email,
            "Twite Attendance - Password Reset Code",
            f"Your password reset code is: {otp}\n\nThis code expires in 10 minutes. "
            f"If you did not request this, you can ignore this email.",
        )
    except Exception as exc:  # noqa: BLE001
        return jsonify({"error": f"Could not send reset email: {exc}"}), 500

    return generic_response, 200


@auth_bp.route("/reset-password-otp", methods=["POST"])
def reset_password_otp():
    """Complete a password reset using the OTP emailed by /forgot-password."""
    data = request.get_json(silent=True) or {}
    username = (data.get("username") or "").strip()
    otp = (data.get("otp") or "").strip()
    new_password = data.get("new_password") or ""

    if not username or not otp or not new_password:
        return jsonify({"error": "username, otp and new_password are required"}), 400

    if len(new_password) < 6:
        return jsonify({"error": "Password must be at least 6 characters"}), 400

    user = User.query.filter_by(username=username).first()
    if not user or not user.reset_otp_hash or not user.reset_otp_expires_at:
        return jsonify({"error": "Invalid or expired code"}), 400

    if datetime.utcnow() > user.reset_otp_expires_at:
        return jsonify({"error": "This code has expired. Please request a new one."}), 400

    if not check_password_hash(user.reset_otp_hash, otp):
        return jsonify({"error": "Incorrect code"}), 400

    user.password_hash = generate_password_hash(new_password)
    user.reset_otp_hash = None
    user.reset_otp_expires_at = None
    db.session.commit()

    return jsonify({"message": "Password reset successfully. You can now log in."}), 200