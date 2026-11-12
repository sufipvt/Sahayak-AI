
import os
import re
from datetime import datetime, timedelta, timezone

import bcrypt
import jwt
from dotenv import load_dotenv
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import User, get_db

load_dotenv()


# --------------------------------------------------
# 1. SETTINGS
# --------------------------------------------------
# JWT_SECRET signs the login tokens. It lives in .env and must stay secret:
# anyone who knows it could create a token for any user.

JWT_SECRET = os.getenv("JWT_SECRET")
if not JWT_SECRET:
    raise RuntimeError("Add JWT_SECRET=<a long random text> to the .env file.")

TOKEN_DAYS = 7


# --------------------------------------------------
# 2. PASSWORDS (SALTED HASHES)
# --------------------------------------------------
# bcrypt adds a random "salt" and hashes the password. We store only the
# hash, so even we cannot read a user's password.

def hash_password(password):
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def check_password(password, password_hash):
    return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))


# --------------------------------------------------
# 3. LOGIN TOKENS (JWT)
# --------------------------------------------------
# After login, the user gets a signed token. The browser sends it with
# every request ("Authorization: Bearer <token>"), so we know who it is.

def create_token(user):
    payload = {
        "sub": str(user.id),
        "role": user.role,
        "exp": datetime.now(timezone.utc) + timedelta(days=TOKEN_DAYS),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")


def read_token(token):
    """Return the user id inside the token, or None if it is invalid/expired."""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        return int(payload["sub"])
    except jwt.PyJWTError:
        return None


# --------------------------------------------------
# 4. WHO IS MAKING THE REQUEST?
# --------------------------------------------------
# Endpoints use these with Depends(...):
#   get_optional_user -> the user, or None for a guest
#   get_current_user  -> the user, or error 401 (must be logged in)
#   require_admin     -> the user, or error 403 (must be an admin)

bearer = HTTPBearer(auto_error=False)


def get_optional_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer),
    db: Session = Depends(get_db),
):
    if credentials is None:
        return None

    user_id = read_token(credentials.credentials)
    if user_id is None:
        raise HTTPException(status_code=401, detail="Your login has expired. Please log in again.")

    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=401, detail="Account not found. Please log in again.")

    return user


def get_current_user(user: User = Depends(get_optional_user)):
    if user is None:
        raise HTTPException(status_code=401, detail="Please log in first.")
    return user


def require_admin(user: User = Depends(get_current_user)):
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Only administrators can do this.")
    return user


# --------------------------------------------------
# 5. ENDPOINTS: REGISTER, LOGIN, ME
# --------------------------------------------------

router = APIRouter(prefix="/api/auth")


class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str


class LoginRequest(BaseModel):
    email: str
    password: str


def user_info(user):
    return {"id": user.id, "name": user.name, "email": user.email, "role": user.role}


@router.post("/register")
def register(request: RegisterRequest, db: Session = Depends(get_db)):
    email = request.email.strip().lower()
    name = request.name.strip()

    # Simple checks with clear messages.
    if not name:
        raise HTTPException(status_code=400, detail="Please enter your name.")
    if not re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", email):
        raise HTTPException(status_code=400, detail="Please enter a valid email address.")
    # bcrypt can only use the first 72 bytes of a password.
    if len(request.password) < 8 or len(request.password.encode("utf-8")) > 72:
        raise HTTPException(status_code=400, detail="Password must be 8 to 72 characters long.")
    if db.query(User).filter(User.email == email).first():
        raise HTTPException(status_code=400, detail="An account with this email already exists.")

    # New accounts are always normal users. Admins are made with create_admin.py.
    user = User(name=name, email=email, password_hash=hash_password(request.password), role="user")
    db.add(user)
    db.commit()

    return {"token": create_token(user), "user": user_info(user)}


@router.post("/login")
def login(request: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == request.email.strip().lower()).first()

    # Same message for "no such email" and "wrong password", so nobody can
    # find out which emails are registered.
    if user is None or not check_password(request.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Wrong email or password.")

    return {"token": create_token(user), "user": user_info(user)}


@router.get("/me")
def me(user: User = Depends(get_current_user)):
    return user_info(user)
