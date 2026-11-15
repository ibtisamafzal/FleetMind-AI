import hashlib
from datetime import datetime, timedelta
import jwt
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.config import settings
from backend.models import User
from backend.schemas.auth import LoginRequest, TokenResponse, UserResponse

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return hashlib.sha256(plain_password.encode("utf-8")).hexdigest() == hashed_password

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)

@router.post("/login", response_model=TokenResponse)
def login(creds: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == creds.email).first()
    if not user or not verify_password(creds.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    token = create_access_token({"sub": user.email, "role": user.role, "name": user.full_name})
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user_name=user.full_name,
        role=user.role,
        email=user.email
    )

@router.get("/me")
def get_current_user(email: str = "manager@fleetmind.ai", db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == email).first()
    if not user:
        return {"email": "manager@fleetmind.ai", "full_name": "Fleet Manager", "role": "Fleet Manager"}
    return {"id": user.id, "email": user.email, "full_name": user.full_name, "role": user.role}
