
"use client";

import { useState, useEffect, useRef } from "react";
import { Loader2, AlertTriangle, CheckCircle, Waves, Clipboard } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getAnomalySummary } from "@/app/operations/actions";
import { useToast } from "@/hooks/use-toast";
import type { SummarizeAnomaliesOutput } from "@/ai/flows/summarize-anomalies";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Badge } from "./ui/badge";
import { cn } from "@/lib/utils";

type EventType = "Normal" | "Suspicious" | "Anomalous";

interface Event {
  id: number;
  message: string;
  type: EventType;
}

const eventTemplates = [
  { type: "Normal" as EventType, message: "Shipment #SHIP-00[ID] departed from warehouse A." },
  { type: "Normal" as EventType, message: "Inventory for product #PROD-0[ID] updated." },
  { type: "Normal" as EventType, message: "Delivery #DEL-99[ID] completed successfully." },
  { type: "Suspicious" as EventType, message: "Temperature spike detected in refrigerated unit #TEMP-0[ID]." },
  { type: "Suspicious" as EventType, message: "Vehicle #TRK-1[ID] reports minor route deviation." },
  { type: "Anomalous" as EventType, message: "Major delay reported for shipment #SHIP-0[ID]. ETA pushed by 8 hours." },
  { type: "Anomalous" as EventType, message: "System reports unexpected stock depletion for #PROD-0[ID]." },
];

const eventTypeConfig: Record<EventType, { variant: "secondary" | "default" | "destructive", label: string }> = {
    'Normal': { variant: 'secondary', label: 'Normal' },
    'Suspicious': { variant: 'default', label: 'Suspicious' },
    'Anomalous': { variant: 'destructive', label: 'Anomalous' },
}

export default function OperationsClient() {
  const [isLoading, setIsLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<SummarizeAnomaliesOutput | null>(null);
  const [isStreamRunning, setIsStreamRunning] = useState(true);
  const [liveEvents, setLiveEvents] = useState<Event[]>([]);
  const [flaggedEvents, setFlaggedEvents] = useState<Event[]>([]);
  
  const eventCounter = useRef(0);
  const streamContainerRef = useRef<HTMLDivElement>(null);
  
  const { toast } = useToast();

  useEffect(() => {
    if (!isStreamRunning) return;

    const eventInterval = setInterval(() => {
        const template = eventTemplates[Math.floor(Math.random() * eventTemplates.length)];
        const newEvent: Event = {
            id: eventCounter.current++,
            type: template.type,
            message: template.message.replace('[ID]', (eventCounter.current % 10).toString()),
        };

        setLiveEvents(prev => [...prev, newEvent]);
    }, 2000);

    return () => clearInterval(eventInterval);
  }, [isStreamRunning]);

  const handleEventTransition = (event: Event) => {
      setLiveEvents(prev => prev.filter(e => e.id !== event.id));
      if (event.type !== 'Normal') {
          setFlaggedEvents(prev => [...prev, event]);
      }
  };

  async function handleAnalyze() {
    if (flaggedEvents.length === 0) {
      toast({ title: "No Events to Analyze", description: "There are no suspicious or anomalous events to analyze." });
      return;
    }
    
    setIsLoading(true);
    setAnalysisResult(null);
    setIsStreamRunning(false);

    const eventStream = flaggedEvents.map(e => `Event [${e.type}]: ${e.message}`).join('\n');
    const response = await getAnomalySummary({ eventStream });
    
    setIsLoading(false);

    if (response.success && response.data) {
      setAnalysisResult(response.data);
      toast({ title: "Analysis Complete", description: "Flagged events have been analyzed." });
    } else {
      toast({ variant: "destructive", title: "Error", description: response.error });
      setIsStreamRunning(true);
    }
  }
  
  const restartStream = () => {
    setLiveEvents([]);
    setFlaggedEvents([]);
    setAnalysisResult(null);
    eventCounter.current = 0;
    setIsStreamRunning(true);
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Waves className="h-5 w-5 text-primary"/>
              Live Event Stream
            </CardTitle>
            <CardDescription>
                Real-time events from the supply chain. New events appear from the bottom.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative h-96 w-full overflow-hidden rounded-md border bg-muted/20 p-4">
               <div 
                 ref={streamContainerRef} 
                 className="absolute inset-0 flex flex-col-reverse justify-start p-4 space-y-2 space-y-reverse"
               >
                {liveEvents.map(event => (
                    <div 
                        key={event.id}
                        className={cn(
                          "animate-scroll-up p-2 rounded-md shadow-sm opacity-0",
                           event.type === 'Normal' && 'animate-filter-normal',
                           event.type !== 'Normal' && 'animate-filter-anomaly'
                        )}
                        onAnimationEnd={() => handleEventTransition(event)}
                     >
                        <Badge variant={eventTypeConfig[event.type].variant}>{eventTypeConfig[event.type].label}</Badge>
                        <p className="ml-2 inline text-sm">{event.message}</p>
                    </div>
                ))}
              </div>
              <div className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-t from-transparent to-border/50 p-2 text-center font-medium text-primary">
                FILTER
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
             <CardTitle>Flagged Events</CardTitle>
             <CardDescription>Suspicious and anomalous events are collected here for analysis.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-96 w-full overflow-y-auto rounded-md border bg-muted/20 p-4 space-y-2">
               {flaggedEvents.length === 0 && !analysisResult && (
                   <div className="flex items-center justify-center h-full text-muted-foreground">
                       <p>Waiting for events...</p>
                   </div>
               )}
               {flaggedEvents.map(event => (
                    <div key={event.id} className="p-2 rounded-md bg-background shadow-sm">
                       <Badge variant={eventTypeConfig[event.type].variant}>{eventTypeConfig[event.type].label}</Badge>
                       <p className="ml-2 inline text-sm">{event.message}</p>
                    </div>
               ))}
            </div>
          </CardContent>
        </Card>
      </div>

       <div className="flex justify-center">
            {analysisResult ? (
                 <Button onClick={restartStream}>Start New Analysis</Button>
            ) : (
                <Button onClick={handleAnalyze} disabled={isLoading || flaggedEvents.length === 0} size="lg">
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Analyze Flagged Events ({flaggedEvents.length})
                </Button>
            )}
        </div>


      {isLoading && (
        <div className="text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
            <p className="mt-2 text-muted-foreground">Analyzing events...</p>
        </div>
      )}

      {analysisResult && (
        <div className="space-y-6 pt-6">
          <h3 className="text-lg font-semibold text-center">Analysis Results</h3>
          <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Clipboard className="h-5 w-5 text-primary" />Point-by-Point Analysis</CardTitle>
                <CardDescription>The AI has identified the following anomalies and suggested actions.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {analysisResult.anomalies.map((item, index) => (
                    <div key={index} className="p-4 rounded-lg border bg-muted/30">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="h-5 w-5 text-destructive mt-1 flex-shrink-0"/>
                            <div>
                                <h4 className="font-semibold">Anomaly: {item.summary}</h4>
                                <div className="flex items-start gap-2 mt-2">
                                     <CheckCircle className="h-4 w-4 text-green-500 mt-1 flex-shrink-0" />
                                    <p className="text-sm text-muted-foreground"><span className="font-medium text-foreground">Suggested Action:</span> {item.suggestedAction}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
                {analysisResult.anomalies.length === 0 && (
                     <div className="text-center text-muted-foreground py-4">
                        <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                        <p>No significant anomalies detected in the flagged events.</p>
                    </div>
                )}
            </CardContent>
          </Card>
        </div>
      )}
      <style jsx>{`
        @keyframes scroll-up {
            0% { transform: translateY(100%); opacity: 0; }
            10% { opacity: 1; }
            90% { opacity: 1; }
            100% { transform: translateY(-400px); opacity: 0; }
        }
        .animate-scroll-up {
            animation: scroll-up 10s linear forwards;
        }

        @keyframes filter-normal {
             0%, 90% {  transform: translateX(0); }
             100% { transform: translate(0, -50px); opacity: 0; }
        }
        .animate-filter-normal {
            animation-name: scroll-up, filter-normal;
            animation-duration: 10s, 1s;
            animation-delay: 0s, 10s;
            animation-timing-function: linear, ease-out;
            animation-fill-mode: forwards, forwards;
        }
        
        @keyframes filter-anomaly {
             0%, 90% { transform: translateX(0); }
             100% { transform: translate(calc(50vw - 100%), 50px); opacity: 0; }
        }
        .animate-filter-anomaly {
             animation-name: scroll-up, filter-anomaly;
            animation-duration: 10s, 1s;
            animation-delay: 0s, 10s;
            animation-timing-function: linear, ease-out;
            animation-fill-mode: forwards, forwards;
        }
      `}</style>
    </div>
  );
}
