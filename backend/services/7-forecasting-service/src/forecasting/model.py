import pandas as pd
import statsmodels.api as sm
from .data_loader import DataLoader
from .preprocessor import Preprocessor

class ForecastModel:
    def __init__(self):
        self.data_loader = DataLoader()
        self.preprocessor = Preprocessor()

    async def generate_forecast(self, product_id: str, periods: int) -> list[dict]:
        """
        Generates a forecast for a specific product.
        """
        # 1. Load data
        historical_data = await self.data_loader.get_sales_data(product_id)
        if historical_data.empty:
            raise ValueError(f"No historical sales data found for product {product_id}")

        # 2. Preprocess data
        time_series = self.preprocessor.prepare_series(historical_data)

        # 3. Train SARIMAX model
        order = (1, 1, 1)  # (p, d, q)
        seasonal_order = (1, 1, 1, 12) # (P, D, Q, s) - assuming monthly data with yearly seasonality

        model = sm.tsa.statespace.SARIMAX(
            time_series,
            order=order,
            seasonal_order=seasonal_order,
            enforce_stationarity=False,
            enforce_invertibility=False
        )
        
        results = model.fit(disp=False)

        # 4. Generate forecast
        forecast = results.get_forecast(steps=periods)
        
        # Get confidence intervals
        forecast_ci = forecast.conf_int()
        
        # Format the output
        forecast_df = pd.DataFrame({
            'date': forecast.predicted_mean.index.strftime('%Y-%m-%d'),
            'predicted_quantity': forecast.predicted_mean.values.round().astype(int),
            'lower_ci': forecast_ci.iloc[:, 0].values.round().astype(int),
            'upper_ci': forecast_ci.iloc[:, 1].values.round().astype(int),
        })

        return forecast_df.to_dict('records') 