from crewai_tools import BaseTool
import json
import os
import requests

class RoutingTools(BaseTool):
    name: str = "Mapping API Tool"
    description: str = "A tool to get a travel time matrix between multiple addresses using the Mapbox Matrix API."

    def _run(self, addresses: list[str]) -> str:
        # --- REAL IMPLEMENTATION ---
        print(f"--- TOOL: Getting travel matrix for {len(addresses)} addresses using Mapbox API ---")

        api_key = os.getenv("MAPPING_API_KEY")
        if not api_key:
            return "Error: MAPPING_API_KEY environment variable not set."
        
        if len(addresses) < 2:
            # If there's only one address (e.g., just the depot), return a minimal matrix.
            return json.dumps({"durations": [[0]]})

        try:
            coordinates = []
            for address in addresses:
                geocode_url = f"https://api.mapbox.com/geocoding/v5/mapbox.places/{address}.json"
                params = {'access_token': api_key, 'limit': 1}
                response = requests.get(geocode_url, params=params)
                response.raise_for_status()
                data = response.json()
                if not data.get('features'):
                    return f"Error: Could not geocode address '{address}'."
                lon, lat = data['features'][0]['center']
                coordinates.append(f"{lon},{lat}")

            coordinates_str = ";".join(coordinates)
            matrix_url = f"https://api.mapbox.com/directions-matrix/v1/mapbox/driving/{coordinates_str}"
            params = {'access_token': api_key, 'annotations': 'duration'}
            
            response = requests.get(matrix_url, params=params)
            response.raise_for_status()
            
            matrix_data = response.json()
            if matrix_data.get('code') != 'Ok':
                return f"Error from Mapbox Matrix API: {matrix_data.get('message', 'Unknown error')}"

            return json.dumps({"durations": matrix_data["durations"]})

        except requests.exceptions.RequestException as e:
            return f"Error: Failed to connect to the Mapbox API. {e}"
        except Exception as e:
            return f"An unexpected error occurred: {e}" 