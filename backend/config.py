import os
from dotenv import load_dotenv
from pymongo import MongoClient
from datetime import datetime

load_dotenv()

client = MongoClient(os.getenv("MONGODB_URI", "mongodb://localhost:27017"))
db = client.image_moderation
tokens_collection = db.tokens
usages_collection = db.usages

def init_admin_token():
    admin_token = os.getenv("ADMIN_TOKEN", "admin-token-123")
    existing_admin = tokens_collection.find_one({"isAdmin": True})
    if not existing_admin:
        tokens_collection.insert_one({
            "token": admin_token,
            "isAdmin": True,
            "createdAt": datetime.utcnow()
        })
        print(f"Admin token initialized: {admin_token}")
