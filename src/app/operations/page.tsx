import OperationsClient from "@/components/operations-client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function OperationsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Operations Analyst</CardTitle>
        <CardDescription>
          Produces concise real-time summaries from event streams to highlight anomalies and suggest actions.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <OperationsClient />
      </CardContent>
    </Card>
  );
}
