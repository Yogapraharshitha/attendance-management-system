from datetime import date

from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required
from sqlalchemy import func

from extensions import db
from models import Employee, Attendance, Department
from decorators import role_required

dashboard_bp = Blueprint("dashboard", __name__, url_prefix="/api/dashboard")


@dashboard_bp.route("/stats", methods=["GET"])
@jwt_required()
@role_required("admin", "manager")
def dashboard_stats():
    """Return dashboard statistics: employee counts, today's attendance, department breakdown."""
    today = date.today()

    total_employees = Employee.query.count()
    active_employees = Employee.query.filter_by(status="Active").count()

    present_today = Attendance.query.filter_by(attendance_date=today, status="Present").count()
    on_leave_today = Attendance.query.filter_by(attendance_date=today, status="On Leave").count()

    marked_today = Attendance.query.filter_by(attendance_date=today).count()
    absent_today = active_employees - present_today - on_leave_today
    absent_today = max(absent_today, 0)

    dept_counts = (
        db.session.query(Department.name, func.count(Employee.employee_id))
        .outerjoin(Employee, Employee.department_id == Department.department_id)
        .group_by(Department.name)
        .all()
    )

    return jsonify(
        {
            "total_employees": total_employees,
            "active_employees": active_employees,
            "present_today": present_today,
            "absent_today": absent_today,
            "on_leave_today": on_leave_today,
            "marked_today": marked_today,
            "department_wise_count": [{"department": name, "count": count} for name, count in dept_counts],
        }
    ), 200