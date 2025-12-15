from fastapi import APIRouter, HTTPException
from ..orchestrator.manager import run_last_mile_optimization_task
from ..dto.agentic_dto import OptimizationRequest, OptimizationResponse

router = APIRouter()

@router.post("/optimize-last-mile", response_model=OptimizationResponse)
async def optimize_last_mile(request: OptimizationRequest):
    """
    Triggers the multi-agent system to solve the last-mile delivery optimization problem.
    """
    try:
        # This function call kicks off the entire CrewAI process
        result = run_last_mile_optimization_task(
            area=request.area,
            date=request.date
        )
        return OptimizationResponse(
            status="Completed",
            message="Last-mile optimization task finished successfully.",
            result=result
        )
    except Exception as e:
        print(f"An error occurred during optimization: {e}")
        raise HTTPException(status_code=500, detail=str(e)) 