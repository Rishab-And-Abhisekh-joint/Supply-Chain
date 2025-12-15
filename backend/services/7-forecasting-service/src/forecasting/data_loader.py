import os
import pandas as pd
import asyncpg
from dotenv import load_dotenv

load_dotenv()

class DataLoader:
    def __init__(self):
        self.db_config = {
            "user": os.getenv("DB_USERNAME"),
            "password": os.getenv("DB_PASSWORD"),
            "database": os.getenv("DB_NAME"),
            "host": os.getenv("DB_HOST"),
            "port": os.getenv("DB_PORT", 5432)
        }

    async def get_sales_data(self, product_id: str) -> pd.DataFrame:
        """
        Fetches and aggregates sales data for a product from the database.
        This assumes you have 'orders' and 'order_items' tables.
        """
        conn = await asyncpg.connect(**self.db_config)
        
        query = """
            SELECT
                DATE_TRUNC('month', o."orderDate")::date as sale_date,
                SUM(oi.quantity) as total_quantity
            FROM order_items oi
            JOIN orders o ON oi."orderId" = o.id
            WHERE oi."productId" = $1
            GROUP BY sale_date
            ORDER BY sale_date ASC;
        """
        
        try:
            rows = await conn.fetch(query, product_id)
            if not rows:
                return pd.DataFrame()
            
            df = pd.DataFrame(rows, columns=['sale_date', 'total_quantity'])
            return df
        finally:
            await conn.close() 