from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional
from ..forecasting.model import ForecastModel
from ..dto.forecast_dto import ForecastRequest, ForecastResponse, HistoricalDataResponse

router = APIRouter()


def get_forecast_model():
    """Dependency to get ForecastModel instance."""
    return ForecastModel()


# ============================================================================
# LEGACY ENDPOINT (Backward Compatibility)
# ============================================================================

@router.post("/forecast", response_model=dict, tags=["Legacy"])
async def get_forecast_legacy(
    request: ForecastRequest, 
    model: ForecastModel = Depends(get_forecast_model)
):
    """
    Generate a demand forecast (legacy endpoint).
    
    This endpoint maintains backward compatibility with the original API.
    Prefer using /forecast/predict for new integrations.
    """
    try:
        periods = request.periods or request.forecast_horizon or 6
        forecast_results = await model.generate_forecast(
            product_id=request.product_id,
            periods=periods,
            historical_months=request.historical_months or 24
        )
        return forecast_results
    except Exception as e:
        print(f"Forecast error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# NEW ENDPOINTS (Frontend Compatible)
# ============================================================================

@router.post("/forecast/predict", response_model=dict, tags=["Forecasting"])
async def predict_demand(
    request: ForecastRequest, 
    model: ForecastModel = Depends(get_forecast_model)
):
    """
    Generate a demand forecast for a given product.
    
    **Frontend Compatible Endpoint** - Used by forecasting-client.tsx
    
    Returns:
    - forecastedDemand: Array of predicted quantities
    - modelAccuracy: Accuracy score (0-1)
    - confidenceIntervals: Upper and lower bounds for each prediction
    - trend: 'increasing', 'decreasing', or 'stable'
    - seasonality: Whether seasonal patterns were detected
    - insights: Human-readable analysis insights
    """
    try:
        # Get periods from request (supports both naming conventions)
        periods = request.forecast_horizon or request.periods or 6
        historical = request.historical_months or 24
        
        print(f"Predict request: product_id={request.product_id}, periods={periods}, historical={historical}")
        
        forecast_results = await model.generate_forecast(
            product_id=request.product_id,
            periods=periods,
            historical_months=historical
        )
        return forecast_results
        
    except Exception as e:
        print(f"Prediction error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/forecast/historical/{product_id}", response_model=dict, tags=["Forecasting"])
async def get_historical_data(
    product_id: str,
    months: Optional[int] = Query(24, description="Number of months of historical data"),
    model: ForecastModel = Depends(get_forecast_model)
):
    """
    Get historical sales data for a product.
    
    Useful for visualizing historical trends alongside forecasts.
    
    Returns:
    - productId: The requested product ID
    - data: Array of {saleDate, totalQuantity} objects
    - totalRecords: Number of data points
    """
    try:
        data = await model.get_historical_data(product_id, months)
        return data
    except Exception as e:
        print(f"Historical data error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/forecast/products", response_model=dict, tags=["Forecasting"])
async def list_forecastable_products(
    limit: int = Query(50, description="Maximum products to return"),
    model: ForecastModel = Depends(get_forecast_model)
):
    """
    List products that have enough data for forecasting.
    
    Returns products with at least 3 months of sales history.
    """
    try:
        # This would need database access - returning placeholder for now
        return {
            "products": [],
            "message": "Use inventory service to get product list, then forecast individual products"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))