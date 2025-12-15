from crewai_tools import BaseTool
from ortools.constraint_solver import routing_enums_pb2
from ortools.constraint_solver import pywrapcp
import json

class VRPSolverTools(BaseTool):
    name: str = "VRP Optimization Solver Tool"
    description: str = "A tool that takes order data, driver data, a depot, and a travel matrix to solve the Vehicle Routing Problem (VRP)."

    def _run(self, orders: list, drivers: list, depot: dict, travel_matrix: dict) -> str:
        # --- REAL IMPLEMENTATION using Google OR-Tools ---
        print("--- TOOL: Solving VRP with Google OR-Tools ---")

        # Create the data model for the solver
        data = {}
        data['time_matrix'] = travel_matrix['durations']
        data['num_vehicles'] = len(drivers)
        data['depot'] = 0 # The depot is always the first location in our matrix
        
        # Create the routing index manager.
        manager = pywrapcp.RoutingIndexManager(len(data['time_matrix']),
                                               data['num_vehicles'], data['depot'])

        # Create Routing Model.
        routing = pywrapcp.RoutingModel(manager)

        # Create and register a transit callback.
        def time_callback(from_index, to_index):
            """Returns the travel time between the two nodes."""
            from_node = manager.IndexToNode(from_index)
            to_node = manager.IndexToNode(to_index)
            return data['time_matrix'][from_node][to_node]

        transit_callback_index = routing.RegisterTransitCallback(time_callback)

        # Define cost of each arc.
        routing.SetArcCostEvaluatorOfAllVehicles(transit_callback_index)
        
        # Add Time Windows constraint (optional, can be added for more complexity)
        # ...

        # Setting first solution heuristic.
        search_parameters = pywrapcp.DefaultRoutingSearchParameters()
        search_parameters.first_solution_strategy = (
            routing_enums_pb2.FirstSolutionStrategy.PATH_CHEAPEST_ARC)

        # Solve the problem.
        solution = routing.SolveWithParameters(search_parameters)

        # Parse and return the solution.
        if solution:
            optimized_plan = {}
            for vehicle_id in range(data['num_vehicles']):
                index = routing.Start(vehicle_id)
                route_order_ids = []
                route_addresses = []
                route_time = 0
                while not routing.IsEnd(index):
                    node_index = manager.IndexToNode(index)
                    if node_index != 0: # Don't include the depot itself
                        # The order list is offset by 1 because the depot is at index 0
                        order = orders[node_index - 1]
                        route_order_ids.append(order['orderId'])
                        route_addresses.append(order['address'])
                    
                    previous_index = index
                    index = solution.Value(routing.NextVar(index))
                    route_time += routing.GetArcCostForVehicle(previous_index, index, vehicle_id)

                if route_order_ids: # Only add routes that have stops
                    optimized_plan[drivers[vehicle_id]['driverId']] = {
                        "route_order_ids": route_order_ids,
                        "route_addresses": route_addresses,
                        "total_time_seconds": route_time,
                    }
            return json.dumps(optimized_plan)
        else:
            return "Error: No solution found for the VRP." 