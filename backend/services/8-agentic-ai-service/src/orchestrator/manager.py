from crewai import Crew, Process, Task
from ..agents.supply_chain_agents import SupplyChainAgents
import json

def run_last_mile_optimization_task(area: str, date: str):
    agents = SupplyChainAgents()
    
    # Instantiate agents
    data_agent = agents.data_retrieval_agent()
    routing_agent = agents.routing_api_agent()
    optimization_agent = agents.optimization_agent()
    dispatch_agent = agents.dispatch_agent()

    # Define Tasks
    get_data_task = Task(
        description=f"Retrieve all pending orders, available drivers, and the depot location for the '{area}' area for the date '{date}'.",
        expected_output="A JSON string containing 'orders', 'drivers', and 'depot' keys.",
        agent=data_agent,
    )

    get_matrix_task = Task(
        description=(
            "From the data in the previous step, compile a list of all delivery addresses, "
            "with the depot address as the very first item. Then, calculate the travel time matrix for this list of addresses."
        ),
        expected_output="A JSON string representing the travel time matrix.",
        agent=routing_agent,
        context=[get_data_task],
    )

    solve_vrp_task = Task(
        description="Take the orders, drivers, depot, and travel matrix to calculate the final, optimized delivery routes for each driver.",
        expected_output="A JSON string detailing the optimized plan, with each driver assigned a route.",
        agent=optimization_agent,
        context=[get_data_task, get_matrix_task]
    )
    
    dispatch_task = Task(
        description=f"Take the final optimized plan and dispatch it into the system for the date '{date}'.",
        expected_output="A confirmation message indicating that the routes have been successfully dispatched.",
        agent=dispatch_agent,
        context=[solve_vrp_task]
    )

    # Assemble the Crew
    crew = Crew(
        agents=[data_agent, routing_agent, optimization_agent, dispatch_agent],
        tasks=[get_data_task, get_matrix_task, solve_vrp_task, dispatch_task],
        process=Process.sequential,
        verbose=2
    )

    # Kick off the process
    result = crew.kickoff()
    
    print("\n--- FINAL WORKFLOW RESULT ---")
    print(result)
    
    return result 