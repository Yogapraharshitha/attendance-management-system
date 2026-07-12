from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import or_

from extensions import db
from models import Employee, Department
from decorators import role_required

employee_bp = Blueprint("employees", __name__, url_prefix="/api/employees")


def _generate_employee_code():
    last = Employee.query.order_by(Employee.employee_id.desc()).first()
    next_id = (last.employee_id + 1) if last else 1
    return f"EMP-{next_id:04d}"


@employee_bp.route("", methods=["GET"])
@jwt_required()
@role_required("admin", "manager")
def get_employees():
    """List employees with search, filter, sort and pagination."""
    search = request.args.get("search", "").strip()
    department_id = request.args.get("department_id", type=int)
    status = request.args.get("status", "").strip()
    sort_by = request.args.get("sort_by", "employee_id")
    order = request.args.get("order", "asc")
    page = request.args.get("page", 1, type=int)
    page_size = min(request.args.get("page_size", 10, type=int), 100)

    query = Employee.query

    if search:
        like = f"%{search}%"
        query = query.filter(
            or_(
                Employee.name.ilike(like),
                Employee.email.ilike(like),
                Employee.employee_code.ilike(like),
            )
        )

    if department_id:
        query = query.filter(Employee.department_id == department_id)

    if status in ("Active", "Inactive"):
        query = query.filter(Employee.status == status)

    sort_column = getattr(Employee, sort_by, Employee.employee_id)
    query = query.order_by(sort_column.desc() if order == "desc" else sort_column.asc())

    pagination = query.paginate(page=page, per_page=page_size, error_out=False)

    return jsonify(
        {
            "data": [e.to_dict() for e in pagination.items],
            "page": pagination.page,
            "page_size": page_size,
            "total_items": pagination.total,
            "total_pages": pagination.pages,
        }
    ), 200


@employee_bp.route("/<int:employee_id>", methods=["GET"])
@jwt_required()
@role_required("admin", "manager")
def get_employee(employee_id):
    """Get a single employee by ID."""
    employee = Employee.query.get(employee_id)
    if not employee:
        return jsonify({"error": "Employee not found"}), 404
    return jsonify(employee.to_dict()), 200


@employee_bp.route("", methods=["POST"])
@jwt_required()
@role_required("admin")
def create_employee():
    """Create a new employee. Admin only."""
    data = request.get_json(silent=True) or {}
    required = ["name", "email", "mobile_number", "department_id", "designation"]
    missing = [f for f in required if not data.get(f)]
    if missing:
        return jsonify({"error": f"Missing required fields: {', '.join(missing)}"}), 400

    if Employee.query.filter_by(email=data["email"]).first():
        return jsonify({"error": "An employee with this email already exists"}), 409

    department = Department.query.get(data["department_id"])
    if not department:
        return jsonify({"error": "Invalid department_id"}), 400

    current_user_id = get_jwt_identity()

    employee = Employee(
        employee_code=_generate_employee_code(),
        name=data["name"],
        email=data["email"],
        mobile_number=data["mobile_number"],
        department_id=data["department_id"],
        designation=data["designation"],
        status=data.get("status", "Active"),
        created_by=int(current_user_id) if current_user_id else None,
    )
    db.session.add(employee)
    db.session.commit()

    return jsonify(employee.to_dict()), 201


@employee_bp.route("/<int:employee_id>", methods=["PUT"])
@jwt_required()
@role_required("admin")
def update_employee(employee_id):
    """Update an existing employee. Admin only."""
    employee = Employee.query.get(employee_id)
    if not employee:
        return jsonify({"error": "Employee not found"}), 404

    data = request.get_json(silent=True) or {}

    if "email" in data and data["email"] != employee.email:
        if Employee.query.filter_by(email=data["email"]).first():
            return jsonify({"error": "An employee with this email already exists"}), 409
        employee.email = data["email"]

    for field in ["name", "mobile_number", "designation", "status"]:
        if field in data:
            setattr(employee, field, data[field])

    if "department_id" in data:
        if not Department.query.get(data["department_id"]):
            return jsonify({"error": "Invalid department_id"}), 400
        employee.department_id = data["department_id"]

    db.session.commit()
    return jsonify(employee.to_dict()), 200


@employee_bp.route("/<int:employee_id>", methods=["DELETE"])
@jwt_required()
@role_required("admin")
def delete_employee(employee_id):
    """Delete an employee (cascades to attendance records). Admin only."""
    employee = Employee.query.get(employee_id)
    if not employee:
        return jsonify({"error": "Employee not found"}), 404

    db.session.delete(employee)
    db.session.commit()
    return jsonify({"message": "Employee deleted successfully"}), 200


@employee_bp.route("/departments", methods=["GET"])
@jwt_required()
def list_departments():
    """List all departments (used to populate dropdowns)."""
    departments = Department.query.order_by(Department.name.asc()).all()
    return jsonify([d.to_dict() for d in departments]), 200