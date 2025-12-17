from pydantic import BaseModel, Field
from typing import Any, List, Optional, Dict
from enum import Enum


class SeverityLevel(str, Enum):
    """Severity levels for anomalies."""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


# ============================================================================
# EXISTING - Last Mile Optimization
# ============================================================================

class OptimizationRequest(BaseModel):
    """Request for last-mile delivery optimization."""
    area: str = Field(..., examples=["downtown"], description="Delivery area")
    date: str = Field(..., examples=["2025-07-11"], description="Delivery date (YYYY-MM-DD)")


class OptimizationResponse(BaseModel):
    """Response from last-mile optimization."""
    status: str
    message: str
    result: Any


# ============================================================================
# NEW - Event Analysis (for operations-client.tsx)
# ============================================================================

class EventAnalysisRequest(BaseModel):
    """
    Request for event analysis.
    Used by operations-client.tsx via POST /api/agentic/analyze-events
    """
    event_stream: str = Field(
        ..., 
        alias="eventStream",
        description="JSON string of events to analyze"
    )
    
    class Config:
        populate_by_name = True
        json_schema_extra = {
            "example": {
                "eventStream": '[{"type":"Suspicious","message":"Unusual delivery delay"}]'
            }
        }


class Anomaly(BaseModel):
    """Single anomaly detection result."""
    summary: str = Field(..., description="Brief description of the anomaly")
    suggested_action: str = Field(
        ..., 
        alias="suggestedAction",
        description="Recommended action to address the anomaly"
    )
    severity: Optional[SeverityLevel] = Field(
        SeverityLevel.MEDIUM, 
        description="Severity level"
    )
    category: Optional[str] = Field(
        None, 
        description="Category of anomaly (e.g., delivery_issue, inventory_issue)"
    )
    
    class Config:
        populate_by_name = True


class AnomalySummaryResponse(BaseModel):
    """
    Response for event analysis.
    Matches frontend AnomalySummary interface.
    """
    anomalies: List[Anomaly] = Field(
        ..., 
        description="List of detected anomalies"
    )
    
    class Config:
        json_schema_extra = {
            "example": {
                "anomalies": [
                    {
                        "summary": "Delivery issue: Unusual delivery delay",
                        "suggestedAction": "Review delivery route and contact driver",
                        "severity": "medium",
                        "category": "delivery_issue"
                    }
                ]
            }
        }


# ============================================================================
# NEW - Logistics Optimization (for logistics-client.tsx)
# ============================================================================

class LogisticsOptimizeRequest(BaseModel):
    """
    Request for logistics route optimization.
    Used by logistics-client.tsx via POST /api/agentic/logistics/optimize
    """
    origin: str = Field(..., description="Starting location")
    destination: str = Field(..., description="End location")
    preferences: Optional[Dict[str, Any]] = Field(
        None, 
        description="Optional routing preferences"
    )
    
    class Config:
        json_schema_extra = {
            "example": {
                "origin": "Mumbai, India",
                "destination": "Delhi, India"
            }
        }


class RouteCoordinate(BaseModel):
    """Single coordinate point on a route."""
    lat: float
    lng: float


class OptimizedRouteResponse(BaseModel):
    """
    Response for logistics optimization.
    Matches frontend OptimizedRoute interface.
    """
    optimal_route_summary: str = Field(
        ..., 
        alias="optimalRouteSummary",
        description="Summary of the optimal route"
    )
    estimated_time: str = Field(
        ..., 
        alias="estimatedTime",
        description="Estimated travel time"
    )
    estimated_distance: str = Field(
        ..., 
        alias="estimatedDistance",
        description="Estimated distance"
    )
    reasoning: str = Field(
        ..., 
        description="Explanation of route selection"
    )
    confirmation: bool = Field(
        True, 
        description="Route confirmation status"
    )
    route_coordinates: Optional[List[RouteCoordinate]] = Field(
        None, 
        alias="routeCoordinates",
        description="Array of route coordinates for map display"
    )
    alternative_routes: Optional[List[Dict[str, str]]] = Field(
        None,
        alias="alternativeRoutes",
        description="Alternative route options"
    )
    
    class Config:
        populate_by_name = True
        json_schema_extra = {
            "example": {
                "optimalRouteSummary": "Direct highway route from Mumbai to Delhi",
                "estimatedTime": "18.5 hours",
                "estimatedDistance": "1420 km",
                "reasoning": "Route optimized for fastest travel time using primary highways",
                "confirmation": True
            }
        }


# ============================================================================
# NEW - Service Status
# ============================================================================

class ServiceStatusResponse(BaseModel):
    """Service status information."""
    status: str = Field(..., description="Service health status")
    active_agents: int = Field(
        ..., 
        alias="activeAgents",
        description="Number of active AI agents"
    )
    available_capabilities: List[str] = Field(
        ...,
        alias="availableCapabilities",
        description="List of available capabilities"
    )
    
    class Config:
        populate_by_name = True
        json_schema_extra = {
            "example": {
                "status": "healthy",
                "activeAgents": 4,
                "availableCapabilities": [
                    "last-mile-optimization",
                    "event-analysis",
                    "logistics-routing"
                ]
            }
        }


# ============================================================================
# AI Query (General Purpose)
# ============================================================================

class AIQueryRequest(BaseModel):
    """General AI query request."""
    query: str = Field(..., description="Natural language query")
    context: Optional[Dict[str, Any]] = Field(
        None, 
        description="Additional context for the query"
    )


class AIQueryResponse(BaseModel):
    """General AI query response."""
    response: str = Field(..., description="AI response")
    confidence: float = Field(..., description="Confidence score (0-1)")
    sources: Optional[List[str]] = Field(
        None, 
        description="Data sources used"
    )