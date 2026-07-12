-- ============================================================
-- Mini Attendance Management System - Database Schema (MySQL)
-- ============================================================

CREATE DATABASE IF NOT EXISTS attendance_system
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE attendance_system;

-- ------------------------------------------------------------
-- Table: users  (login / authentication)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    user_id         INT AUTO_INCREMENT PRIMARY KEY,
    username        VARCHAR(50)  NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    role            ENUM('admin', 'manager', 'employee') NOT NULL DEFAULT 'admin',
    employee_id     INT NULL UNIQUE,
    email           VARCHAR(120) NULL,
    reset_otp_hash        VARCHAR(255) NULL,
    reset_otp_expires_at  DATETIME NULL,
    is_active       TINYINT(1)   NOT NULL DEFAULT 1,
    created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
                                  ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;
-- ------------------------------------------------------------
-- Table: departments (lookup table for normalization)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS departments (
    department_id   INT AUTO_INCREMENT PRIMARY KEY,
    name            VARCHAR(100) NOT NULL UNIQUE,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- Table: employees
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS employees (
    employee_id     INT AUTO_INCREMENT PRIMARY KEY,
    employee_code   VARCHAR(20)  NOT NULL UNIQUE,        -- human-facing Employee ID e.g. EMP-0001
    name            VARCHAR(100) NOT NULL,
    email           VARCHAR(120) NOT NULL UNIQUE,
    mobile_number   VARCHAR(15)  NOT NULL,
    department_id   INT          NOT NULL,
    designation     VARCHAR(100) NOT NULL,
    status          ENUM('Active', 'Inactive') NOT NULL DEFAULT 'Active',
    created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
                                  ON UPDATE CURRENT_TIMESTAMP,
    created_by      INT          NULL,
    CONSTRAINT fk_employee_department
        FOREIGN KEY (department_id) REFERENCES departments(department_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_employee_created_by
        FOREIGN KEY (created_by) REFERENCES users(user_id)
        ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT chk_mobile_number CHECK (CHAR_LENGTH(mobile_number) >= 7)
) ENGINE=InnoDB;

CREATE INDEX idx_employee_name ON employees(name);
CREATE INDEX idx_employee_status ON employees(status);
-- Now that employees exists, link users.employee_id -> employees.employee_id
-- (used for 'employee' role logins so a person can see only their own records)
ALTER TABLE users
    ADD CONSTRAINT fk_user_employee
    FOREIGN KEY (employee_id) REFERENCES employees(employee_id)
    ON UPDATE CASCADE ON DELETE SET NULL;

-- ------------------------------------------------------------
-- Table: attendance
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS attendance (
    attendance_id   INT AUTO_INCREMENT PRIMARY KEY,
    employee_id     INT NOT NULL,
    attendance_date DATE NOT NULL,
    check_in_time   TIME NULL,
    check_out_time  TIME NULL,
    status          ENUM('Present', 'Absent', 'Half Day', 'On Leave') NOT NULL DEFAULT 'Present',
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                                ON UPDATE CURRENT_TIMESTAMP,
    marked_by       INT NULL,
    CONSTRAINT fk_attendance_employee
        FOREIGN KEY (employee_id) REFERENCES employees(employee_id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_attendance_marked_by
        FOREIGN KEY (marked_by) REFERENCES users(user_id)
        ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT uq_employee_date UNIQUE (employee_id, attendance_date),
    CONSTRAINT chk_checkout_after_checkin
        CHECK (check_out_time IS NULL OR check_in_time IS NULL OR check_out_time >= check_in_time)
) ENGINE=InnoDB;

CREATE INDEX idx_attendance_date ON attendance(attendance_date);
CREATE INDEX idx_attendance_status ON attendance(status);

-- ------------------------------------------------------------
-- Seed data: departments
-- ------------------------------------------------------------
INSERT INTO departments (name) VALUES
    ('Engineering'), ('Human Resources'), ('Sales'), ('Marketing'), ('Finance')
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- ------------------------------------------------------------
-- Seed data: default admin user
-- password: Admin@123  (hashed by backend/seed.py at setup time)
-- Run `python seed.py` after creating the schema to insert this safely.
-- ------------------------------------------------------------