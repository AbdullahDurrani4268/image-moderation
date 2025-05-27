from fastapi import APIRouter, Depends, HTTPException
import os
from datetime import datetime
from config import tokens_collection
from dependencies import verify_admin_token, track_usage

auth_router = APIRouter()

@auth_router.post("/tokens")
async def create_token(token_data: dict = Depends(verify_admin_token)):
    new_token = {
        "token": os.urandom(32).hex(),
        "isAdmin": False,
        "createdAt": datetime.utcnow()
    }
    tokens_collection.insert_one(new_token)
    await track_usage(token_data["token"], "/auth/tokens")
    return {"token": new_token["token"]}

@auth_router.get("/tokens")
async def list_tokens(token_data: dict = Depends(verify_admin_token)):
    tokens = list(tokens_collection.find({}, {"_id": 0}))
    await track_usage(token_data["token"], "/auth/tokens")
    return tokens

@auth_router.delete("/tokens/{token}")
async def delete_token(token: str, token_data: dict = Depends(verify_admin_token)):
    result = tokens_collection.delete_one({"token": token})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Token not found")
    await track_usage(token_data["token"], f"/auth/tokens/{token}")
    return {"message": "Token deleted successfully"}
