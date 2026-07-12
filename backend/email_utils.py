import smtplib
import ssl
from email.mime.text import MIMEText

from flask import current_app


def send_email(to_email, subject, body):
    """
    Send a plain-text email via SMTP (Gmail by default).
    Returns True on success, raises an Exception on failure so callers
    can decide how to report it to the user.
    """
    mail_username = current_app.config["MAIL_USERNAME"]
    mail_password = current_app.config["MAIL_PASSWORD"]
    mail_server = current_app.config["MAIL_SERVER"]
    mail_port = current_app.config["MAIL_PORT"]

    if not mail_username or not mail_password:
        raise RuntimeError(
            "Email is not configured. Set MAIL_USERNAME and MAIL_PASSWORD in backend/.env"
        )

    msg = MIMEText(body)
    msg["Subject"] = subject
    msg["From"] = mail_username
    msg["To"] = to_email

    context = ssl.create_default_context()
    with smtplib.SMTP(mail_server, mail_port) as server:
        server.starttls(context=context)
        server.login(mail_username, mail_password)
        server.sendmail(mail_username, [to_email], msg.as_string())

    return True