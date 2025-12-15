# Supply Chain Platform - Complete Setup & Deployment Guide

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (Vercel)                        │
│                     Next.js + React + Tailwind                   │
│                         Port: 9002 (local)                       │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    API GATEWAY (Port 3000)                       │
│                    Express.js + Firebase Auth                    │
└────────────────────────────┬────────────────────────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        ▼                    ▼                    ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│   Inventory   │   │    Orders     │   │   Warehouse   │
│   Service     │   │    Service    │   │   Service     │
│  (NestJS)     │   │   (NestJS)    │   │   (NestJS)    │
│  Port: 3001   │   │  Port: 3002   │   │  Port: 3003   │
└───────┬───────┘   └───────┬───────┘   └───────┬───────┘
        │                   │                   │
        └───────────────────┼───────────────────┘
                            ▼
                    ┌───────────────┐
                    │  PostgreSQL   │
                    │   Database    │
                    │  Port: 5432   │
                    └───────────────┘

┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│   Delivery    │   │ Notification  │   │  Forecasting  │
│   Service     │   │   Service     │   │   Service     │
│  (NestJS)     │   │   (NestJS)    │   │  (Python)     │
│  Port: 3004   │   │  Port: 3005   │   │  Port: 8000   │
└───────────────┘   └───────────────┘   └───────────────┘

┌───────────────┐
│  Agentic AI   │
│   Service     │
│  (Python)     │
│  Port: 8001   │
└───────────────┘
```

---

## 📋 Prerequisites

Before starting, ensure you have:

- **Docker Desktop** (v20.0+) - [Download](https://www.docker.com/products/docker-desktop)
- **Node.js** (v18+) - [Download](https://nodejs.org/)
- **Git** - [Download](https://git-scm.com/)
- **Free accounts on**:
  - [Firebase](https://firebase.google.com/) - Authentication
  - [Vercel](https://vercel.com/) - Frontend hosting
  - [Render](https://render.com/) OR [Railway](https://railway.app/) - Backend hosting
  - [Mapbox](https://www.mapbox.com/) - Maps (optional)
  - [Groq](https://groq.com/) - AI API (optional)

---

## 🔧 Part 1: Local Development Setup

### Step 1: Clone and Navigate

```bash
# Navigate to the project
cd retail-supply-chain-platform
```

### Step 2: Set Up Firebase

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project (or use existing)
3. Enable **Authentication** → Sign-in methods → Email/Password
4. Go to **Project Settings** → **Service accounts**
5. Click "Generate new private key" and download the JSON file
6. Rename it to `serviceAccountKey.json`
7. Place copies in:
   - `backend/services/1-api-gateway/src/config/serviceAccountKey.json`
   - `backend/services/6-notification-service/src/config/serviceAccountKey.json`

### Step 3: Configure Backend Environment

```bash
cd backend

# Create .env file from template
cp env.template .env
```

Edit `.env` with your values:

```env
# PostgreSQL Database Configuration
DB_HOST=postgres
DB_PORT=5432
DB_USERNAME=supplychainuser
DB_PASSWORD=supersecretpassword123
DB_NAME=supplychaindb

# Node Environment
NODE_ENV=development

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:9002

# Third-Party API Keys (get from respective services)
SENDGRID_API_KEY=your_sendgrid_key
SENDGRID_FROM_EMAIL=your@email.com
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=+15551234567

# Maps API (Mapbox - get free token)
MAPPING_API_KEY=pk.your_mapbox_public_token

# AI Service (Groq - free tier available)
GROQ_API_KEY=gsk_your_groq_api_key
```

### Step 4: Start Backend with Docker

```bash
# Build and start all services
docker-compose up --build -d

# Check logs
docker-compose logs -f

# Check service health
curl http://localhost:3000/health
```

Expected services:
| Service | Port | Health Check |
|---------|------|--------------|
| API Gateway | 3000 | `http://localhost:3000/health` |
| Inventory | 3001 | `http://localhost:3001/` |
| Orders | 3002 | `http://localhost:3002/` |
| Warehouse | 3003 | `http://localhost:3003/` |
| Delivery | 3004 | `http://localhost:3004/` |
| Notification | 3005 | `http://localhost:3005/` |
| Forecasting | 8000 | `http://localhost:8000/` |
| Agentic AI | 8001 | `http://localhost:8001/` |

### Step 5: Configure Frontend Environment

```bash
cd ../frontend/Supply-Chain

# Create environment file
cp .env.example .env.local
```

Edit `.env.local`:

```env
# Backend API URL (local)
NEXT_PUBLIC_API_URL=http://localhost:3000

# Firebase Configuration (from Firebase Console → Project Settings)
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123

# Mapbox (for maps)
NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ1...
```

### Step 6: Start Frontend

```bash
npm install
npm run dev
```

Frontend will be available at: **http://localhost:9002**

### Step 7: Test the Connection

1. Open http://localhost:9002 in your browser
2. Sign up for a new account
3. Navigate to the Dashboard
4. Check browser console for any API errors

---

## 🚀 Part 2: Deployment to Production

### Option A: Deploy Backend to Render (Recommended - Free Tier)

1. **Create Render Account**: Go to [render.com](https://render.com) and sign up

2. **Create PostgreSQL Database**:
   - Dashboard → New → PostgreSQL
   - Name: `supplychain-db`
   - Plan: Free
   - Save the connection details

3. **Deploy Each Service** (free tier allows multiple services):

   **API Gateway:**
   - New → Web Service
   - Connect your GitHub repo
   - Root Directory: `backend/services/1-api-gateway`
   - Build Command: `npm install`
   - Start Command: `node src/server.js`
   - Add environment variables from `.env`
   - Add `FRONTEND_URL` with your Vercel URL (after deploying frontend)

   **Repeat for other services** with their respective directories.

4. **Alternative: Use render.yaml** (Blueprint):
   - Push the `render.yaml` file to your repo
   - Go to Render Dashboard → Blueprints
   - Connect your repo and deploy all services at once

### Option B: Deploy Backend to Railway

1. **Create Railway Account**: Go to [railway.app](https://railway.app)

2. **Deploy from GitHub**:
   ```bash
   # Install Railway CLI
   npm install -g @railway/cli
   
   # Login
   railway login
   
   # Initialize project
   cd backend
   railway init
   
   # Deploy
   railway up
   ```

3. **Add PostgreSQL**:
   - Railway Dashboard → Add Plugin → PostgreSQL
   - Copy connection string to environment variables

4. **Set Environment Variables** in Railway Dashboard

### Deploy Frontend to Vercel

1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Deploy**:
   ```bash
   cd frontend/Supply-Chain
   
   # Login to Vercel
   vercel login
   
   # Deploy
   vercel
   ```

3. **Configure Environment Variables** in Vercel Dashboard:
   - Go to Project Settings → Environment Variables
   - Add all variables from `.env.local`
   - Update `NEXT_PUBLIC_API_URL` to your Render/Railway backend URL

4. **Redeploy** to apply environment variables:
   ```bash
   vercel --prod
   ```

---

## 🔗 Part 3: Connecting Frontend to Backend

### Update API URLs After Deployment

1. **Get your backend URL** from Render/Railway (e.g., `https://api-gateway-xxxx.onrender.com`)

2. **Update Vercel Environment Variables**:
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Set `NEXT_PUBLIC_API_URL` = `https://your-backend-url.onrender.com`

3. **Update Backend CORS**:
   - In Render/Railway, add environment variable:
   - `FRONTEND_URL` = `https://your-app.vercel.app`

4. **Redeploy both** frontend and backend

### Test Production Connection

```bash
# Test backend health
curl https://your-backend-url.onrender.com/health

# Expected response:
# {"status":"API Gateway is up and running"}
```

---

## 📁 Project File Structure

```
retail-supply-chain-platform/
├── backend/
│   ├── docker-compose.yml       # Local development
│   ├── .env                     # Environment variables
│   ├── render.yaml              # Render deployment config
│   ├── railway.toml             # Railway deployment config
│   ├── Dockerfile.railway       # Single-container deployment
│   ├── supervisord.conf         # Multi-process management
│   └── services/
│       ├── 1-api-gateway/       # Express.js API Gateway
│       ├── 2-inventory-service/ # NestJS Inventory
│       ├── 3-order-service/     # NestJS Orders
│       ├── 4-warehouse-service/ # NestJS Warehouse
│       ├── 5-delivery-service/  # NestJS Delivery
│       ├── 6-notification-service/ # NestJS Notifications
│       ├── 7-forecasting-service/  # Python FastAPI
│       └── 8-agentic-ai-service/   # Python AI Service
│
└── frontend/
    └── Supply-Chain/
        ├── vercel.json          # Vercel deployment config
        ├── .env.example         # Environment template
        ├── .env.local           # Local environment (gitignored)
        └── src/
            ├── lib/
            │   ├── api.ts       # API service layer ⭐ NEW
            │   └── firebase.ts  # Firebase configuration
            ├── hooks/
            │   ├── use-api.ts   # API hooks ⭐ NEW
            │   └── use-toast.ts
            └── app/             # Next.js pages
```

---

## 🛠️ Using the API Service Layer

The new API service layer (`src/lib/api.ts`) provides typed access to all backend services.

### Example: Fetching Inventory

```typescript
import { inventoryApi } from '@/lib/api';
import { useApi } from '@/hooks/use-api';

function InventoryPage() {
  const { data: products, loading, error, refetch } = useApi(
    () => inventoryApi.getAll(),
    []
  );

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <ul>
      {products?.map(product => (
        <li key={product.id}>{product.name} - {product.quantityInStock} units</li>
      ))}
    </ul>
  );
}
```

### Example: Creating an Order

```typescript
import { ordersApi } from '@/lib/api';
import { useMutation } from '@/hooks/use-api';

function CreateOrderForm() {
  const { mutate, loading, error } = useMutation(ordersApi.create);

  const handleSubmit = async (formData) => {
    const order = await mutate({
      customerId: formData.customerId,
      customerName: formData.customerName,
      items: formData.items,
      deliveryType: 'Truck',
    });
    
    if (order) {
      console.log('Order created:', order.id);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* form fields */}
      <button disabled={loading}>
        {loading ? 'Creating...' : 'Create Order'}
      </button>
      {error && <p className="text-red-500">{error}</p>}
    </form>
  );
}
```

### Example: Real-time Polling

```typescript
import { deliveryApi } from '@/lib/api';
import { usePolling } from '@/hooks/use-api';

function LiveDeliveryMap() {
  // Fetch active routes every 5 seconds
  const { data: routes, loading } = usePolling(
    () => deliveryApi.getActiveRoutes(),
    5000,
    true // enabled
  );

  return (
    <Map>
      {routes?.map(route => (
        <Marker 
          key={route.id}
          lat={route.currentLatitude}
          lng={route.currentLongitude}
        />
      ))}
    </Map>
  );
}
```

---

## 🆓 Free Tier Limits

### Render.com Free Tier
- 750 hours/month of compute
- Services spin down after 15 min of inactivity
- Free PostgreSQL with 1GB storage
- Custom domains supported

### Railway Free Tier
- $5 free credit/month
- 512MB RAM per service
- 1GB disk per service
- Free PostgreSQL

### Vercel Free Tier
- Unlimited deployments
- 100GB bandwidth/month
- Serverless functions
- Custom domains

### Tips for Staying Free
1. Use only essential services initially
2. Implement caching to reduce API calls
3. Services sleep on inactivity (first request may be slow)
4. Monitor usage in dashboards

---

## 🐛 Troubleshooting

### Backend won't start
```bash
# Check Docker logs
docker-compose logs -f api-gateway

# Restart all services
docker-compose down && docker-compose up --build
```

### CORS errors in browser
- Ensure `FRONTEND_URL` is set in backend environment
- Check that the URL matches exactly (including https://)

### Firebase auth errors
- Verify `serviceAccountKey.json` is in correct location
- Check Firebase project settings match environment variables

### Database connection fails
- Ensure PostgreSQL container is running
- Check `DB_*` environment variables
- Try: `docker-compose restart postgres`

### Frontend can't reach backend
- Verify `NEXT_PUBLIC_API_URL` is correct
- Check backend is running and healthy
- Look for CORS errors in browser console

---

## 📞 Getting API Keys (Free)

### Firebase (Authentication)
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create project → Authentication → Enable Email/Password
3. Project Settings → General → Your apps → Add web app
4. Copy the config values

### Mapbox (Maps)
1. Go to [Mapbox](https://www.mapbox.com/)
2. Sign up for free account
3. Go to Account → Access tokens
4. Copy default public token

### Groq (AI)
1. Go to [Groq Console](https://console.groq.com/)
2. Sign up for free account
3. Create API key
4. Copy the key

### SendGrid (Email - Optional)
1. Go to [SendGrid](https://sendgrid.com/)
2. Sign up for free (100 emails/day)
3. Create API key in Settings

---

## ✅ Checklist

- [ ] Docker installed and running
- [ ] Firebase project created
- [ ] serviceAccountKey.json placed in both locations
- [ ] Backend .env configured
- [ ] Backend running (`docker-compose up`)
- [ ] Frontend .env.local configured
- [ ] Frontend running (`npm run dev`)
- [ ] Can sign up/login in the app
- [ ] Backend deployed to Render/Railway
- [ ] Frontend deployed to Vercel
- [ ] Environment variables updated for production
- [ ] CORS configured for production URLs
- [ ] Production app working end-to-end

---

## 🎉 You're Done!

Your Supply Chain Platform should now be:
- ✅ Running locally for development
- ✅ Connected frontend to backend
- ✅ Deployed to production (free hosting)

For questions or issues, check the service-specific README files in each service directory.
