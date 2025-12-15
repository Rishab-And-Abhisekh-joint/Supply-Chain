from fastapi import FastAPI
from .api.endpoints import router as forecast_router

app = FastAPI(
    title="Forecasting Service",
    description="A service to provide demand forecasting using SARIMAX.",
    version="1.0.0",
)

app.include_router(forecast_router, prefix="/api", tags=["forecasting"])

@app.get("/health")
def read_root():
    return {"status": "Forecasting Service is up and running"} 