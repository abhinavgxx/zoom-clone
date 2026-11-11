from dotenv import load_dotenv

load_dotenv()
import os

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# Use Neon PostgreSQL when DATABASE_URL is configured.
# Otherwise, fall back to local SQLite for development.
SQLALCHEMY_DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "sqlite:///./zoom_clone.db"
)

# Use the psycopg 3 driver for PostgreSQL.
if SQLALCHEMY_DATABASE_URL.startswith("postgres://"):
    SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace(
        "postgres://", "postgresql+psycopg://", 1
    )
elif SQLALCHEMY_DATABASE_URL.startswith("postgresql://"):
    SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace(
        "postgresql://", "postgresql+psycopg://", 1
    )

# SQLite requires a special connection argument.
connect_args = (
    {"check_same_thread": False}
    if SQLALCHEMY_DATABASE_URL.startswith("sqlite")
    else {}
)

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args=connect_args,
    pool_pre_ping=True
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
