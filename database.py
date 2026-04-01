from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from config import settings
import os

# Priority to env var (for Heroku/Render Postgres), fallback to local configuration
DB_URL = os.getenv("DATABASE_URL", settings.DATABASE_URL)

# Dynamic Engine Creation supporting both local SQLite and Production PostgreSQL
if DB_URL.startswith("sqlite"):
    engine = create_engine(DB_URL, connect_args={"check_same_thread": False})
else:
    # Some cloud providers use postgres:// instead of postgresql://
    if DB_URL.startswith("postgres://"):
        DB_URL = DB_URL.replace("postgres://", "postgresql://", 1)
        
    engine = create_engine(
        DB_URL, 
        pool_size=10, 
        max_overflow=20,
        pool_pre_ping=True
    )

SessionLocal = sessionmaker(
    bind=engine,
    autoflush=False,
    autocommit=False
)

Base = declarative_base()