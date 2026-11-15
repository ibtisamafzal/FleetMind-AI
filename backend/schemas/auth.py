from pydantic import BaseModel
from typing import Optional

class LoginRequest(BaseModel):
    email: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_name: str
    role: str
    email: str

class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str
    role: str

    class Config:
        from_attributes = True
