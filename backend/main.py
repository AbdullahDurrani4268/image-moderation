from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config import init_admin_token
from auth import auth_router
from moderation import moderation_router

app = FastAPI(title="Image Moderation API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

init_admin_token()

app.include_router(auth_router, prefix="/auth")
app.include_router(moderation_router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=7000)
