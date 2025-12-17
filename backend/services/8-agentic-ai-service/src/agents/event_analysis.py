"""
Event Analysis Module

Analyzes event streams to detect anomalies and suspicious patterns.
Used by operations-client.tsx via POST /api/agentic/analyze-events
"""

import json
import os
from typing import Dict, List, Any, Optional

# Try to import CrewAI for AI-powered analysis (optional)
try:
    from crewai import Agent
    from langchain_groq import ChatGroq
    CREWAI_AVAILABLE = True
except ImportError:
    CREWAI_AVAILABLE = False
    print("CrewAI not available, using rule-based analysis only")


def analyze_events(event_stream: str) -> Dict[str, List[Dict[str, Any]]]:
    """
    Analyze events to detect anomalies and suspicious patterns.
    
    Args:
        event_stream: JSON string containing array of events
        
    Returns:
        Dict with 'anomalies' key containing list of detected anomalies
    """
    try:
        # Parse event stream
        if isinstance(event_stream, str):
            try:
                events = json.loads(event_stream)
            except json.JSONDecodeError:
                # If not valid JSON, treat as single message
                events = [{"type": "Normal", "message": event_stream}]
        else:
            events = event_stream
        
        if not isinstance(events, list):
            events = [events]
        
        anomalies = []
        
        # Rule-based anomaly detection
        for event in events:
            event_type = event.get('type', 'Normal')
            message = event.get('message', str(event))
            
            if event_type == 'Anomalous':
                anomalies.append({
                    "summary": f"Critical anomaly detected: {message}",
                    "suggestedAction": "Immediate investigation required. Check system logs and notify operations team.",
                    "severity": "high",
                    "category": "system_anomaly"
                })
                
            elif event_type == 'Suspicious':
                # Categorize based on message content
                anomaly = _categorize_suspicious_event(message)
                anomalies.append(anomaly)
        
        # Pattern detection across all events
        pattern_anomalies = _detect_patterns(events)
        anomalies.extend(pattern_anomalies)
        
        return {"anomalies": anomalies}
        
    except Exception as e:
        print(f"Event analysis error: {e}")
        return {
            "anomalies": [{
                "summary": "Unable to analyze event stream",
                "suggestedAction": "Check event stream format and retry. Ensure JSON is valid.",
                "severity": "low",
                "category": "analysis_error"
            }]
        }


def _categorize_suspicious_event(message: str) -> Dict[str, Any]:
    """
    Categorize a suspicious event based on its message content.
    
    Returns:
        Anomaly dict with summary, suggestedAction, severity, and category
    """
    message_lower = message.lower()
    
    # Delivery-related issues
    if any(keyword in message_lower for keyword in ['delivery', 'delay', 'late', 'route', 'driver']):
        return {
            "summary": f"Delivery issue detected: {message}",
            "suggestedAction": "Review delivery route and contact driver. Check for traffic or weather issues. Consider route optimization.",
            "severity": "medium",
            "category": "delivery_issue"
        }
    
    # Inventory-related issues
    if any(keyword in message_lower for keyword in ['inventory', 'stock', 'warehouse', 'quantity', 'shortage']):
        return {
            "summary": f"Inventory concern: {message}",
            "suggestedAction": "Verify stock levels and check for discrepancies. May need physical count. Consider reorder.",
            "severity": "medium",
            "category": "inventory_issue"
        }
    
    # Order-related issues
    if any(keyword in message_lower for keyword in ['order', 'payment', 'customer', 'cancel']):
        return {
            "summary": f"Order processing issue: {message}",
            "suggestedAction": "Review order details and customer communication. Check payment status and order history.",
            "severity": "medium",
            "category": "order_issue"
        }
    
    # Security-related issues
    if any(keyword in message_lower for keyword in ['login', 'access', 'unauthorized', 'security', 'failed']):
        return {
            "summary": f"Security concern: {message}",
            "suggestedAction": "Review access logs and verify user credentials. Consider temporary access restriction.",
            "severity": "high",
            "category": "security_issue"
        }
    
    # Performance-related issues
    if any(keyword in message_lower for keyword in ['slow', 'timeout', 'performance', 'latency', 'error']):
        return {
            "summary": f"Performance issue: {message}",
            "suggestedAction": "Monitor system resources and check for bottlenecks. Review recent deployments.",
            "severity": "medium",
            "category": "performance_issue"
        }
    
    # Default categorization
    return {
        "summary": message,
        "suggestedAction": "Monitor situation and investigate if pattern continues.",
        "severity": "low",
        "category": "general"
    }


def _detect_patterns(events: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Detect patterns across multiple events.
    
    Returns:
        List of pattern-based anomalies
    """
    pattern_anomalies = []
    
    if not events:
        return pattern_anomalies
    
    # Count events by type
    event_counts = {}
    for event in events:
        et = event.get('type', 'Normal')
        event_counts[et] = event_counts.get(et, 0) + 1
    
    # High frequency of suspicious events
    suspicious_count = event_counts.get('Suspicious', 0)
    if suspicious_count >= 3:
        pattern_anomalies.append({
            "summary": f"Pattern detected: {suspicious_count} suspicious events in recent activity",
            "suggestedAction": "Review system health and recent changes. Consider security audit. Check for coordinated issues.",
            "severity": "medium",
            "category": "pattern_detection"
        })
    
    # Multiple anomalous events
    anomalous_count = event_counts.get('Anomalous', 0)
    if anomalous_count >= 2:
        pattern_anomalies.append({
            "summary": f"Critical: {anomalous_count} anomalous events detected",
            "suggestedAction": "Escalate to operations team immediately. May indicate system-wide issue.",
            "severity": "high",
            "category": "critical_pattern"
        })
    
    # Check for repeated messages (potential spam or loop)
    messages = [e.get('message', '') for e in events]
    message_counts = {}
    for msg in messages:
        message_counts[msg] = message_counts.get(msg, 0) + 1
    
    for msg, count in message_counts.items():
        if count >= 3 and msg:
            pattern_anomalies.append({
                "summary": f"Repeated event detected: '{msg[:50]}...' occurred {count} times",
                "suggestedAction": "Check for event loop or duplicate event generation. May indicate configuration issue.",
                "severity": "low",
                "category": "repetition_pattern"
            })
            break  # Only report first repetition pattern
    
    return pattern_anomalies


def analyze_events_with_ai(event_stream: str) -> Dict[str, List[Dict[str, Any]]]:
    """
    Analyze events using AI agents (if available).
    Falls back to rule-based analysis if AI is unavailable.
    
    Args:
        event_stream: JSON string of events
        
    Returns:
        Dict with 'anomalies' key
    """
    # First, try AI-based analysis
    if CREWAI_AVAILABLE and os.getenv("GROQ_API_KEY"):
        try:
            # AI analysis could be implemented here
            # For now, fall through to rule-based
            pass
        except Exception as e:
            print(f"AI analysis failed: {e}")
    
    # Fall back to rule-based analysis
    return analyze_events(event_stream)