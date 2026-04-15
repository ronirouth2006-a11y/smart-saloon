import pytest
from httpx import AsyncClient
import config

@pytest.mark.asyncio
async def test_camera_update_invalid_salon(client: AsyncClient):
    key = config.settings.CAMERA_API_KEY
    # Test with improperly formatted bson ID
    response = await client.post(
        "/camera/update-count",
        json={"saloon_id": "invalid_id_format", "people": 5},
        headers={"x-api-key": key}
    )
    assert response.status_code in (400, 404)

    # Test with non-existent but valid format ID
    response_404 = await client.post(
        "/camera/update-count",
        json={"saloon_id": "603d2bafb5c54e63b321ab12", "people": 5},
        headers={"x-api-key": key}
    )
    assert response_404.status_code == 404
