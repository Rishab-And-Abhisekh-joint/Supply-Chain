from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .api.endpoints import router as forecast_router

app = FastAPI(
    title="Forecasting Service",
    description="""
    Demand forecasting service using SARIMAX statistical models.
    
    ## Features
    - Time series forecasting with confidence intervals
    - Automatic trend detection
    - Seasonality analysis
    - Human-readable insights
    
    ## Endpoints
    - `POST /api/forecast/predict` - Generate demand forecast (frontend compatible)
    - `POST /api/forecast` - Legacy forecast endpoint
    - `GET /api/forecast/historical/{product_id}` - Get historical sales data
    
    ## Frontend Integration
    This service is designed to work with the Supply Chain frontend's 
    `forecasting-client.tsx` component.
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
        "*"  # Allow all for development
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(forecast_router, prefix="/api", tags=["forecasting"])


@app.get("/health", tags=["Health"])
def health_check():
    """
    Health check endpoint for monitoring and load balancers.
    """
    return {
        "status": "healthy",
        "service": "forecasting-service",
        "version": "1.0.0"
    }


@app.get("/", tags=["Health"])
def root():
    """
    Root endpoint with service information.
    """
    return {
        "service": "Forecasting Service",
        "version": "1.0.0",
        "docs": "/api-docs",
        "health": "/health",
        "endpoints": {
            "predict": "POST /api/forecast/predict",
            "historical": "GET /api/forecast/historical/{product_id}",
            "legacy": "POST /api/forecast"
        }
    }