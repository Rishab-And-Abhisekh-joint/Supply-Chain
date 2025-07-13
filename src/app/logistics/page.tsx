
"use client";

import LogisticsClient from "@/components/logistics-client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Suspense } from "react";

function LogisticsPage() {
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

export default function LogisticsPageWrapper() {
  return (
    <Suspense fallback={<div>Loading logistics...</div>}>
      <LogisticsPage />
    </Suspense>
  )
}
