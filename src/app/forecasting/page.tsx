import ForecastingClient from "@/components/forecasting-client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function ForecastingPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Predictive Demand Forecasting</CardTitle>
        <CardDescription>
          Use historical data to train SARIMAX models that accurately forecast demand for each product.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ForecastingClient />
      </CardContent>
    </Card>
  );
}
