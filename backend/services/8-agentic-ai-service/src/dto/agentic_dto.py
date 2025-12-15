from pydantic import BaseModel, Field
from typing import Any

class OptimizationRequest(BaseModel):
    area: str = Field(default=..., examples=["downtown"])
    date: str = Field(default=..., examples=["2025-07-11"])

class OptimizationResponse(BaseModel):
    status: str
    message: str
    result: Any 