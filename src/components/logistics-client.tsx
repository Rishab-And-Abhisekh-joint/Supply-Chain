"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Route, Clock, Wand2, UserCheck, ThumbsUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getLogisticsOptimization } from "@/app/logistics/actions";
import { useToast } from "@/hooks/use-toast";
import type { OptimizeLogisticsDecisionsOutput } from "@/ai/flows/optimize-logistics-decisions";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";

const formSchema = z.object({
  shipmentDetails: z.string().min(1, "Shipment details are required."),
  deliveryDeadline: z.string().min(1, "Delivery deadline is required."),
  availableRoutes: z.string().min(1, "Available routes are required."),
  currentConditions: z.string().min(1, "Current conditions are required."),
  exceptions: z.string().optional(),
});

export default function LogisticsClient() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<OptimizeLogisticsDecisionsOutput | null>(null);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      shipmentDetails: "1 pallet of Laptops, fragile. Origin: Warehouse A. Destination: Downtown Store.",
      deliveryDeadline: new Date(new Date().getTime() + 8 * 60 * 60 * 1000).toISOString().slice(0, 16),
      availableRoutes: "Route 1: Highway I-5 (60 miles, heavy traffic). Route 2: City roads (55 miles, many stops).",
      currentConditions: "Rain, moderate traffic on I-5.",
      exceptions: "Customer requested morning delivery if possible.",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setResult(null);
    const response = await getLogisticsOptimization(values);
    setIsLoading(false);

    if (response.success && response.data) {
      setResult(response.data);
      toast({ title: "Optimization Complete", description: "Logistics plan has been generated." });
    } else {
      toast({ variant: "destructive", title: "Error", description: response.error });
    }
  }

  const handleApprove = () => {
    toast({
        title: "Plan Approved",
        description: "The logistics plan has been approved and is now active.",
        className: "bg-green-100 dark:bg-green-900 border-green-500 text-green-800 dark:text-green-200",
    });
    setResult(prev => prev ? {...prev, humanInTheLoopApprovalRequired: false} : null);
  }

  return (
    <div className="space-y-8">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <FormField
              control={form.control}
              name="shipmentDetails"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Shipment Details</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., 1 pallet of Laptops" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="deliveryDeadline"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Delivery Deadline</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="availableRoutes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Available Routes</FormLabel>
                <FormControl>
                  <Textarea placeholder="Describe available routes..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="currentConditions"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Current Conditions</FormLabel>
                <FormControl>
                  <Textarea placeholder="e.g., Weather, traffic..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="exceptions"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Exceptions (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Customer requests..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Optimize Route
          </Button>
        </form>
      </Form>

      {isLoading && (
         <div className="text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
            <p className="mt-2 text-muted-foreground">Finding optimal route...</p>
        </div>
      )}

      {result && (
        <div className="space-y-6 pt-6">
          <h3 className="text-lg font-semibold">Optimization Results</h3>
            {result.humanInTheLoopApprovalRequired && (
                <Alert variant="destructive">
                    <UserCheck className="h-4 w-4" />
                    <AlertTitle>Human Approval Required!</AlertTitle>
                    <AlertDescription className="flex items-center justify-between">
                       The AI agent recommends a plan that requires your review and approval due to identified exceptions or criticality.
                       <Button onClick={handleApprove} size="sm"><ThumbsUp className="mr-2 h-4 w-4" />Approve Plan</Button>
                    </AlertDescription>
                </Alert>
            )}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <Card>
                <CardHeader className="flex flex-row items-center gap-2">
                    <Route className="h-5 w-5 text-primary" />
                    <CardTitle>Optimal Route</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="font-semibold">{result.optimalRoute}</p>
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="flex flex-row items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" />
                    <CardTitle>Estimated Arrival Time</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="font-semibold">{result.estimatedArrivalTime}</p>
                </CardContent>
            </Card>
          </div>
          <Card>
                <CardHeader className="flex flex-row items-center gap-2">
                    <Wand2 className="h-5 w-5 text-primary" />
                    <CardTitle>AI Reasoning & Suggested Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div className="prose prose-sm dark:prose-invert max-w-none">
                        <p>{result.reasoning}</p>
                        <p>{result.suggestedActions}</p>
                    </div>
                </CardContent>
            </Card>
        </div>
      )}
    </div>
  );
}
