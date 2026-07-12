from datetime import date

from extensions import db
from models import Employee


def _create_employee(client, auth_headers, email="test@example.com"):
    payload = {
        "name": "Test Employee",
        "email": email,
        "mobile_number": "9876543210",
        "department_id": 1,
        "designation": "Engineer",
    }
    resp = client.post("/api/employees", json=payload, headers=auth_headers)
    return resp.get_json()["employee_id"]


def test_mark_attendance(client, auth_headers):
    emp_id = _create_employee(client, auth_headers)
    payload = {
        "employee_id": emp_id,
        "attendance_date": str(date.today()),
        "check_in_time": "09:30",
        "status": "Present",
    }
    resp = client.post("/api/attendance", json=payload, headers=auth_headers)
    assert resp.status_code == 201
    assert resp.get_json()["status"] == "Present"


def test_mark_attendance_updates_existing_record(client, auth_headers):
    emp_id = _create_employee(client, auth_headers)
    today = str(date.today())

    client.post(
        "/api/attendance",
        json={"employee_id": emp_id, "attendance_date": today, "status": "Present"},
        headers=auth_headers,
    )
    resp = client.post(
        "/api/attendance",
        json={"employee_id": emp_id, "attendance_date": today, "status": "Half Day"},
        headers=auth_headers,
    )
    assert resp.status_code == 201
    assert resp.get_json()["status"] == "Half Day"

    resp = client.get(f"/api/attendance?employee_id={emp_id}", headers=auth_headers)
    assert resp.get_json()["total_items"] == 1


def test_attendance_summary(client, auth_headers):
    emp_id = _create_employee(client, auth_headers)
    client.post(
        "/api/attendance",
        json={"employee_id": emp_id, "attendance_date": str(date.today()), "status": "Present"},
        headers=auth_headers,
    )
    resp = client.get("/api/attendance/summary", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.get_json()["present"] == 1


def test_dashboard_stats(client, auth_headers):
    _create_employee(client, auth_headers)
    resp = client.get("/api/dashboard/stats", headers=auth_headers)
    assert resp.status_code == 200
    body = resp.get_json()
    assert body["total_employees"] == 1
    assert body["active_employees"] == 1


def test_export_csv(client, auth_headers):
    emp_id = _create_employee(client, auth_headers)
    client.post(
        "/api/attendance",
        json={"employee_id": emp_id, "attendance_date": str(date.today()), "status": "Present"},
        headers=auth_headers,
    )
    resp = client.get("/api/attendance/export", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.mimetype == "text/csv"
    assert b"Employee Code" in resp.data