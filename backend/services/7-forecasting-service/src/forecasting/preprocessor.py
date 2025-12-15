import pandas as pd

class Preprocessor:
    def prepare_series(self, df: pd.DataFrame) -> pd.Series:
        """
        Converts a DataFrame into a clean, indexed time series.
        """
        df['sale_date'] = pd.to_datetime(df['sale_date'])
        df = df.set_index('sale_date')
        time_series = df['total_quantity'].asfreq('MS', fill_value=0)
        if not isinstance(time_series, pd.Series):
            raise ValueError("Expected a pandas Series after asfreq.")
        return pd.Series(time_series) 