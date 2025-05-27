from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from config import tokens_collection, usages_collection
from datetime import datetime

security = HTTPBearer()

async def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    token_data = tokens_collection.find_one({"token": token})
    if not token_data:
        raise HTTPException(status_code=401, detail="Invalid token")
    return token_data

async def verify_admin_token(token_data: dict = Depends(verify_token)):
    if not token_data.get("isAdmin"):
        raise HTTPException(status_code=403, detail="Admin access required")
    return token_data

async def track_usage(token: str, endpoint: str):
    usages_collection.insert_one({
        "token": token,
        "endpoint": endpoint,
        "timestamp": datetime.utcnow()
    })
