import pytest
from auth import hash_password, verify_password

def test_long_password_hashing():
    # A massive password that would crash bcrypt directly because > 72 chars
    massive_password = "a" * 150
    
    # Assert that this doesn't throw a ValueError anymore
    hashed = hash_password(massive_password)
    
    # Assert it generates a string back
    assert isinstance(hashed, str)
    assert len(hashed) > 0

    # Ensure normal passwords verify correctly
    normal_password = "SuperSecurePassword123"
    normal_hashed = hash_password(normal_password)
    assert verify_password(normal_password, normal_hashed) is True

    # Ensure massive passwords verify correctly
    assert verify_password(massive_password, hashed) is True

    # Ensure bad password fails
    assert verify_password("wrongpassword", normal_hashed) is False
