from fastapi import FastAPI
from .api.endpoints import router as agent_router
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(
    title="Agentic AI Service",
    description="A multi-agent system for autonomous supply chain optimization.",
    version="1.0.0",
)

app.include_router(agent_router, prefix="/api/v1", tags=["Agentic Workflows"])

@app.get("/health")
def read_root():
    return {"status": "Agentic AI Service is up and running"} 