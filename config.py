from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    CAMERA_API_KEY: str
    CLOUDINARY_CLOUD_NAME: str = ""
    CLOUDINARY_API_KEY: str = ""
    CLOUDINARY_API_SECRET: str = ""
    LOCAL_DEBUG: bool = False
    ALLOWED_ORIGINS: str = "http://localhost:5173,http://localhost:3000,https://smart-saloon.onrender.app"

    model_config = {"env_file": ".env"}

from pydantic_core import ValidationError

try:
    settings = Settings()
    # 🌩️ Hardened Production Validation for Cloudinary
    if not settings.LOCAL_DEBUG:
        missing = []
        if not settings.CLOUDINARY_CLOUD_NAME: missing.append("CLOUDINARY_CLOUD_NAME")
        if not settings.CLOUDINARY_API_KEY: missing.append("CLOUDINARY_API_KEY")
        if not settings.CLOUDINARY_API_SECRET: missing.append("CLOUDINARY_API_SECRET")
        
        if missing:
            raise RuntimeError(
                f"CRITICAL CONFIG ERROR: Missing Cloudinary credentials for production: {', '.join(missing)}. "
                "Please add these to your Render environment settings."
            )
        
        # 🌩️ Placeholder Checks for Cloudinary
        placeholders = ["your_cloud_name_here", "your_api_key_here", "your_api_secret_here"]
        if settings.CLOUDINARY_CLOUD_NAME in placeholders:
            raise RuntimeError("CRITICAL CONFIG ERROR: Production is using a placeholder CLOUDINARY_CLOUD_NAME. Please use real credentials.")
        if settings.CLOUDINARY_API_KEY in placeholders:
            raise RuntimeError("CRITICAL CONFIG ERROR: Production is using a placeholder CLOUDINARY_API_KEY. Please use real credentials.")
        if settings.CLOUDINARY_API_SECRET in placeholders:
            raise RuntimeError("CRITICAL CONFIG ERROR: Production is using a placeholder CLOUDINARY_API_SECRET. Please use real credentials.")
        
        # 🔑 Secret Hardening: Block known weak dev tokens in production
        weak_secrets = ["SECRET123", "salon_camera_secret"]
        if settings.SECRET_KEY in weak_secrets or len(settings.SECRET_KEY) < 20:
            raise RuntimeError("CRITICAL SECURITY ERROR: Production is using a weak, default, or too short SECRET_KEY. Please use a strong 32+ character random string.")
        if settings.CAMERA_API_KEY in weak_secrets:
            raise RuntimeError("CRITICAL SECURITY ERROR: Production is using a weak or default CAMERA_API_KEY.")

except ValidationError as e:
    raise RuntimeError(
        "CRITICAL ERROR: Missing or invalid base environment variables. "
        "Ensure DATABASE_URL, SECRET_KEY, and CAMERA_API_KEY are properly set."
    ) from e