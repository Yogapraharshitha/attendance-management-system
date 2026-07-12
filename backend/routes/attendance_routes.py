from datetime import datetime, date
from io import StringIO
import csv

from flask import Blueprint, request, jsonify, Response
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from sqlalchemy import func

from extensions import db
from models import Attendance, Employee
from decorators import role_required

attendance_bp = Blueprint("attendance", __name__, url_prefix="/api/attendance")


def _parse_time(value):
    if not value:
        return None
    return datetime.strptime(value, "%H:%M").time()


def _parse_date(value):
    if not value:
        return date.today()
    return datetime.strptime(value, "%Y-%m-%d").date()


@attendance_bp.route("", methods=["POST"])
@jwt_required()
@role_required("admin", "manager")
def mark_attendance():
    """Mark (create or update) attendance for an employee on a given date."""
    data = request.get_json(silent=True) or {}
    employee_id = data.get("employee_id")
    if not employee_id:
        return jsonify({"error": "employee_id is required"}), 400

    if not Employee.query.get(employee_id):
        return jsonify({"error": "Employee not found"}), 404

    attendance_date = _parse_date(data.get("attendance_date"))
    current_user_id = get_jwt_identity()

    record = Attendance.query.filter_by(
        employee_id=employee_id, attendance_date=attendance_date
    ).first()

    if record:
        record.status = data.get("status", record.status)
        record.check_in_time = _parse_time(data.get("check_in_time")) or record.check_in_time
        record.check_out_time = _parse_time(data.get("check_out_time")) or record.check_out_time
        record.marked_by = int(current_user_id) if current_user_id else None
    else:
        record = Attendance(
            employee_id=employee_id,
            attendance_date=attendance_date,
            check_in_time=_parse_time(data.get("check_in_time")),
            check_out_time=_parse_time(data.get("check_out_time")),
            status=data.get("status", "Present"),
            marked_by=int(current_user_id) if current_user_id else None,
        )
        db.session.add(record)

    db.session.commit()
    return jsonify(record.to_dict()), 201


@attendance_bp.route("", methods=["GET"])
@jwt_required()
@role_required("admin", "manager")
def get_attendance_records():
    """List attendance records with filters and pagination."""
    employee_id = request.args.get("employee_id", type=int)
    status = request.args.get("status", "").strip()
    date_from = request.args.get("date_from")
    date_to = request.args.get("date_to")
    page = request.args.get("page", 1, type=int)
    page_size = min(request.args.get("page_size", 10, type=int), 100)

    query = Attendance.query

    if employee_id:
        query = query.filter(Attendance.employee_id == employee_id)
    if status:
        query = query.filter(Attendance.status == status)
    if date_from:
        query = query.filter(Attendance.attendance_date >= _parse_date(date_from))
    if date_to:
        query = query.filter(Attendance.attendance_date <= _parse_date(date_to))

    query = query.order_by(Attendance.attendance_date.desc())
    pagination = query.paginate(page=page, per_page=page_size, error_out=False)

    return jsonify(
        {
            "data": [a.to_dict() for a in pagination.items],
            "page": pagination.page,
            "page_size": page_size,
            "total_items": pagination.total,
            "total_pages": pagination.pages,
        }
    ), 200


@attendance_bp.route("/summary", methods=["GET"])
@jwt_required()
@role_required("admin", "manager")
def attendance_summary():
    """Aggregate attendance summary counts, optionally filtered by date range."""
    date_from = request.args.get("date_from")
    date_to = request.args.get("date_to")

    query = db.session.query(Attendance.status, func.count(Attendance.attendance_id))
    if date_from:
        query = query.filter(Attendance.attendance_date >= _parse_date(date_from))
    if date_to:
        query = query.filter(Attendance.attendance_date <= _parse_date(date_to))

    counts = dict(query.group_by(Attendance.status).all())
    return jsonify(
        {
            "present": counts.get("Present", 0),
            "absent": counts.get("Absent", 0),
            "half_day": counts.get("Half Day", 0),
            "on_leave": counts.get("On Leave", 0),
        }
    ), 200


@attendance_bp.route("/employee/<int:employee_id>", methods=["GET"])
@jwt_required()
@role_required("admin", "manager")
def employee_history(employee_id):
    """Full attendance history for a single employee (admin/manager view)."""
    if not Employee.query.get(employee_id):
        return jsonify({"error": "Employee not found"}), 404

    records = (
        Attendance.query.filter_by(employee_id=employee_id)
        .order_by(Attendance.attendance_date.desc())
        .all()
    )
    return jsonify([r.to_dict() for r in records]), 200


@attendance_bp.route("/me", methods=["GET"])
@jwt_required()
def my_attendance():
    """Self-service: logged-in 'employee' sees only their own attendance."""
    claims = get_jwt()
    employee_id = claims.get("employee_id")

    if not employee_id:
        return jsonify({"error": "This account is not linked to an employee record"}), 400

    records = (
        Attendance.query.filter_by(employee_id=employee_id)
        .order_by(Attendance.attendance_date.desc())
        .all()
    )

    counts = {"Present": 0, "Absent": 0, "Half Day": 0, "On Leave": 0}
    for r in records:
        counts[r.status] = counts.get(r.status, 0) + 1

    total_marked = sum(counts.values())
    attendance_rate = round((counts["Present"] / total_marked) * 100, 1) if total_marked else 0

    return jsonify(
        {
            "history": [r.to_dict() for r in records],
            "summary": {
                "present": counts["Present"],
                "absent": counts["Absent"],
                "half_day": counts["Half Day"],
                "on_leave": counts["On Leave"],
                "attendance_rate": attendance_rate,
            },
        }
    ), 200


@attendance_bp.route("/export", methods=["GET"])
@jwt_required()
@role_required("admin", "manager")
def export_attendance_csv():
    """Export filtered attendance records as a CSV file."""
    employee_id = request.args.get("employee_id", type=int)
    date_from = request.args.get("date_from")
    date_to = request.args.get("date_to")

    query = Attendance.query
    if employee_id:
        query = query.filter(Attendance.employee_id == employee_id)
    if date_from:
        query = query.filter(Attendance.attendance_date >= _parse_date(date_from))
    if date_to:
        query = query.filter(Attendance.attendance_date <= _parse_date(date_to))

    records = query.order_by(Attendance.attendance_date.desc()).all()

    buffer = StringIO()
    writer = csv.writer(buffer)
    writer.writerow(
        ["Employee Code", "Employee Name", "Date", "Check-In", "Check-Out", "Status"]
    )
    for r in records:
        writer.writerow(
            [
                r.employee.employee_code if r.employee else "",
                r.employee.name if r.employee else "",
                r.attendance_date,
                r.check_in_time or "",
                r.check_out_time or "",
                r.status,
            ]
        )

    output = buffer.getvalue()
    return Response(
        output,
        mimetype="text/csv",
        headers={"Content-Disposition": "attachment; filename=attendance_report.csv"},
    )