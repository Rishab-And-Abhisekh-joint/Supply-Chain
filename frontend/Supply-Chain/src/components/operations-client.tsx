"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Loader2, AlertTriangle, CheckCircle, Waves, Clipboard, RefreshCw, Pause, Play } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getAnomalySummary, getRealTimeEvents, type AnomalySummary } from "@/app/operations/actions";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Badge } from "./ui/badge";
import { cn } from "@/lib/utils";

type EventType = "Normal" | "Suspicious" | "Anomalous";

interface Event {
  id: string;
  message: string;
  type: EventType;
  timestamp?: string;
}

const fallbackEventTemplates = [
  { type: "Normal" as EventType, message: "Shipment #SHIP-00[ID] departed from warehouse A." },
  { type: "Normal" as EventType, message: "Inventory for product #PROD-0[ID] updated." },
  { type: "Normal" as EventType, message: "Delivery #DEL-99[ID] completed successfully." },
  { type: "Suspicious" as EventType, message: "Temperature spike detected in refrigerated unit #TEMP-0[ID]." },
  { type: "Suspicious" as EventType, message: "Vehicle #TRK-1[ID] reports minor route deviation." },
  { type: "Anomalous" as EventType, message: "Major delay reported for shipment #SHIP-0[ID]. ETA pushed by 8 hours." },
  { type: "Anomalous" as EventType, message: "System reports unexpected stock depletion for #PROD-0[ID]." },
];

const eventTypeConfig: Record<EventType, { variant: "secondary" | "default" | "destructive"; label: string }> = {
  'Normal': { variant: 'secondary', label: 'Normal' },
  'Suspicious': { variant: 'default', label: 'Suspicious' },
  'Anomalous': { variant: 'destructive', label: 'Anomalous' },
};

const severityColors: Record<string, string> = {
  'low': 'text-yellow-600 border-yellow-600',
  'medium': 'text-orange-600 border-orange-600',
  'high': 'text-red-600 border-red-600',
};

export default function OperationsClient() {
  const [isLoading, setIsLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnomalySummary | null>(null);
  const [isStreamRunning, setIsStreamRunning] = useState(true);
  const [liveEvents, setLiveEvents] = useState<Event[]>([]);
  const [flaggedEvents, setFlaggedEvents] = useState<Event[]>([]);
  const [useRealTimeAPI, setUseRealTimeAPI] = useState(true);
  
  const eventCounter = useRef(0);
  const { toast } = useToast();

  // Fetch events from backend or generate locally
  const fetchEvents = useCallback(async () => {
    if (!isStreamRunning) return;
    
    if (useRealTimeAPI) {
      try {
        const response = await getRealTimeEvents();
        if (response.success && response.data && response.data.length > 0) {
          // Add new events from API
          const newEvents: Event[] = response.data.map(e => ({
            id: e.id || `event-${Date.now()}-${Math.random()}`,
            message: e.message,
            type: (e.type as EventType) || 'Normal',
            timestamp: e.timestamp,
          }));
          
          setLiveEvents(prev => [...prev, ...newEvents].slice(-20)); // Keep last 20
          return;
        }
      } catch (error) {
        console.warn('Real-time API unavailable, using fallback');
        setUseRealTimeAPI(false);
      }
    }
    
    // Fallback: Generate mock event
    const template = fallbackEventTemplates[Math.floor(Math.random() * fallbackEventTemplates.length)];
    const newEvent: Event = {
      id: `event-${eventCounter.current++}`,
      type: template.type,
      message: template.message.replace('[ID]', String(eventCounter.current % 10)),
      timestamp: new Date().toISOString(),
    };
    
    setLiveEvents(prev => [...prev, newEvent].slice(-20));
  }, [isStreamRunning, useRealTimeAPI]);

  // Event streaming
  useEffect(() => {
    if (!isStreamRunning) return;
    
    // Initial fetch
    fetchEvents();
    
    // Poll for new events
    const eventInterval = setInterval(fetchEvents, 3000);
    
    return () => clearInterval(eventInterval);
  }, [isStreamRunning, fetchEvents]);

  // Process events that pass the "filter"
  const handleEventTransition = useCallback((event: Event) => {
    setLiveEvents(prev => prev.filter(e => e.id !== event.id));
    
    if (event.type !== 'Normal') {
      setFlaggedEvents(prev => {
        // Avoid duplicates
        if (prev.some(e => e.id === event.id)) return prev;
        return [...prev, event];
      });
    }
  }, []);

  // Auto-transition events after display time
  useEffect(() => {
    const timer = setTimeout(() => {
      if (liveEvents.length > 0) {
        handleEventTransition(liveEvents[0]);
      }
    }, 4000);
    
    return () => clearTimeout(timer);
  }, [liveEvents, handleEventTransition]);

  async function handleAnalyze() {
    if (flaggedEvents.length === 0) {
      toast({ 
        title: "No Events to Analyze", 
        description: "There are no suspicious or anomalous events to analyze." 
      });
      return;
    }
    
    setIsLoading(true);
    setAnalysisResult(null);
    setIsStreamRunning(false);

    const eventStream = flaggedEvents
      .map(e => `Event [${e.type}]: ${e.message}`)
      .join('\n');
    
    const response = await getAnomalySummary({ eventStream });
    
    setIsLoading(false);

    if (response.success && response.data) {
      setAnalysisResult(response.data);
      toast({ 
        title: "Analysis Complete", 
        description: `Found ${response.data.anomalies.length} anomalies requiring attention.` 
      });
    } else {
      toast({ 
        variant: "destructive", 
        title: "Error", 
        description: response.error || "Failed to analyze events." 
      });
      setIsStreamRunning(true);
    }
  }
  
  const restartStream = () => {
    setLiveEvents([]);
    setFlaggedEvents([]);
    setAnalysisResult(null);
    eventCounter.current = 0;
    setIsStreamRunning(true);
    setUseRealTimeAPI(true);
  };

  const toggleStream = () => {
    setIsStreamRunning(prev => !prev);
  };

  return (
    <div className="space-y-6">
      {/* Stream Controls */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Badge variant={isStreamRunning ? "default" : "secondary"}>
            {isStreamRunning ? "Live" : "Paused"}
          </Badge>
          {!useRealTimeAPI && (
            <Badge variant="outline" className="text-amber-600">
              Demo Mode
            </Badge>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={toggleStream}>
            {isStreamRunning ? (
              <>
                <Pause className="h-4 w-4 mr-2" />
                Pause
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Resume
              </>
            )}
          </Button>
          <Button variant="outline" size="sm" onClick={restartStream}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset
          </Button>
        </div>
      </div>

      {/* Event Panels */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Live Event Stream */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Waves className="h-5 w-5 text-primary" />
              Live Event Stream
            </CardTitle>
            <CardDescription>
              Real-time events from the supply chain. Anomalies are filtered to the right.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative h-96 w-full overflow-hidden rounded-md border bg-muted/20 p-4">
              <div className="absolute inset-0 flex flex-col-reverse justify-start p-4 space-y-2 space-y-reverse overflow-hidden">
                {liveEvents.slice(-10).map(event => (
                  <div
                    key={event.id}
                    className={cn(
                      "p-2 rounded-md shadow-sm bg-background animate-in slide-in-from-bottom-4 duration-300",
                      event.type === 'Normal' && 'border-l-4 border-l-green-500',
                      event.type === 'Suspicious' && 'border-l-4 border-l-yellow-500',
                      event.type === 'Anomalous' && 'border-l-4 border-l-red-500'
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <Badge variant={eventTypeConfig[event.type].variant}>
                        {eventTypeConfig[event.type].label}
                      </Badge>
                      <p className="text-sm flex-1">{event.message}</p>
                    </div>
                    {event.timestamp && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(event.timestamp).toLocaleTimeString()}
                      </p>
                    )}
                  </div>
                ))}
                {liveEvents.length === 0 && (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    {isStreamRunning ? 'Waiting for events...' : 'Stream paused'}
                  </div>
                )}
              </div>
              <div className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-muted to-transparent pointer-events-none" />
            </div>
          </CardContent>
        </Card>

        {/* Flagged Events */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Flagged Events
              {flaggedEvents.length > 0 && (
                <Badge variant="destructive">{flaggedEvents.length}</Badge>
              )}
            </CardTitle>
            <CardDescription>
              Suspicious and anomalous events collected for analysis.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-96 w-full overflow-y-auto rounded-md border bg-muted/20 p-4 space-y-2">
              {flaggedEvents.length === 0 && !analysisResult && (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <p>Waiting for anomalies...</p>
                </div>
              )}
              {flaggedEvents.map(event => (
                <div 
                  key={event.id} 
                  className={cn(
                    "p-2 rounded-md bg-background shadow-sm",
                    event.type === 'Suspicious' && 'border-l-4 border-l-yellow-500',
                    event.type === 'Anomalous' && 'border-l-4 border-l-red-500'
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Badge variant={eventTypeConfig[event.type].variant}>
                      {eventTypeConfig[event.type].label}
                    </Badge>
                    <p className="text-sm flex-1">{event.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analyze Button */}
      <div className="flex justify-center">
        {analysisResult ? (
          <Button onClick={restartStream} size="lg">
            <RefreshCw className="mr-2 h-4 w-4" />
            Start New Analysis
          </Button>
        ) : (
          <Button 
            onClick={handleAnalyze} 
            disabled={isLoading || flaggedEvents.length === 0} 
            size="lg"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Analyze Flagged Events ({flaggedEvents.length})
          </Button>
        )}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-8">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="mt-2 text-muted-foreground">Analyzing events with AI...</p>
        </div>
      )}

      {/* Analysis Results */}
      {analysisResult && (
        <div className="space-y-6 pt-6">
          <h3 className="text-lg font-semibold text-center">Analysis Results</h3>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clipboard className="h-5 w-5 text-primary" />
                Anomaly Analysis
              </CardTitle>
              <CardDescription>
                AI-identified anomalies with recommended actions.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {analysisResult.anomalies.length > 0 ? (
                analysisResult.anomalies.map((item, index) => (
                  <div 
                    key={index} 
                    className={cn(
                      "p-4 rounded-lg border bg-muted/30",
                      item.severity && severityColors[item.severity]
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <AlertTriangle className={cn(
                        "h-5 w-5 mt-1 flex-shrink-0",
                        item.severity === 'high' ? 'text-red-600' :
                        item.severity === 'medium' ? 'text-orange-600' :
                        'text-yellow-600'
                      )} />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold">{item.summary}</h4>
                          {item.severity && (
                            <Badge variant="outline" className="capitalize">
                              {item.severity}
                            </Badge>
                          )}
                          {item.category && (
                            <Badge variant="secondary">{item.category}</Badge>
                          )}
                        </div>
                        <div className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500 mt-1 flex-shrink-0" />
                          <p className="text-sm text-muted-foreground">
                            <span className="font-medium text-foreground">Suggested Action: </span>
                            {item.suggestedAction}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                  <p className="text-lg font-medium">No Critical Anomalies Detected</p>
                  <p className="text-muted-foreground">
                    The flagged events were analyzed but no significant issues were found.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}