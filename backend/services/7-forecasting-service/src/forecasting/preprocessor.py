import pandas as pd
import numpy as np
from typing import Optional


class Preprocessor:
    """
    Preprocesses time series data for forecasting models.
    """
    
    def prepare_series(self, df: pd.DataFrame) -> pd.Series:
        """
        Converts a DataFrame into a clean, indexed time series.
        
        Args:
            df: DataFrame with columns 'sale_date' and 'total_quantity'
            
        Returns:
            pd.Series indexed by month with total_quantity values
        """
        if df.empty:
            raise ValueError("Cannot prepare series from empty DataFrame")
        
        # Ensure proper datetime type
        df = df.copy()
        df['sale_date'] = pd.to_datetime(df['sale_date'])
        
        # Set index and sort
        df = df.set_index('sale_date')
        df = df.sort_index()
        
        # Resample to monthly frequency, filling gaps with 0
        time_series = df['total_quantity'].asfreq('MS', fill_value=0)
        
        # Handle any NaN values
        time_series = time_series.fillna(0)
        
        # Ensure it's a proper Series
        if not isinstance(time_series, pd.Series):
            raise ValueError("Expected a pandas Series after processing")
        
        return time_series
    
    def fill_gaps(self, series: pd.Series, method: str = 'interpolate') -> pd.Series:
        """
        Fill gaps in time series data.
        
        Args:
            series: Time series with potential gaps
            method: 'interpolate', 'forward', 'backward', or 'zero'
            
        Returns:
            Series with gaps filled
        """
        if method == 'interpolate':
            return series.interpolate(method='linear')
        elif method == 'forward':
            return series.ffill()
        elif method == 'backward':
            return series.bfill()
        else:  # zero
            return series.fillna(0)
    
    def remove_outliers(self, series: pd.Series, n_std: float = 3.0) -> pd.Series:
        """
        Remove outliers using z-score method.
        
        Args:
            series: Input time series
            n_std: Number of standard deviations for outlier threshold
            
        Returns:
            Series with outliers replaced by interpolated values
        """
        mean = series.mean()
        std = series.std()
        
        lower_bound = mean - n_std * std
        upper_bound = mean + n_std * std
        
        # Create mask for outliers
        outlier_mask = (series < lower_bound) | (series > upper_bound)
        
        if outlier_mask.any():
            # Replace outliers with NaN and interpolate
            series_clean = series.copy()
            series_clean[outlier_mask] = np.nan
            series_clean = series_clean.interpolate(method='linear')
            return series_clean
        
        return series
    
    def smooth_series(self, series: pd.Series, window: int = 3) -> pd.Series:
        """
        Apply moving average smoothing.
        
        Args:
            series: Input time series
            window: Window size for moving average
            
        Returns:
            Smoothed series
        """
        return series.rolling(window=window, center=True, min_periods=1).mean()
    
    def calculate_growth_rate(self, series: pd.Series) -> float:
        """
        Calculate the average monthly growth rate.
        
        Args:
            series: Input time series
            
        Returns:
            Average growth rate as a decimal
        """
        if len(series) < 2:
            return 0.0
        
        # Calculate period-over-period growth
        growth_rates = series.pct_change().dropna()
        
        # Return average, handling infinite values
        growth_rates = growth_rates.replace([np.inf, -np.inf], np.nan).dropna()
        
        if len(growth_rates) == 0:
            return 0.0
        
        return float(growth_rates.mean())