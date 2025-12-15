#!/bin/bash

# Supply Chain Platform - Quick Start Script
# This script sets up and runs the entire platform locally

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Supply Chain Platform - Quick Start  ${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Check prerequisites
echo -e "${YELLOW}Checking prerequisites...${NC}"

if ! command -v docker &> /dev/null; then
    echo -e "${RED}Docker is not installed. Please install Docker first.${NC}"
    exit 1
fi

if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo -e "${RED}Docker Compose is not installed. Please install Docker Compose first.${NC}"
    exit 1
fi

if ! command -v node &> /dev/null; then
    echo -e "${RED}Node.js is not installed. Please install Node.js first.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ All prerequisites met${NC}"
echo ""

# Setup Backend
echo -e "${YELLOW}Setting up Backend...${NC}"
cd backend

# Create .env if it doesn't exist
if [ ! -f .env ]; then
    echo -e "${YELLOW}Creating .env file from template...${NC}"
    cp env.template .env
    echo -e "${GREEN}✓ .env file created. Please edit it with your API keys.${NC}"
fi

# Check for Firebase service account key
if [ ! -f "services/1-api-gateway/src/config/serviceAccountKey.json" ]; then
    echo -e "${RED}⚠ Warning: serviceAccountKey.json not found in API Gateway${NC}"
    echo -e "${YELLOW}Please download it from Firebase Console and place it in:${NC}"
    echo "  - backend/services/1-api-gateway/src/config/serviceAccountKey.json"
    echo "  - backend/services/6-notification-service/src/config/serviceAccountKey.json"
    echo ""
fi

# Start backend services
echo -e "${YELLOW}Starting backend services with Docker Compose...${NC}"
docker-compose up --build -d

echo -e "${GREEN}✓ Backend services starting...${NC}"
echo ""

# Wait for services to be ready
echo -e "${YELLOW}Waiting for services to be ready...${NC}"
sleep 10

# Check API Gateway health
echo -e "${YELLOW}Checking API Gateway health...${NC}"
for i in {1..30}; do
    if curl -s http://localhost:3000/health > /dev/null; then
        echo -e "${GREEN}✓ API Gateway is healthy${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${RED}⚠ API Gateway health check failed. Check logs with: docker-compose logs -f api-gateway${NC}"
    fi
    sleep 2
done

echo ""

# Setup Frontend
echo -e "${YELLOW}Setting up Frontend...${NC}"
cd ../frontend/Supply-Chain

# Create .env.local if it doesn't exist
if [ ! -f .env.local ]; then
    echo -e "${YELLOW}Creating .env.local file from template...${NC}"
    cp .env.example .env.local
    echo -e "${GREEN}✓ .env.local file created. Please edit it with your Firebase config.${NC}"
fi

# Install dependencies
echo -e "${YELLOW}Installing frontend dependencies...${NC}"
npm install

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Setup Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Backend services are running:"
echo "  - API Gateway:        http://localhost:3000"
echo "  - Inventory Service:  http://localhost:3001"
echo "  - Order Service:      http://localhost:3002"
echo "  - Warehouse Service:  http://localhost:3003"
echo "  - Delivery Service:   http://localhost:3004"
echo "  - Notification:       http://localhost:3005"
echo "  - Forecasting:        http://localhost:8000"
echo "  - Agentic AI:         http://localhost:8001"
echo ""
echo "To start the frontend:"
echo "  cd frontend/Supply-Chain"
echo "  npm run dev"
echo ""
echo "Frontend will be available at: http://localhost:9002"
echo ""
echo "Useful commands:"
echo "  - View logs:     docker-compose logs -f"
echo "  - Stop backend:  docker-compose down"
echo "  - Restart:       docker-compose restart"
echo ""
echo -e "${YELLOW}Don't forget to:${NC}"
echo "  1. Add your Firebase serviceAccountKey.json"
echo "  2. Update .env with your API keys"
echo "  3. Update frontend/.env.local with your Firebase config"
