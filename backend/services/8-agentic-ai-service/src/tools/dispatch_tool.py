from crewai_tools import BaseTool
import json
import os
import requests
from datetime import datetime

class DispatchTool(BaseTool):
    name: str = "Route Dispatch Tool"
    description: str = "A tool to send the final, optimized route plan to the delivery microservice to be saved and executed."

    def _run(self, optimized_plan: dict, date: str) -> str:
        # --- REAL IMPLEMENTATION ---
        print("--- TOOL: Dispatching optimized routes to Delivery Service ---")

        delivery_service_url = os.getenv("DELIVERY_SERVICE_URL", "http://delivery-service:3004")

        try:
            results = []
            for driver_id, route_details in optimized_plan.items():
                # Format the payload for the delivery-service's DTO
                payload = {
                    "driverId": driver_id,
                    "routeDate": date,
                    "stops": [
                        {"orderId": order_id, "deliveryAddress": address}
                        for order_id, address in zip(route_details["route_order_ids"], route_details["route_addresses"])
                    ]
                }
                
                response = requests.post(f"{delivery_service_url}/delivery/routes", json=payload)
                response.raise_for_status()
                results.append(response.json())
            
            return f"Successfully dispatched {len(results)} routes."

        except requests.exceptions.RequestException as e:
            return f"Error: Failed to connect to the delivery service. {e}"
        except Exception as e:
            return f"An unexpected error occurred during dispatch: {e}" 