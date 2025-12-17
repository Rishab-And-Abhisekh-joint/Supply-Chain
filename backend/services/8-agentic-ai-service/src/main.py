"""
Agentic AI Service

A multi-agent system for autonomous supply chain optimization.
Provides event analysis, logistics routing, and VRP optimization.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

# Import router
from .api.endpoints import router as agent_router

# Create FastAPI app
app = FastAPI(
    title="Agentic AI Service",
    description="""
    Multi-agent AI system for supply chain optimization.
    
    ## Features
    
    ### Event Analysis
    Analyze event streams to detect anomalies and suspicious patterns.
    - POST `/api/agentic/analyze-events` - Analyze events for anomalies
    
    ### Logistics Optimization
    Calculate optimal routes between locations.
    - POST `/api/agentic/logistics/optimize` - Get optimized route
    
    ### Last-Mile Delivery Optimization
    Solve Vehicle Routing Problem (VRP) for optimal delivery routes.
    - POST `/api/agentic/optimize-last-mile` - Optimize delivery routes
    
    ## Frontend Integration
    
    This service integrates with:
    - `operations-client.tsx` via `/analyze-events`
    - `logistics-client.tsx` via `/logistics/optimize`
    
    ## Environment Variables
    
    - `GROQ_API_KEY` - For AI model access (optional)
    - `MAPPING_API_KEY` - Mapbox API key for routing
    - `ORDER_SERVICE_URL` - Order service URL for VRP
    - `DELIVERY_SERVICE_URL` - Delivery service URL for dispatch
    """,
    version="1.0.0",
    docs_url="/api-docs",
    redoc_url="/redoc"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://supply-chain-orcin.vercel.app",
        "http://localhost:3000",
        "http://localhost:5173",
        os.getenv("FRONTEND_URL", ""),
        "*"  # Allow all for development
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount routes at BOTH prefixes for compatibility
# Legacy prefix (original API)
app.include_router(agent_router, prefix="/api/v1", tags=["Legacy API"])

# New prefix (frontend expects this)
app.include_router(agent_router, prefix="/api/agentic", tags=["Agentic AI"])


@app.get("/health", tags=["Health"])
def health_check():
    """
    Health check endpoint for monitoring and load balancers.
    """
    return {
        "status": "healthy",
        "service": "agentic-ai-service",
        "version": "1.0.0"
    }


@app.get("/", tags=["Health"])
def root():
    """
    Root endpoint with service information.
    """
    return {
        "service": "Agentic AI Service",
        "version": "1.0.0",
        "description": "Multi-agent system for supply chain optimization",
        "docs": "/api-docs",
        "health": "/health",
        "endpoints": {
            "analyze_events": "POST /api/agentic/analyze-events",
            "logistics_optimize": "POST /api/agentic/logistics/optimize",
            "last_mile": "POST /api/agentic/optimize-last-mile",
            "status": "GET /api/agentic/status"
        }
    }