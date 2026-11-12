
from getpass import getpass

from auth import hash_password
from database import SessionLocal, User


# --------------------------------------------------
# CREATE (OR PROMOTE) AN ADMINISTRATOR
# --------------------------------------------------
# Admins cannot sign up on the website. The project team runs:
#   python create_admin.py
# The password is typed but not shown, and is stored only as a hash.

if __name__ == "__main__":
    name = input("Admin name: ").strip()
    email = input("Admin email: ").strip().lower()
    password = getpass("Password (8+ characters, not shown): ")

    if len(password) < 8:
        raise SystemExit("Password must be at least 8 characters.")

    db = SessionLocal()
    user = db.query(User).filter(User.email == email).first()

    if user:
        # The email is already registered: make that account an admin.
        user.role = "admin"
        user.password_hash = hash_password(password)
        print(f"Existing account {email} is now an admin (password updated).")
    else:
        db.add(User(name=name or "Admin", email=email, password_hash=hash_password(password), role="admin"))
        print(f"Admin account {email} created.")

    db.commit()
    db.close()
