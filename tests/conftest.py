import pytest
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from main import app, get_db
from database import Base

# Setup an in-memory SQLite database for testing to avoid touching existing data
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

from routers.owner import get_db as get_owner_db
from routers.customer import get_db as get_customer_db
from routers.admin import get_db as get_admin_db
from routers.public import get_db as get_public_db

app.dependency_overrides[get_db] = override_get_db
app.dependency_overrides[get_owner_db] = override_get_db
app.dependency_overrides[get_customer_db] = override_get_db
app.dependency_overrides[get_admin_db] = override_get_db
app.dependency_overrides[get_public_db] = override_get_db

@pytest.fixture(scope="session", autouse=True)
def setup_database():
    # Create the test database tables
    Base.metadata.create_all(bind=engine)
    yield
    # Drop the test database tables when all tests finish
    Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="module")
def client():
    # Create the TestClient for HTTP requests
    with TestClient(app) as c:
        yield c

@pytest.fixture(scope="function")
def db_session():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
