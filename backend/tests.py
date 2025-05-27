import requests

BASE_URL = "http://localhost:7000"

# Replace this with your actual admin token (from .env or printed in logs)
ADMIN_TOKEN = "admin-token-123"

def create_token():
    url = f"{BASE_URL}/auth/tokens"
    headers = {"Authorization": f"Bearer {ADMIN_TOKEN}"}
    response = requests.post(url, headers=headers)
    if response.ok:
        token = response.json()["token"]
        print(f"[✓] New token created: {token}")
        return token
    else:
        print(f"[✗] Token creation failed: {response.status_code} {response.text}")
        return None

def list_tokens():
    url = f"{BASE_URL}/auth/tokens"
    headers = {"Authorization": f"Bearer {ADMIN_TOKEN}"}
    response = requests.get(url, headers=headers)
    if response.ok:
        tokens = response.json()
        print(f"[✓] Retrieved {len(tokens)} tokens")
        for token in tokens:
            print(token)
    else:
        print(f"[✗] Token list failed: {response.status_code} {response.text}")

def moderate_image(token: str, image_path: str):
    url = f"{BASE_URL}/moderate"
    headers = {"Authorization": f"Bearer {token}"}
    files = {"file": open(image_path, "rb")}
    response = requests.post(url, headers=headers, files=files)
    if response.ok:
        result = response.json()
        print("[✓] Image Moderation Result:")
        print(f"  Safe: {result['is_safe']}")
        print(f"  Reason: {result['reason']}")
        print(f"  NSFW Score: {result['analysis']['nsfw']['score']}")
    else:
        print(f"[✗] Image moderation failed: {response.status_code} {response.text}")

if __name__ == "__main__":
    print("\n--- STEP 1: Create User Token ---")
    user_token = create_token()

    print("\n--- STEP 2: List All Tokens (Admin) ---")
    list_tokens()

    if user_token:
        print("\n--- STEP 3: Moderate Image (Auth Required) ---")
        sample_image_path = "sample.jpg"  # Replace with a real image file path
        moderate_image(user_token, sample_image_path)
