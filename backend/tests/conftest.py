import pytest
from werkzeug.security import generate_password_hash

from app import create_app
from config import TestConfig
from extensions import db
from models import User, Department


@pytest.fixture()
def app():
    app = create_app(TestConfig)
    with app.app_context():
        db.create_all()
        db.session.add(Department(name="Engineering"))
        db.session.add(
            User(
                username="admin",
                password_hash=generate_password_hash("Admin@123"),
                role="admin",
                is_active=True,
            )
        )
        db.session.commit()
        yield app
        db.session.remove()
        db.drop_all()


@pytest.fixture()
def client(app):
    return app.test_client()


@pytest.fixture()
def auth_headers(client):
    resp = client.post("/api/auth/login", json={"username": "admin", "password": "Admin@123"})
    token = resp.get_json()["access_token"]
    return {"Authorization": f"Bearer {token}"}