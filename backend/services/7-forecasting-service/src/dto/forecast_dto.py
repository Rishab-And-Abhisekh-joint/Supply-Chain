from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from enum import Enum


class TrendType(str, Enum):
    INCREASING = "increasing"
    DECREASING = "decreasing"
    STABLE = "stable"


class ForecastRequest(BaseModel):
    """
    Request model for demand forecasting.
    Supports both camelCase (frontend) and snake_case (backend) naming.
    """
    product_id: str = Field(..., alias="productId", description="Product ID to forecast")
    product_name: Optional[str] = Field(None, alias="productName", description="Product name (optional)")
    historical_months: Optional[int] = Field(12, alias="historicalMonths", description="Months of historical data to use")
    forecast_horizon: Optional[int] = Field(6, alias="forecastHorizon", description="Number of periods to forecast")
    
    # Backward compatibility with old API
    periods: Optional[int] = Field(None, description="Legacy: Number of periods to forecast")
    
    class Config:
        populate_by_name = True
        json_schema_extra = {
            "example": {
                "productId": "PROD-12345",
                "productName": "Widget A",
                "historicalMonths": 12,
                "forecastHorizon": 6
            }
        }


class ConfidenceInterval(BaseModel):
    """Confidence interval for a forecast point."""
    lower_bound: float = Field(..., alias="lowerBound")
    upper_bound: float = Field(..., alias="upperBound")
    
    class Config:
        populate_by_name = True


class ForecastResponse(BaseModel):
    """
    Response model for demand forecasting.
    Matches frontend ForecastResult interface exactly.
    """
    forecasted_demand: List[int] = Field(..., alias="forecastedDemand", description="Predicted demand values")
    model_accuracy: float = Field(..., alias="modelAccuracy", description="Model accuracy (0-1)")
    confidence_intervals: List[ConfidenceInterval] = Field(..., alias="confidenceIntervals", description="Confidence intervals for each prediction")
    trend: Optional[TrendType] = Field(None, description="Demand trend direction")
    seasonality: Optional[bool] = Field(None, description="Whether seasonality is detected")
    insights: Optional[List[str]] = Field(None, description="Human-readable insights")
    
    # Additional data for debugging/advanced use
    raw_forecast: Optional[List[Dict[str, Any]]] = Field(None, alias="rawForecast", description="Raw forecast data with dates")
    
    class Config:
        populate_by_name = True
        json_schema_extra = {
            "example": {
                "forecastedDemand": [120, 135, 142, 138, 145, 150],
                "modelAccuracy": 0.87,
                "confidenceIntervals": [
                    {"lowerBound": 100, "upperBound": 140},
                    {"lowerBound": 115, "upperBound": 155}
                ],
                "trend": "increasing",
                "seasonality": True,
                "insights": [
                    "Demand is projected to increase over the forecast period.",
                    "Strong seasonal patterns detected."
                ]
            }
        }


class HistoricalDataPoint(BaseModel):
    """Single historical data point."""
    date: str = Field(..., alias="saleDate")
    quantity: int = Field(..., alias="totalQuantity")
    
    class Config:
        populate_by_name = True


class HistoricalDataResponse(BaseModel):
    """Response for historical data request."""
    product_id: str = Field(..., alias="productId")
    data: List[Dict[str, Any]]
    total_records: int = Field(..., alias="totalRecords")
    
    class Config:
        populate_by_name = True


class ForecastLegacyResponse(BaseModel):
    """Legacy response format for backward compatibility."""
    product_id: str
    forecast: List[Dict[str, Any]]