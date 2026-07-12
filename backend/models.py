from datetime import datetime
from extensions import db

class User(db.Model):
    __tablename__ = "users"

    user_id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(
        db.Enum("admin", "manager", "employee", name="user_role"), default="admin", nullable=False
    )
    employee_id = db.Column(
        db.Integer, db.ForeignKey("employees.employee_id"), unique=True, nullable=True
    )
    email = db.Column(db.String(120), nullable=True)
    reset_otp_hash = db.Column(db.String(255), nullable=True)
    reset_otp_expires_at = db.Column(db.DateTime, nullable=True)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    linked_employee = db.relationship("Employee", foreign_keys=[employee_id])

    def effective_email(self):
        """The email to send password-reset codes to: own email, or linked employee's email."""
        if self.email:
            return self.email
        if self.linked_employee:
            return self.linked_employee.email
        return None

    def to_dict(self):
        return {
            "user_id": self.user_id,
            "username": self.username,
            "role": self.role,
            "employee_id": self.employee_id,
            "is_active": self.is_active,
        }

class Department(db.Model):
    __tablename__ = "departments"

    department_id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    employees = db.relationship("Employee", backref="department", lazy=True)

    def to_dict(self):
        return {"department_id": self.department_id, "name": self.name}


class Employee(db.Model):
    __tablename__ = "employees"

    employee_id = db.Column(db.Integer, primary_key=True)
    employee_code = db.Column(db.String(20), unique=True, nullable=False)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    mobile_number = db.Column(db.String(15), nullable=False)
    department_id = db.Column(db.Integer, db.ForeignKey("departments.department_id"), nullable=False)
    designation = db.Column(db.String(100), nullable=False)
    status = db.Column(db.Enum("Active", "Inactive", name="employee_status"), default="Active", nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by = db.Column(db.Integer, db.ForeignKey("users.user_id"), nullable=True)

    attendance_records = db.relationship(
        "Attendance", backref="employee", lazy=True, cascade="all, delete-orphan"
    )

    def to_dict(self):
        return {
            "employee_id": self.employee_id,
            "employee_code": self.employee_code,
            "name": self.name,
            "email": self.email,
            "mobile_number": self.mobile_number,
            "department_id": self.department_id,
            "department": self.department.name if self.department else None,
            "designation": self.designation,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class Attendance(db.Model):
    __tablename__ = "attendance"

    attendance_id = db.Column(db.Integer, primary_key=True)
    employee_id = db.Column(db.Integer, db.ForeignKey("employees.employee_id"), nullable=False)
    attendance_date = db.Column(db.Date, nullable=False)
    check_in_time = db.Column(db.Time, nullable=True)
    check_out_time = db.Column(db.Time, nullable=True)
    status = db.Column(
        db.Enum("Present", "Absent", "Half Day", "On Leave", name="attendance_status"),
        default="Present",
        nullable=False,
    )
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    marked_by = db.Column(db.Integer, db.ForeignKey("users.user_id"), nullable=True)

    __table_args__ = (db.UniqueConstraint("employee_id", "attendance_date", name="uq_employee_date"),)

    def to_dict(self):
        return {
            "attendance_id": self.attendance_id,
            "employee_id": self.employee_id,
            "employee_name": self.employee.name if self.employee else None,
            "employee_code": self.employee.employee_code if self.employee else None,
            "attendance_date": self.attendance_date.isoformat() if self.attendance_date else None,
            "check_in_time": self.check_in_time.strftime("%H:%M:%S") if self.check_in_time else None,
            "check_out_time": self.check_out_time.strftime("%H:%M:%S") if self.check_out_time else None,
            "status": self.status,
        }