from crewai import Agent
from langchain_groq import ChatGroq
from ..tools.database_tools import DatabaseTools
from ..tools.routing_tools import RoutingTools
from ..tools.solver_tools import VRPSolverTools
from ..tools.dispatch_tool import DispatchTool

llm = ChatGroq(model="llama3-8b-8192")

class SupplyChainAgents:
    def data_retrieval_agent(self):
        return Agent(
            role="Logistics Data Analyst",
            goal="Query internal databases to find all unassigned orders and available drivers for a specific operational area and date.",
            backstory="An expert in database querying and data extraction.",
            tools=[DatabaseTools()],
            llm=llm,
            verbose=True,
        )

    def routing_api_agent(self):
        return Agent(
            role="Mapping & Geolocation Expert",
            goal="Use external mapping APIs to calculate the travel time and distance matrix between a list of delivery addresses.",
            backstory="With a deep understanding of geolocation services, you provide the critical travel time data.",
            tools=[RoutingTools()],
            llm=llm,
            verbose=True,
        )

    def optimization_agent(self):
        return Agent(
            role="Operations Research Specialist",
            goal="Solve the Vehicle Routing Problem (VRP) to produce an optimized delivery plan.",
            backstory="A master of complex algorithms and optimization.",
            tools=[VRPSolverTools()],
            llm=llm,
            verbose=True,
        )
    
    def dispatch_agent(self):
        return Agent(
            role="Logistics Dispatcher",
            goal="Take a finalized, optimized route plan and formally dispatch it by creating the route in the delivery management system.",
            backstory="The final link in the chain, you ensure that plans are put into action.",
            tools=[DispatchTool()],
            llm=llm,
            verbose=True,
        ) 