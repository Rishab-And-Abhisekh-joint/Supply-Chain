from pydantic import BaseModel
from typing import List, Dict, Any

class ForecastRequest(BaseModel):
    product_id: str
    periods: int

class ForecastResponse(BaseModel):
    product_id: str
    forecast: List[Dict[str, Any]] 