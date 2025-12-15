"use server";

import { z } from "zod";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

const formSchema = z.object({
  eventStream: z.string().min(1, "Event stream cannot be empty."),
});

export interface AnomalySummary {
  anomalies: {
    summary: string;
    suggestedAction: string;
    severity?: 'low' | 'medium' | 'high';
    category?: string;
  }[];
}

export async function getAnomalySummary(values: z.infer<typeof formSchema>): Promise<{
  success: boolean;
  data?: AnomalySummary;
  error?: string;
}> {
  try {
    const validatedInput = formSchema.parse(values);
    
    // Try to call the backend agentic AI service
    try {
      const response = await fetch(`${API_BASE_URL}/api/agentic/analyze-events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventStream: validatedInput.eventStream,
        }),
      });

      if (response.ok) {
        const backendResult = await response.json();
        return { success: true, data: backendResult };
      }
      
      console.warn('Backend agentic API returned non-OK status, using fallback');
    } catch (apiError) {
      console.warn('Backend agentic API unavailable, using fallback:', apiError);
    }

    // Fallback: Analyze events locally
    const result = analyzeEventsLocally(validatedInput.eventStream);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: "Invalid input." };
    }
    console.error("Error in getAnomalySummary:", error);
    return { success: false, error: "An unexpected error occurred." };
  }
}

// Local analysis function as fallback
function analyzeEventsLocally(eventStream: string): AnomalySummary {
  const events = eventStream.split('\n').filter(line => line.trim());
  const anomalies: AnomalySummary['anomalies'] = [];
  
  events.forEach(event => {
    const lowerEvent = event.toLowerCase();
    
    // Temperature anomalies
    if (lowerEvent.includes('temperature') && (lowerEvent.includes('spike') || lowerEvent.includes('high'))) {
      anomalies.push({
        summary: extractEventDetails(event, 'Temperature spike detected'),
        suggestedAction: 'Check refrigeration unit status. If temperature exceeds safe limits, initiate emergency cooling protocol.',
        severity: 'high',
        category: 'Environmental'
      });
    }
    
    // Delay anomalies
    if (lowerEvent.includes('delay') || lowerEvent.includes('late')) {
      anomalies.push({
        summary: extractEventDetails(event, 'Shipment delay detected'),
        suggestedAction: 'Contact carrier for status update. Notify customer of revised delivery timeline. Consider expedited shipping if critical.',
        severity: 'medium',
        category: 'Logistics'
      });
    }
    
    // Stock depletion
    if (lowerEvent.includes('stock') && (lowerEvent.includes('depletion') || lowerEvent.includes('low') || lowerEvent.includes('out of'))) {
      anomalies.push({
        summary: extractEventDetails(event, 'Inventory stock issue detected'),
        suggestedAction: 'Review inventory levels. Generate demand forecast. Create purchase order if below reorder point.',
        severity: 'high',
        category: 'Inventory'
      });
    }
    
    // Route deviation
    if (lowerEvent.includes('deviation') || lowerEvent.includes('off route') || lowerEvent.includes('reroute')) {
      anomalies.push({
        summary: extractEventDetails(event, 'Route deviation detected'),
        suggestedAction: 'Contact driver to verify reason. Check for traffic or road closures. Update ETA if necessary.',
        severity: 'low',
        category: 'Logistics'
      });
    }
    
    // Equipment failure
    if (lowerEvent.includes('failure') || lowerEvent.includes('malfunction') || lowerEvent.includes('error')) {
      anomalies.push({
        summary: extractEventDetails(event, 'Equipment or system issue detected'),
        suggestedAction: 'Dispatch maintenance team. Switch to backup system if available. Document incident for root cause analysis.',
        severity: 'high',
        category: 'Equipment'
      });
    }
    
    // Suspicious activity
    if (lowerEvent.includes('suspicious') || lowerEvent.includes('unauthorized') || lowerEvent.includes('breach')) {
      anomalies.push({
        summary: extractEventDetails(event, 'Security concern detected'),
        suggestedAction: 'Review security logs. Verify personnel access. Escalate to security team if warranted.',
        severity: 'high',
        category: 'Security'
      });
    }
  });
  
  // Remove duplicates based on summary
  const uniqueAnomalies = anomalies.reduce((acc, current) => {
    const exists = acc.find(item => item.summary === current.summary);
    if (!exists) {
      acc.push(current);
    }
    return acc;
  }, [] as typeof anomalies);
  
  return { anomalies: uniqueAnomalies };
}

function extractEventDetails(event: string, defaultSummary: string): string {
  // Try to extract relevant IDs from the event
  const idMatch = event.match(/#([A-Z]+-\d+)/i);
  const id = idMatch ? idMatch[1] : null;
  
  // Extract any numbers that might be measurements
  const numberMatch = event.match(/(\d+\.?\d*)\s*(hours?|mins?|degrees?|%|units?)/i);
  const measurement = numberMatch ? `${numberMatch[1]} ${numberMatch[2]}` : null;
  
  let summary = defaultSummary;
  if (id) {
    summary += ` for ${id}`;
  }
  if (measurement) {
    summary += ` (${measurement})`;
  }
  
  return summary;
}

// Fetch real-time events from backend
export async function getRealTimeEvents(): Promise<{
  success: boolean;
  data?: { id: string; type: string; message: string; timestamp: string }[];
  error?: string;
}> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/events/stream`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      return { success: true, data };
    }
    
    // Return mock events as fallback
    return { success: true, data: generateMockEvents() };
  } catch (error) {
    console.warn('Could not fetch real-time events:', error);
    return { success: true, data: generateMockEvents() };
  }
}

function generateMockEvents() {
  const eventTypes = ['Normal', 'Suspicious', 'Anomalous'];
  const templates = [
    { type: 'Normal', message: 'Shipment #SHIP-{id} departed from warehouse.' },
    { type: 'Normal', message: 'Inventory updated for product #PROD-{id}.' },
    { type: 'Normal', message: 'Delivery #DEL-{id} completed successfully.' },
    { type: 'Suspicious', message: 'Temperature reading unusual in zone {id}.' },
    { type: 'Suspicious', message: 'Vehicle #TRK-{id} minor route deviation.' },
    { type: 'Anomalous', message: 'Major delay for shipment #SHIP-{id}.' },
    { type: 'Anomalous', message: 'Stock depletion alert for #PROD-{id}.' },
  ];
  
  return templates.slice(0, 5).map((template, index) => ({
    id: `event-${Date.now()}-${index}`,
    type: template.type,
    message: template.message.replace('{id}', String(Math.floor(Math.random() * 1000)).padStart(3, '0')),
    timestamp: new Date().toISOString(),
  }));
}