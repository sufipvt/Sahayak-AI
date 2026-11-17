
from datetime import datetime, timezone

from sqlalchemy import (
    JSON, Boolean, Column, DateTime, Float, ForeignKey, Integer, String, Text,
    UniqueConstraint, create_engine,
)
from sqlalchemy.orm import declarative_base, relationship, sessionmaker

from load_document import PROJECT_ROOT


# --------------------------------------------------
# 1. CONNECT TO SQLITE
# --------------------------------------------------
# SQLite keeps the whole database in one file: sahayak.db
# (in .gitignore, because it holds personal data).

DATABASE_FILE = PROJECT_ROOT / "sahayak.db"

engine = create_engine(
    f"sqlite:///{DATABASE_FILE}",
    connect_args={"check_same_thread": False},  # FastAPI uses several threads
)

SessionLocal = sessionmaker(bind=engine)
Base = declarative_base()


def now():
    return datetime.now(timezone.utc)


# --------------------------------------------------
# 2. THE TABLES
# --------------------------------------------------

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)
    email = Column(String(200), unique=True, nullable=False)
    password_hash = Column(String(100), nullable=False)   # never the real password
    role = Column(String(20), default="user")              # "user" or "admin"
    created_at = Column(DateTime, default=now)


class Profile(Base):
    """A user's saved profile. Stored only if the user gave consent."""
    __tablename__ = "profiles"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    data = Column(JSON, default=dict)        # {"age": 20, "state": "Haryana", ...}
    consent = Column(Boolean, default=False)
    updated_at = Column(DateTime, default=now, onupdate=now)


class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(200))              # the first question, shortened
    created_at = Column(DateTime, default=now)
    updated_at = Column(DateTime, default=now, onupdate=now)

    messages = relationship(
        "Message", cascade="all, delete-orphan", order_by="Message.id"
    )


class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True)
    conversation_id = Column(Integer, ForeignKey("conversations.id"), nullable=False)
    role = Column(String(20))                # "user" or "assistant"
    content = Column(Text)
    sources = Column(JSON, default=list)     # citations of an answer
    rating = Column(Integer, nullable=True)  # 1 = helpful, -1 = not helpful
    created_at = Column(DateTime, default=now)


class SavedScheme(Base):
    __tablename__ = "saved_schemes"
    __table_args__ = (UniqueConstraint("user_id", "scheme_id"),)

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    scheme_id = Column(String(50), nullable=False)
    created_at = Column(DateTime, default=now)


class ServiceCentre(Base):
    """A Common Services Centre or office added by an admin
    (OpenStreetMap has almost no CSCs, so the team adds them by hand
    from the official CSC locator)."""
    __tablename__ = "service_centres"

    id = Column(Integer, primary_key=True)
    name = Column(String(200), nullable=False)
    centre_type = Column(String(100), default="Common Services Centre")
    address = Column(String(300))
    phone = Column(String(50))
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    created_at = Column(DateTime, default=now)


# Create the tables if they don't exist yet.
Base.metadata.create_all(engine)


# --------------------------------------------------
# 3. ONE DATABASE SESSION PER REQUEST
# --------------------------------------------------
# FastAPI calls this for every request that needs the database,
# and closes the session when the request is finished.

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
