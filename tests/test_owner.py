import pytest

# Test the core registration and login logic
def test_owner_register(client):
    response = client.post(
        "/owner/register",
        json={
            "owner_name": "Test Owner",
            "email": "testowner@example.com",
            "password": "supersecurepassword123",
            "salon_name": "Test Salon",
            "phone": "9876543210",
            "latitude": 22.5726,
            "longitude": 88.3639
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "Registration Successful" in data["message"]
    assert "salon_id" in data

def test_owner_login(client, db_session):
    # Approve salon first since test_owner_register doesn't auto-approve
    from models import Owner, Saloon
    owner = db_session.query(Owner).filter(Owner.email == "testowner@example.com").first()
    salon = db_session.query(Saloon).filter(Saloon.owner_id == owner.id).first()
    if salon:
        salon.is_approved = True
        db_session.commit()

    response = client.post(
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

def test_login_invalid_password(client):
    response = client.post(
        "/owner/login",
        json={
            "email": "testowner@example.com",
            "password": "wrongpassword"
        }
    )
    assert response.status_code == 401

def test_owner_protected_route(client, db_session):
    # Ensure it's approved
    from models import Owner, Saloon
    owner = db_session.query(Owner).filter(Owner.email == "testowner@example.com").first()
    if owner:
        salon = db_session.query(Saloon).filter(Saloon.owner_id == owner.id).first()
        if salon:
            salon.is_approved = True
            db_session.commit()

    # First login to get a token
    login_response = client.post(
        "/owner/login",
        json={
            "email": "testowner@example.com",
            "password": "supersecurepassword123"
        }
    )
    token = login_response.json()["access_token"]

    # Now toggle status using the bearer token
    toggle_response = client.put(
        "/owner/toggle-status",
        json={"is_active": False},
        headers={"Authorization": f"Bearer {token}"}
    )
    
    assert toggle_response.status_code == 200
    assert toggle_response.json()["active"] is False
