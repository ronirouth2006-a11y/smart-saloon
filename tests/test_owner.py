import pytest
from models import Owner, Saloon

# Test the core registration and login logic
@pytest.mark.asyncio
async def test_owner_register(client):
    response = await client.post(
        "/owner/register",
        json={
            "owner_name": "Test Owner",
            "email": "testowner@example.com",
            "password": "supersecurepassword123",
            "salon_name": "Test Salon",
            "phone": "9876543210",
            "latitude": 22.5726,
            "longitude": 88.3639,
            "location": "Test Location"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "Registration Successful" in data["message"]
    assert "salon_id" in data

@pytest.mark.asyncio
async def test_owner_login(client):
    # Approve salon first since test_owner_register doesn't auto-approve
    owner = await Owner.find_one(Owner.email == "testowner@example.com")
    salon = await Saloon.find_one(Saloon.owner_id == str(owner.id))
    if salon:
        salon.is_approved = True
        await salon.save()

    response = await client.post(
        "/owner/login",
        json={
            "email": "testowner@example.com",
            "password": "supersecurepassword123"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"

@pytest.mark.asyncio
async def test_login_invalid_password(client):
    response = await client.post(
        "/owner/login",
        json={
            "email": "testowner@example.com",
            "password": "wrongpassword"
        }
    )
    assert response.status_code == 401

@pytest.mark.asyncio
async def test_owner_protected_route(client):
    # First login to get a token
    login_response = await client.post(
        "/owner/login",
        json={
            "email": "testowner@example.com",
            "password": "supersecurepassword123"
        }
    )
    token = login_response.json()["access_token"]

    # Now toggle status using the bearer token
    toggle_response = await client.put(
        "/owner/toggle-status",
        json={"is_active": False},
        headers={"Authorization": f"Bearer {token}"}
    )
    
    assert toggle_response.status_code == 200
    assert toggle_response.json()["active"] is False

@pytest.mark.asyncio
async def test_owner_route_rejects_customer_token(client):
    # Register and login a customer
    await client.post("/customer/register", json={"name": "Cust", "email": "cust_owner@example.com", "password": "pass"})
    cust_login = await client.post("/customer/login", json={"email": "cust_owner@example.com", "password": "pass"})
    cust_token = cust_login.json()["access_token"]

    # Attempt to toggle status (Owner route)
    resp = await client.put("/owner/toggle-status", json={"is_active": True}, headers={"Authorization": f"Bearer {cust_token}"})
    assert resp.status_code == 401
