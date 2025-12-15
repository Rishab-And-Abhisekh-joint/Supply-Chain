from crewai_tools import BaseTool
import json
import os
import requests

class DatabaseTools(BaseTool):
    name: str = "Internal Services Query Tool"
    description: str = "A tool to query other internal microservices for data like unassigned orders and available drivers."

    def _run(self, area: str, date: str) -> str:
        # --- REAL IMPLEMENTATION ---
        print(f"--- TOOL: Querying internal services for area: {area} on date: {date} ---")

        order_service_url = os.getenv("ORDER_SERVICE_URL", "http://order-service:3002")

        try:
            response = requests.get(f"{order_service_url}/orders")
            response.raise_for_status()
            all_orders = response.json()
            
            pending_orders = [
                {"orderId": order['id'], "address": order['shippingAddress']} 
                for order in all_orders if order.get('status') == 'PENDING'
            ]

            # Mock the driver and depot data
            available_drivers = [
                {"driverId": "DRV-A", "vehicle_capacity": 15},
                {"driverId": "DRV-B", "vehicle_capacity": 15},
            ]
            
            depot = {
                "address": "1 Rocket Road, Hawthorne, CA" # Central depot address
            }

            result = {
                "orders": pending_orders,
                "drivers": available_drivers,
                "depot": depot
            }
            return json.dumps(result)

        except requests.exceptions.RequestException as e:
            return f"Error: Failed to connect to the order service. {e}"
        except Exception as e:
            return f"An unexpected error occurred: {e}" 