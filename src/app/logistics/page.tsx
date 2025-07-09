import LogisticsClient from "@/components/logistics-client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function LogisticsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Agentic Logistics Optimizer</CardTitle>
        <CardDescription>
          An AI agent to orchestrate logistics, optimize routes, and handle exceptions with human-in-the-loop oversight.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <LogisticsClient />
      </CardContent>
    </Card>
  );
}
