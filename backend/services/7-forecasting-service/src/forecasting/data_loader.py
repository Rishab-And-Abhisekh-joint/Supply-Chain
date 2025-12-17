import os
import pandas as pd
import asyncpg
from dotenv import load_dotenv
from typing import Optional

load_dotenv()


class DataLoader:
    """
    Loads sales data from the database for forecasting.
    """
    
    def __init__(self):
        self.database_url = os.getenv("DATABASE_URL")
        
        # Fallback to individual connection params if DATABASE_URL not set
        if not self.database_url:
            self.db_config = {
                "user": os.getenv("DB_USERNAME", "postgres"),
                "password": os.getenv("DB_PASSWORD", ""),
                "database": os.getenv("DB_NAME", "supplychain"),
                "host": os.getenv("DB_HOST", "localhost"),
                "port": int(os.getenv("DB_PORT", 5432))
            }
        else:
            self.db_config = None

    async def _get_connection(self):
        """Get database connection."""
        if self.database_url:
            return await asyncpg.connect(self.database_url)
        else:
            return await asyncpg.connect(**self.db_config)

    async def get_sales_data(self, product_id: str, months: int = 24) -> pd.DataFrame:
        """
        Fetches and aggregates sales data for a product from the database.
        
        Args:
            product_id: The product ID to fetch data for
            months: Number of months of historical data to fetch
            
        Returns:
            DataFrame with columns: sale_date, total_quantity
        """
        try:
            conn = await self._get_connection()
            
            # Query with flexible column naming (handles different schemas)
            query = """
                SELECT
                    DATE_TRUNC('month', COALESCE(o.order_date, o."orderDate", o.created_at))::date as sale_date,
                    SUM(COALESCE(oi.quantity, 1)) as total_quantity
                FROM order_items oi
                JOIN orders o ON oi.order_id = o.id OR oi."orderId" = o.id
                WHERE (oi.product_id = $1 OR oi."productId" = $1)
                  AND COALESCE(o.order_date, o."orderDate", o.created_at) >= NOW() - INTERVAL '%s months'
                GROUP BY sale_date
                ORDER BY sale_date ASC;
            """ % months
            
            try:
                rows = await conn.fetch(query, product_id)
            except Exception as e:
                # Try alternative query structure
                print(f"Primary query failed: {e}, trying alternative...")
                query_alt = """
                    SELECT
                        DATE_TRUNC('month', o.created_at)::date as sale_date,
                        SUM(oi.quantity) as total_quantity
                    FROM order_items oi
                    JOIN orders o ON oi.order_id = o.id
                    WHERE oi.product_id = $1
                      AND o.created_at >= NOW() - INTERVAL '%s months'
                    GROUP BY sale_date
                    ORDER BY sale_date ASC;
                """ % months
                rows = await conn.fetch(query_alt, product_id)
            
            await conn.close()
            
            if not rows:
                print(f"No sales data found for product {product_id}")
                return pd.DataFrame()
            
            df = pd.DataFrame(rows, columns=['sale_date', 'total_quantity'])
            df['sale_date'] = pd.to_datetime(df['sale_date'])
            df['total_quantity'] = df['total_quantity'].astype(int)
            
            print(f"Loaded {len(df)} months of data for product {product_id}")
            return df
            
        except Exception as e:
            print(f"Error fetching sales data: {e}")
            return pd.DataFrame()

    async def get_product_info(self, product_id: str) -> Optional[dict]:
        """
        Get product information.
        """
        try:
            conn = await self._get_connection()
            
            query = """
                SELECT id, name, sku, category, quantity_in_stock
                FROM products
                WHERE id = $1
                LIMIT 1;
            """
            
            row = await conn.fetchrow(query, product_id)
            await conn.close()
            
            if row:
                return dict(row)
            return None
            
        except Exception as e:
            print(f"Error fetching product info: {e}")
            return None