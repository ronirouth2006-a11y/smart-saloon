import pytest
import pytest_asyncio
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

os.environ["LOCAL_DEBUG"] = "True"
import config

from httpx import AsyncClient, ASGITransport
from main import app
from mongomock_motor import AsyncMongoMockClient, AsyncMongoMockDatabase
from beanie import init_beanie
from unittest.mock import patch

# Fix beanie list_collection_names mongomock compatibility
original_list_collection_names = AsyncMongoMockDatabase.list_collection_names
async def patched_list_collection_names(self, *args, **kwargs):
    kwargs.pop('authorizedCollections', None)
    kwargs.pop('nameOnly', None)
    return await original_list_collection_names(self, *args, **kwargs)
AsyncMongoMockDatabase.list_collection_names = patched_list_collection_names

async def mock_init_db():
    print("Initializing mock Beanie database...")
    client = AsyncMongoMockClient()
    from models import User, Owner, AdminUser, Saloon, LiveStatus, Analytics, Barber
    await init_beanie(
        database=client.get_database("test_db"),
        document_models=[User, Owner, AdminUser, Saloon, LiveStatus, Analytics, Barber]
    )

@pytest_asyncio.fixture(scope="session", autouse=True)
async def init_mock_db_fixture():
    await mock_init_db()
    with patch("main.init_db", side_effect=mock_init_db):
        yield

@pytest_asyncio.fixture
async def client():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac
