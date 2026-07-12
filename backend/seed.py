"""
Run this once after creating the MySQL database (and running database/schema.sql)
to create the SQLAlchemy tables (if not already created by the .sql script) and
insert default admin and manager users.

Usage:
    python seed.py
"""
from werkzeug.security import generate_password_hash

from app import create_app
from config import Config
from extensions import db
from models import User, Department


def seed():
    app = create_app(Config)
    with app.app_context():
        db.create_all()

        if not Department.query.first():
            for name in ["Engineering", "Human Resources", "Sales", "Marketing", "Finance"]:
                db.session.add(Department(name=name))
            db.session.commit()
            print("Seeded departments.")

        existing_admin = User.query.filter_by(username=app.config["ADMIN_USERNAME"]).first()
        if not existing_admin:
            admin = User(
                username=app.config["ADMIN_USERNAME"],
                password_hash=generate_password_hash(app.config["ADMIN_PASSWORD"]),
                role="admin",
                email=app.config["ADMIN_EMAIL"] or None,
                is_active=True,
            )
            db.session.add(admin)
            db.session.commit()
            print(f"Created default admin user: {app.config['ADMIN_USERNAME']} / {app.config['ADMIN_PASSWORD']}")
        else:
            print("Admin user already exists, skipping.")


if __name__ == "__main__":
    seed()