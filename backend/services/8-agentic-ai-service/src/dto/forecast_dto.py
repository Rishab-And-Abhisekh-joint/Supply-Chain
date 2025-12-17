from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


class ForecastType(str, Enum):
    DEMAND = "demand"
    INVENTORY = "inventory"
    SALES = "sales"
    CAPACITY = "capacity"


class ForecastRequest(BaseModel):
    """Request model for generating forecasts"""
    
    product_id: Optional[str] = Field(None, description="Product ID to forecast")
    warehouse_id: Optional[str] = Field(None, description="Warehouse ID for location-specific forecast")
    forecast_type: ForecastType = Field(default=ForecastType.DEMAND, description="Type of forecast")
    horizon_days: int = Field(default=30, ge=1, le=365, description="Number of days to forecast")
    include_confidence_interval: bool = Field(default=True, description="Include confidence intervals")
    confidence_level: float = Field(default=0.95, ge=0.5, le=0.99, description="Confidence level (0.5-0.99)")
    
    class Config:
        json_schema_extra = {
            "example": {
                "product_id": "prod-123",
                "warehouse_id": "wh-456",
                "forecast_type": "demand",
                "horizon_days": 30,
                "include_confidence_interval": True,
                "confidence_level": 0.95
            }
        }


class ForecastDataPoint(BaseModel):
    """Single forecast data point"""
    
    date: datetime
    value: float
    lower_bound: Optional[float] = None
    upper_bound: Optional[float] = None


class ForecastResponse(BaseModel):
    """Response model for forecast results"""
    
    forecast_id: str = Field(..., description="Unique forecast identifier")
    product_id: Optional[str] = None
    warehouse_id: Optional[str] = None
    forecast_type: ForecastType
    generated_at: datetime
    horizon_days: int
    model_used: str = Field(..., description="ML model used for forecasting")
    confidence_level: Optional[float] = None
    
    # Forecast results
    predictions: List[ForecastDataPoint]
    
    # Model metrics
    mae: Optional[float] = Field(None, description="Mean Absolute Error")
    rmse: Optional[float] = Field(None, description="Root Mean Square Error")
    mape: Optional[float] = Field(None, description="Mean Absolute Percentage Error")
    
    # Summary statistics
    total_predicted: float = Field(..., description="Sum of all predicted values")
    average_daily: float = Field(..., description="Average daily prediction")
    peak_value: float = Field(..., description="Maximum predicted value")
    peak_date: datetime = Field(..., description="Date of peak prediction")
    
    class Config:
        json_schema_extra = {
            "example": {
                "forecast_id": "fc-789",
                "product_id": "prod-123",
                "forecast_type": "demand",
                "generated_at": "2024-01-15T10:30:00Z",
                "horizon_days": 30,
                "model_used": "prophet",
                "predictions": [
                    {"date": "2024-01-16", "value": 150, "lower_bound": 120, "upper_bound": 180}
                ],
                "total_predicted": 4500,
                "average_daily": 150,
                "peak_value": 200,
                "peak_date": "2024-02-01"
            }
        }


class HistoricalDataPoint(BaseModel):
    """Single historical data point"""
    
    date: datetime
    value: float
    product_id: Optional[str] = None
    warehouse_id: Optional[str] = None


class HistoricalDataResponse(BaseModel):
    """Response model for historical data retrieval"""
    
    product_id: Optional[str] = None
    warehouse_id: Optional[str] = None
    data_type: str
    start_date: datetime
    end_date: datetime
    total_records: int
    
    data_points: List[HistoricalDataPoint]
    
    # Summary statistics
    total_value: float
    average_value: float
    min_value: float
    max_value: float
    std_deviation: Optional[float] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "product_id": "prod-123",
                "data_type": "sales",
                "start_date": "2023-01-01",
                "end_date": "2024-01-01",
                "total_records": 365,
                "data_points": [
                    {"date": "2023-01-01", "value": 100}
                ],
                "total_value": 36500,
                "average_value": 100,
                "min_value": 50,
                "max_value": 200
            }
        }


class AnomalyDetectionRequest(BaseModel):
    """Request for anomaly detection"""
    
    product_id: Optional[str] = None
    warehouse_id: Optional[str] = None
    lookback_days: int = Field(default=90, ge=7, le=365)
    sensitivity: float = Field(default=0.95, ge=0.5, le=0.99)


class AnomalyResult(BaseModel):
    """Single anomaly detection result"""
    
    date: datetime
    actual_value: float
    expected_value: float
    deviation: float
    is_anomaly: bool
    anomaly_score: float


class AnomalyDetectionResponse(BaseModel):
    """Response for anomaly detection"""
    
    product_id: Optional[str] = None
    warehouse_id: Optional[str] = None
    analyzed_period_start: datetime
    analyzed_period_end: datetime
    total_anomalies: int
    anomalies: List[AnomalyResult]