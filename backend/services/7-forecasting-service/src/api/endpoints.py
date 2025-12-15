from fastapi import APIRouter, Depends, HTTPException
from ..forecasting.model import ForecastModel
from ..dto.forecast_dto import ForecastRequest, ForecastResponse

router = APIRouter()

@router.post("/forecast", response_model=ForecastResponse)
async def get_forecast(request: ForecastRequest, model: ForecastModel = Depends(ForecastModel)):
    """
    Generate a demand forecast for a given product.
    """
    try:
        forecast_results = await model.generate_forecast(
            product_id=request.product_id,
            periods=request.periods
        )
        return ForecastResponse(
            product_id=request.product_id,
            forecast=forecast_results
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 