import pytest

def test_get_nearby_salons(client):
    response = client.get(
        "/public/salons/nearby",
        params={
            "user_lat": 22.5726,
            "user_lon": 88.3639
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
