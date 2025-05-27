# Image Moderation API

A FastAPI-based image moderation service that automatically detects and blocks harmful or unwanted imagery.

## Features

- Secure REST API with bearer token authentication
- MongoDB integration for token management and usage tracking
- Docker containerization for easy deployment
- Simple web interface for image upload and moderation
- Admin-only token management endpoints

## Prerequisites

- Docker and Docker Compose
- Git

## Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd image-moderation
```

2. Create a `.env` file in the backend directory:
```bash
MONGODB_URI=mongodb://mongodb:27017
```

3. Build and start the containers:
```bash
docker-compose up --build
```

The services will be available at:
- Frontend: http://localhost
- Backend API: http://localhost:7000
- MongoDB: localhost:27017

## API Endpoints

### Authentication Endpoints (Admin Only)

- `POST /auth/tokens` - Create a new token
- `GET /auth/tokens` - List all tokens
- `DELETE /auth/tokens/{token}` - Delete a token

### Moderation Endpoint

- `POST /moderate` - Analyze an uploaded image
  - Requires: Bearer token in Authorization header
  - Body: multipart/form-data with image file

## Usage

1. Access the web interface at http://localhost
2. Set your token in the authentication section
3. Upload an image for moderation
4. View the moderation results

## Development

### Project Structure

```
.
├── backend/
│   ├── main.py
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── index.html
│   ├── styles.css
│   ├── app.js
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```

### Running Tests

```bash
# Run backend tests
cd backend
pytest

# Run frontend tests
cd frontend
npm test
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 