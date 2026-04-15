from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    CAMERA_API_KEY: str
    LOCAL_DEBUG: bool = False
    ALLOWED_ORIGINS: str = "http://localhost:5173,http://localhost:3000,https://smart-saloon.onrender.app"

    model_config = {"env_file": ".env"}

from pydantic_core import ValidationError

try:
    settings = Settings()
except ValidationError as e:
    raise RuntimeError(
        "CRITICAL ERROR: Missing or invalid environment variables. "
        "Ensure DATABASE_URL, SECRET_KEY, and CAMERA_API_KEY are properly set in your .env or server environment."
    ) from e