"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, AlertTriangle, CheckCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { getAnomalySummary } from "@/app/operations/actions";
import { useToast } from "@/hooks/use-toast";
import type { SummarizeAnomaliesOutput } from "@/ai/flows/summarize-anomalies";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

const formSchema = z.object({
  eventStream: z.string().min(1, "Event stream cannot be empty."),
});

export default function OperationsClient() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<SummarizeAnomaliesOutput | null>(null);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      eventStream:
        "Event: Shipment ORD003 delayed. Current Location: Warehouse B. Reason: Vehicle maintenance. Expected Delay: 4 hours.\nEvent: Inventory level for Laptops at 200 units. Threshold: 250 units.\nEvent: Unexpected demand surge for Webcams in Region-West. Sales up 50%.\nEvent: Delivery truck TRK-05 reports flat tire. Location: I-5, mile 120. ETA impact: 2 hours.",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setResult(null);
    const response = await getAnomalySummary(values);
    setIsLoading(false);

    if (response.success && response.data) {
      setResult(response.data);
      toast({ title: "Analysis Complete", description: "Event stream has been analyzed." });
    } else {
      toast({ variant: "destructive", title: "Error", description: response.error });
    }
  }

  return (
    <div className="space-y-8">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="eventStream"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Real-time Event Stream</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Paste event stream data here..."
                    className="h-40"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Analyze Events
          </Button>
        </form>
      </Form>

      {isLoading && (
        <div className="text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
            <p className="mt-2 text-muted-foreground">Analyzing event stream...</p>
        </div>
      )}

      {result && (
        <div className="space-y-6 pt-6">
          <h3 className="text-lg font-semibold">Analysis Results</h3>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <Card>
              <CardHeader className="flex flex-row items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                <CardTitle>Anomaly Summary</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                 <p>{result.summary}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <CardTitle>Suggested Actions</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                <p>{result.suggestedActions}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
