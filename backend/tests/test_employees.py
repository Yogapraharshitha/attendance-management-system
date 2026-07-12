def test_login_success(client):
    resp = client.post("/api/auth/login", json={"username": "admin", "password": "Admin@123"})
    assert resp.status_code == 200
    assert "access_token" in resp.get_json()


def test_login_invalid_password(client):
    resp = client.post("/api/auth/login", json={"username": "admin", "password": "wrong"})
    assert resp.status_code == 401


def test_create_employee_requires_auth(client):
    resp = client.post("/api/employees", json={"name": "Jane Doe"})
    assert resp.status_code == 401


def test_create_and_get_employee(client, auth_headers):
    payload = {
        "name": "Jane Doe",
        "email": "jane@example.com",
        "mobile_number": "9876543210",
        "department_id": 1,
        "designation": "Software Engineer",
    }
    resp = client.post("/api/employees", json=payload, headers=auth_headers)
    assert resp.status_code == 201
    body = resp.get_json()
    assert body["employee_code"] == "EMP-0001"
    assert body["email"] == "jane@example.com"

    emp_id = body["employee_id"]
    resp = client.get(f"/api/employees/{emp_id}", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.get_json()["name"] == "Jane Doe"


def test_duplicate_email_rejected(client, auth_headers):
    payload = {
        "name": "Jane Doe",
        "email": "dup@example.com",
        "mobile_number": "9876543210",
        "department_id": 1,
        "designation": "Engineer",
    }
    client.post("/api/employees", json=payload, headers=auth_headers)
    resp = client.post("/api/employees", json=payload, headers=auth_headers)
    assert resp.status_code == 409


def test_update_and_delete_employee(client, auth_headers):
    payload = {
        "name": "John Smith",
        "email": "john@example.com",
        "mobile_number": "9876543211",
        "department_id": 1,
        "designation": "QA Engineer",
    }
    resp = client.post("/api/employees", json=payload, headers=auth_headers)
    emp_id = resp.get_json()["employee_id"]

    resp = client.put(
        f"/api/employees/{emp_id}", json={"designation": "Senior QA Engineer"}, headers=auth_headers
    )
    assert resp.status_code == 200
    assert resp.get_json()["designation"] == "Senior QA Engineer"

    resp = client.delete(f"/api/employees/{emp_id}", headers=auth_headers)
    assert resp.status_code == 200

    resp = client.get(f"/api/employees/{emp_id}", headers=auth_headers)
    assert resp.status_code == 404