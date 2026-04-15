import pytest

@pytest.mark.asyncio
async def test_customer_register(client):
    response = await client.post(
        "/customer/register",
        json={
            "name": "Test Customer",
            "email": "customer@example.com",
            "password": "customerpassword123"
        }
    )
    assert response.status_code == 200
    assert "successfully" in response.json()["message"]

@pytest.mark.asyncio
async def test_customer_login(client):
    response = await client.post(
        "/customer/login",
        json={
            "email": "customer@example.com",
            "password": "customerpassword123"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "favorites" in data

@pytest.mark.asyncio
async def test_customer_login_fails(client):
    response = await client.post(
        "/customer/login",
        json={
            "email": "customer@example.com",
            "password": "wrongpassword"
        }
    )
    assert response.status_code == 401

@pytest.mark.asyncio
async def test_customer_sync_favorites(client):
    # First login to get a token
    login_response = await client.post(
        "/customer/login",
        json={
            "email": "customer@example.com",
            "password": "customerpassword123"
        }
    )
    token = login_response.json()["access_token"]

    # Since we test database is fresh, there are no salons populated. 
    # But we can test passing an empty list or missing salon ID to see if it gracefully accepts the sync array.
    sync_response = await client.post(
        "/customer/favorites/sync",
        json={"salon_ids": []},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert sync_response.status_code == 200
    assert sync_response.json()["favorites"] == []
