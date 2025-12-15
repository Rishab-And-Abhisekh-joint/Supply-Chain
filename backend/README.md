# Supply Chain AI - Backend Microservices

This directory contains all the backend microservices for the Supply Chain AI platform. The architecture is based on a microservices pattern, with each service responsible for a specific business domain.

## Prerequisites

- Docker and Docker Compose
- Node.js (for individual service development if needed)
- An AI-assisted IDE like Cursor is recommended.

## First-Time Setup

1.  **Create Environment File**: In this `backend` directory, create a file named `.env`.
2.  **Copy Contents**: Copy the contents from the `env.template` file into your new `.env` file.
3.  **Fill in Secrets**: Replace the placeholder values (like `YOUR_SENDGRID_API_KEY`, `YOUR_GROQ_API_KEY`, etc.) with your actual secret keys from the respective services.
4.  **Place Service Account Key**:
    - Go to your Firebase Project Settings -> Service accounts and generate a new private key.
    - Rename the downloaded JSON file to `serviceAccountKey.json`.
    - Place this file inside `backend/services/1-api-gateway/src/config/`.
    - Place a copy of it inside `backend/services/6-notification-service/src/config/`.

## Running the Entire Backend

To run all services together for local development, use Docker Compose from the root `backend` directory:

```bash
# Build and start all services in detached mode
docker-compose up --build -d
```

This command will:
-   Start a PostgreSQL database container.
-   Build and start all 8 microservice containers.
-   Connect them all to a shared Docker network.

### Checking Service Status

To see the logs for all running containers:
```bash
docker-compose logs -f
```

To see the logs for a specific service (e.g., the API Gateway):
```bash
docker-compose logs -f api-gateway
```

### Stopping the Backend

To stop all services and remove the containers:
```bash
docker-compose down
```

To stop the services without removing the containers:
```bash
docker-compose stop
```

 