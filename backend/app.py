from flask import Flask, jsonify
from flask_cors import CORS
from flasgger import Swagger

from config import Config
from extensions import db, jwt
from routes.auth_routes import auth_bp
from routes.employee_routes import employee_bp
from routes.attendance_routes import attendance_bp
from routes.dashboard_routes import dashboard_bp


def create_app(config_object=Config):
    app = Flask(__name__)
    app.config.from_object(config_object)

    CORS(app, resources={r"/api/*": {"origins": "*"}})

    db.init_app(app)
    jwt.init_app(app)

    swagger_config = {
        "headers": [],
        "specs": [{"endpoint": "apispec", "route": "/apispec.json", "rule_filter": lambda rule: True}],
        "static_url_path": "/flasgger_static",
        "swagger_ui": True,
        "specs_route": "/api/docs/",
    }
    Swagger(
        app,
        config=swagger_config,
        template={
            "info": {
                "title": "Mini Attendance Management System API",
                "description": "REST API for employee and attendance management.",
                "version": "1.0.0",
            },
            "securityDefinitions": {
                "Bearer": {
                    "type": "apiKey",
                    "name": "Authorization",
                    "in": "header",
                    "description": "Enter: Bearer <JWT token>",
                }
            },
        },
    )

    app.register_blueprint(auth_bp)
    app.register_blueprint(employee_bp)
    app.register_blueprint(attendance_bp)
    app.register_blueprint(dashboard_bp)

    @app.route("/api/health", methods=["GET"])
    def health():
        return jsonify({"status": "ok"}), 200

    @jwt.unauthorized_loader
    def unauthorized_callback(reason):
        return jsonify({"error": "Missing or invalid authorization token"}), 401

    @jwt.invalid_token_loader
    def invalid_token_callback(reason):
        return jsonify({"error": "Invalid token"}), 422

    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        return jsonify({"error": "Token has expired"}), 401

    return app


app = create_app()

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)