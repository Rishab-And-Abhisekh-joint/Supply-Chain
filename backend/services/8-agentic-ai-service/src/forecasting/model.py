import uuid
from datetime import datetime, timedelta
from typing import Optional, List, Tuple
import random
import math


class ForecastModel:
    """
    Forecasting model for demand, inventory, and sales predictions.
    
    In production, this would integrate with ML libraries like:
    - Prophet (Facebook's time series forecasting)
    - scikit-learn
    - TensorFlow/PyTorch
    - statsmodels (ARIMA, etc.)
    """
    
    def __init__(self):
        self.model_name = "ensemble_forecast_v1"
        self.supported_types = ["demand", "inventory", "sales", "capacity"]
    
    def generate_forecast(
        self,
        product_id: Optional[str] = None,
        warehouse_id: Optional[str] = None,
        forecast_type: str = "demand",
        horizon_days: int = 30,
        include_confidence_interval: bool = True,
        confidence_level: float = 0.95
    ) -> dict:
        """
        Generate a forecast for the specified parameters.
        
        Args:
            product_id: Optional product identifier
            warehouse_id: Optional warehouse identifier
            forecast_type: Type of forecast (demand, inventory, sales, capacity)
            horizon_days: Number of days to forecast
            include_confidence_interval: Whether to include confidence bounds
            confidence_level: Confidence level for intervals (0.5-0.99)
            
        Returns:
            Dictionary containing forecast results
        """
        
        forecast_id = f"fc-{uuid.uuid4().hex[:12]}"
        generated_at = datetime.utcnow()
        
        # Generate predictions
        predictions = self._generate_predictions(
            horizon_days=horizon_days,
            include_confidence_interval=include_confidence_interval,
            confidence_level=confidence_level,
            forecast_type=forecast_type
        )
        
        # Calculate summary statistics
        values = [p["value"] for p in predictions]
        total_predicted = sum(values)
        average_daily = total_predicted / len(values) if values else 0
        peak_value = max(values) if values else 0
        peak_index = values.index(peak_value) if values else 0
        peak_date = predictions[peak_index]["date"] if predictions else generated_at
        
        # Calculate model metrics (simulated)
        mae, rmse, mape = self._calculate_metrics()
        
        return {
            "forecast_id": forecast_id,
            "product_id": product_id,
            "warehouse_id": warehouse_id,
            "forecast_type": forecast_type,
            "generated_at": generated_at,
            "horizon_days": horizon_days,
            "model_used": self.model_name,
            "confidence_level": confidence_level if include_confidence_interval else None,
            "predictions": predictions,
            "mae": mae,
            "rmse": rmse,
            "mape": mape,
            "total_predicted": round(total_predicted, 2),
            "average_daily": round(average_daily, 2),
            "peak_value": round(peak_value, 2),
            "peak_date": peak_date
        }
    
    def _generate_predictions(
        self,
        horizon_days: int,
        include_confidence_interval: bool,
        confidence_level: float,
        forecast_type: str
    ) -> List[dict]:
        """Generate prediction data points"""
        
        predictions = []
        base_value = self._get_base_value(forecast_type)
        today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        
        # Calculate confidence interval width based on level
        z_score = self._get_z_score(confidence_level)
        
        for day in range(1, horizon_days + 1):
            date = today + timedelta(days=day)
            
            # Add trend, seasonality, and noise
            trend = day * 0.5  # Slight upward trend
            seasonality = math.sin(day * 2 * math.pi / 7) * (base_value * 0.1)  # Weekly pattern
            noise = random.gauss(0, base_value * 0.05)
            
            value = base_value + trend + seasonality + noise
            value = max(0, value)  # Ensure non-negative
            
            prediction = {
                "date": date,
                "value": round(value, 2)
            }
            
            if include_confidence_interval:
                # Uncertainty grows with forecast horizon
                uncertainty = base_value * 0.1 * math.sqrt(day) * z_score
                prediction["lower_bound"] = round(max(0, value - uncertainty), 2)
                prediction["upper_bound"] = round(value + uncertainty, 2)
            
            predictions.append(prediction)
        
        return predictions
    
    def _get_base_value(self, forecast_type: str) -> float:
        """Get base value based on forecast type"""
        base_values = {
            "demand": 100,
            "inventory": 500,
            "sales": 150,
            "capacity": 1000
        }
        return base_values.get(forecast_type, 100)
    
    def _get_z_score(self, confidence_level: float) -> float:
        """Get z-score for confidence level"""
        z_scores = {
            0.90: 1.645,
            0.95: 1.96,
            0.99: 2.576
        }
        # Find closest confidence level
        closest = min(z_scores.keys(), key=lambda x: abs(x - confidence_level))
        return z_scores[closest]
    
    def _calculate_metrics(self) -> Tuple[float, float, float]:
        """Calculate model performance metrics (simulated)"""
        mae = round(random.uniform(5, 15), 2)
        rmse = round(random.uniform(8, 20), 2)
        mape = round(random.uniform(3, 10), 2)
        return mae, rmse, mape
    
    def get_historical_data(
        self,
        product_id: Optional[str] = None,
        warehouse_id: Optional[str] = None,
        data_type: str = "sales",
        days: int = 90
    ) -> dict:
        """
        Retrieve historical data for analysis.
        
        Args:
            product_id: Optional product identifier
            warehouse_id: Optional warehouse identifier
            data_type: Type of data to retrieve
            days: Number of historical days
            
        Returns:
            Dictionary containing historical data
        """
        
        today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        start_date = today - timedelta(days=days)
        
        base_value = self._get_base_value(data_type)
        data_points = []
        
        for day in range(days):
            date = start_date + timedelta(days=day)
            
            # Generate realistic historical pattern
            seasonality = math.sin(day * 2 * math.pi / 7) * (base_value * 0.15)
            trend = day * 0.3
            noise = random.gauss(0, base_value * 0.1)
            
            value = base_value + seasonality + trend + noise
            value = max(0, value)
            
            data_points.append({
                "date": date,
                "value": round(value, 2),
                "product_id": product_id,
                "warehouse_id": warehouse_id
            })
        
        # Calculate statistics
        values = [dp["value"] for dp in data_points]
        
        return {
            "product_id": product_id,
            "warehouse_id": warehouse_id,
            "data_type": data_type,
            "start_date": start_date,
            "end_date": today,
            "total_records": len(data_points),
            "data_points": data_points,
            "total_value": round(sum(values), 2),
            "average_value": round(sum(values) / len(values), 2) if values else 0,
            "min_value": round(min(values), 2) if values else 0,
            "max_value": round(max(values), 2) if values else 0,
            "std_deviation": round(self._std_dev(values), 2) if values else None
        }
    
    def _std_dev(self, values: List[float]) -> float:
        """Calculate standard deviation"""
        if not values:
            return 0
        mean = sum(values) / len(values)
        variance = sum((x - mean) ** 2 for x in values) / len(values)
        return math.sqrt(variance)
    
    def detect_anomalies(
        self,
        product_id: Optional[str] = None,
        warehouse_id: Optional[str] = None,
        lookback_days: int = 90,
        sensitivity: float = 0.95
    ) -> dict:
        """
        Detect anomalies in historical data.
        
        Args:
            product_id: Optional product identifier
            warehouse_id: Optional warehouse identifier  
            lookback_days: Number of days to analyze
            sensitivity: Anomaly detection sensitivity
            
        Returns:
            Dictionary containing anomaly detection results
        """
        
        # Get historical data
        historical = self.get_historical_data(
            product_id=product_id,
            warehouse_id=warehouse_id,
            days=lookback_days
        )
        
        values = [dp["value"] for dp in historical["data_points"]]
        mean_val = historical["average_value"]
        std_val = historical["std_deviation"] or 1
        
        # Z-score threshold based on sensitivity
        threshold = self._get_z_score(sensitivity)
        
        anomalies = []
        for dp in historical["data_points"]:
            z_score = abs(dp["value"] - mean_val) / std_val if std_val > 0 else 0
            is_anomaly = z_score > threshold
            
            if is_anomaly:
                anomalies.append({
                    "date": dp["date"],
                    "actual_value": dp["value"],
                    "expected_value": round(mean_val, 2),
                    "deviation": round(dp["value"] - mean_val, 2),
                    "is_anomaly": True,
                    "anomaly_score": round(z_score, 2)
                })
        
        today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        
        return {
            "product_id": product_id,
            "warehouse_id": warehouse_id,
            "analyzed_period_start": today - timedelta(days=lookback_days),
            "analyzed_period_end": today,
            "total_anomalies": len(anomalies),
            "anomalies": anomalies
        }