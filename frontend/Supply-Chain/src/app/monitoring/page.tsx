'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Brain, Activity, AlertTriangle, CheckCircle2, XCircle, 
  Eye, Volume2, VolumeX, RefreshCw, Filter, Bell, BellOff,
  Clock, MapPin, Package, Truck, TrendingUp, TrendingDown,
  Shield, Zap, Target, BarChart3, Users, Warehouse,
  ChevronRight, ExternalLink, Play, Pause
} from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

type SeverityLevel = 'ok' | 'suspicious' | 'alert' | 'critical';
type ActivityType = 
  | 'inventory_movement' 
  | 'stock_level_change' 
  | 'unusual_order_pattern'
  | 'delivery_delay'
  | 'gps_deviation'
  | 'unauthorized_access'
  | 'price_anomaly'
  | 'supplier_issue';

type ActivityStatus = 'active' | 'acknowledged' | 'resolved' | 'dismissed';

interface AIActivity {
  id: string;
  timestamp: Date;
  type: ActivityType;
  severity: SeverityLevel;
  status: ActivityStatus;
  title: string;
  description: string;
  location?: string;
  entityId?: string;
  entityType?: 'warehouse' | 'shipment' | 'order' | 'product';
  metrics?: { label: string; value: string | number; change?: number }[];
  suggestedAction?: string;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  resolvedBy?: string;
  resolvedAt?: Date;
  resolutionNotes?: string;
}

interface SystemStats {
  totalActivities: number;
  criticalCount: number;
  alertCount: number;
  suspiciousCount: number;
  okCount: number;
  acknowledgedCount: number;
  resolvedCount: number;
}

// ============================================================================
// MOCK DATA GENERATORS
// ============================================================================

const activityTypes: ActivityType[] = [
  'inventory_movement', 'stock_level_change', 'unusual_order_pattern',
  'delivery_delay', 'gps_deviation', 'unauthorized_access', 'price_anomaly', 'supplier_issue'
];

const severityLevels: SeverityLevel[] = ['ok', 'suspicious', 'alert', 'critical'];

const generateActivity = (): AIActivity => {
  const type = activityTypes[Math.floor(Math.random() * activityTypes.length)];
  const severity = severityLevels[Math.floor(Math.random() * severityLevels.length)];
  
  const templates: Record<ActivityType, { title: string; description: string; suggestedAction: string }> = {
    inventory_movement: {
      title: 'Unusual Inventory Movement Detected',
      description: 'Large quantity of items moved outside normal hours at Delhi Warehouse.',
      suggestedAction: 'Verify with warehouse manager and check CCTV footage.',
    },
    stock_level_change: {
      title: 'Sudden Stock Level Drop',
      description: 'SKU-2345 dropped by 40% in the last hour without corresponding orders.',
      suggestedAction: 'Audit inventory count and check for data entry errors.',
    },
    unusual_order_pattern: {
      title: 'Anomalous Order Pattern',
      description: 'Multiple high-value orders from new account in rapid succession.',
      suggestedAction: 'Flag for fraud review and hold shipments pending verification.',
    },
    delivery_delay: {
      title: 'Delivery Delay Detected',
      description: 'Shipment SHP-4567 is 4 hours behind schedule on Mumbai route.',
      suggestedAction: 'Contact driver, update customer ETA, prepare alternate route.',
    },
    gps_deviation: {
      title: 'GPS Route Deviation',
      description: 'Vehicle VH-1234 deviated 15km from planned route near Pune.',
      suggestedAction: 'Contact driver immediately and verify reason for deviation.',
    },
    unauthorized_access: {
      title: 'Unauthorized Access Attempt',
      description: 'Failed login attempts detected from unknown IP for admin account.',
      suggestedAction: 'Lock account temporarily and initiate security review.',
    },
    price_anomaly: {
      title: 'Price Anomaly Detected',
      description: 'Product pricing 30% below market average may indicate error.',
      suggestedAction: 'Review pricing configuration and check for bulk discount errors.',
    },
    supplier_issue: {
      title: 'Supplier Performance Issue',
      description: 'Supplier ABC Corp has 3 delayed shipments this week.',
      suggestedAction: 'Schedule review call with supplier and assess alternatives.',
    },
  };

  const template = templates[type];
  const locations = ['Delhi Warehouse', 'Mumbai Hub', 'Chennai Center', 'Bangalore Depot', 'Kolkata Facility'];
  
  return {
    id: `ACT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date(),
    type,
    severity,
    status: 'active',
    title: template.title,
    description: template.description,
    location: locations[Math.floor(Math.random() * locations.length)],
    entityId: `ENT-${Math.floor(Math.random() * 10000)}`,
    entityType: ['warehouse', 'shipment', 'order', 'product'][Math.floor(Math.random() * 4)] as AIActivity['entityType'],
    metrics: [
      { label: 'Impact Score', value: Math.floor(Math.random() * 100), change: Math.random() * 20 - 10 },
      { label: 'Affected Items', value: Math.floor(Math.random() * 500) },
      { label: 'Est. Loss', value: `₹${(Math.random() * 100000).toFixed(0)}` },
    ],
    suggestedAction: template.suggestedAction,
  };
};

// ============================================================================
// UTILITY COMPONENTS
// ============================================================================

const SeverityBadge = ({ severity }: { severity: SeverityLevel }) => {
  const config: Record<SeverityLevel, { label: string; className: string; icon: React.ReactNode }> = {
    ok: { label: 'OK', className: 'bg-green-100 text-green-800 border-green-200', icon: <CheckCircle2 className="h-3 w-3" /> },
    suspicious: { label: 'Suspicious', className: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: <Eye className="h-3 w-3" /> },
    alert: { label: 'Alert', className: 'bg-orange-100 text-orange-800 border-orange-200', icon: <AlertTriangle className="h-3 w-3" /> },
    critical: { label: 'Critical', className: 'bg-red-100 text-red-800 border-red-200', icon: <XCircle className="h-3 w-3" /> },
  };
  const { label, className, icon } = config[severity];
  return (
    <Badge variant="outline" className={`gap-1 ${className}`}>
      {icon}
      {label}
    </Badge>
  );
};

const StatusBadge = ({ status }: { status: ActivityStatus }) => {
  const config: Record<ActivityStatus, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
    active: { label: 'Active', variant: 'destructive' },
    acknowledged: { label: 'Acknowledged', variant: 'default' },
    resolved: { label: 'Resolved', variant: 'outline' },
    dismissed: { label: 'Dismissed', variant: 'secondary' },
  };
  const { label, variant } = config[status];
  return <Badge variant={variant}>{label}</Badge>;
};

const ActivityTypeIcon = ({ type }: { type: ActivityType }) => {
  const icons: Record<ActivityType, React.ReactNode> = {
    inventory_movement: <Package className="h-4 w-4" />,
    stock_level_change: <BarChart3 className="h-4 w-4" />,
    unusual_order_pattern: <Target className="h-4 w-4" />,
    delivery_delay: <Clock className="h-4 w-4" />,
    gps_deviation: <MapPin className="h-4 w-4" />,
    unauthorized_access: <Shield className="h-4 w-4" />,
    price_anomaly: <TrendingDown className="h-4 w-4" />,
    supplier_issue: <Users className="h-4 w-4" />,
  };
  return icons[type];
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function AIOperationalAnalyst() {
  const [activities, setActivities] = useState<AIActivity[]>([]);
  const [isLive, setIsLive] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('active');
  const [selectedActivity, setSelectedActivity] = useState<AIActivity | null>(null);
  const [showResolveDialog, setShowResolveDialog] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize with some activities
  useEffect(() => {
    const initial = Array.from({ length: 10 }, () => generateActivity());
    setActivities(initial);
  }, []);

  // Live streaming - generate new activities every 5-15 seconds
  useEffect(() => {
    if (isLive) {
      const streamActivity = () => {
        const newActivity = generateActivity();
        setActivities(prev => [newActivity, ...prev].slice(0, 100));
        
        // Play audio alert for critical/alert severity
        if (audioEnabled && (newActivity.severity === 'critical' || newActivity.severity === 'alert')) {
          playAlertSound(newActivity.severity);
        }
      };

      // Random interval between 5-15 seconds
      const scheduleNext = () => {
        const delay = 5000 + Math.random() * 10000;
        intervalRef.current = setTimeout(() => {
          streamActivity();
          scheduleNext();
        }, delay);
      };

      scheduleNext();

      return () => {
        if (intervalRef.current) clearTimeout(intervalRef.current);
      };
    }
  }, [isLive, audioEnabled]);

  const playAlertSound = (severity: SeverityLevel) => {
    // Create audio context for alert sounds
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Different frequencies for different severities
    oscillator.frequency.value = severity === 'critical' ? 880 : 660;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  };

  const handleAcknowledge = useCallback((activity: AIActivity) => {
    setActivities(prev => prev.map(a => 
      a.id === activity.id 
        ? { ...a, status: 'acknowledged', acknowledgedBy: 'Current User', acknowledgedAt: new Date() }
        : a
    ));
  }, []);

  const handleResolve = useCallback(() => {
    if (!selectedActivity) return;
    
    setActivities(prev => prev.map(a => 
      a.id === selectedActivity.id 
        ? { 
            ...a, 
            status: 'resolved', 
            resolvedBy: 'Current User', 
            resolvedAt: new Date(),
            resolutionNotes 
          }
        : a
    ));
    setShowResolveDialog(false);
    setSelectedActivity(null);
    setResolutionNotes('');
  }, [selectedActivity, resolutionNotes]);

  const handleDismiss = useCallback((activity: AIActivity) => {
    setActivities(prev => prev.map(a => 
      a.id === activity.id ? { ...a, status: 'dismissed' } : a
    ));
  }, []);

  // Calculate stats
  const stats: SystemStats = {
    totalActivities: activities.length,
    criticalCount: activities.filter(a => a.severity === 'critical' && a.status === 'active').length,
    alertCount: activities.filter(a => a.severity === 'alert' && a.status === 'active').length,
    suspiciousCount: activities.filter(a => a.severity === 'suspicious' && a.status === 'active').length,
    okCount: activities.filter(a => a.severity === 'ok').length,
    acknowledgedCount: activities.filter(a => a.status === 'acknowledged').length,
    resolvedCount: activities.filter(a => a.status === 'resolved').length,
  };

  // Filter activities
  const filteredActivities = activities.filter(a => {
    if (severityFilter !== 'all' && a.severity !== severityFilter) return false;
    if (statusFilter !== 'all' && a.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="h-6 w-6 text-primary" />
            AI Operational Analyst
          </h1>
          <p className="text-sm text-muted-foreground">Real-time monitoring and anomaly detection</p>
        </div>
        <div className="flex items-center gap-4">
          {/* Live Toggle */}
          <div className="flex items-center gap-2">
            {isLive ? <Play className="h-4 w-4 text-green-500" /> : <Pause className="h-4 w-4" />}
            <Switch checked={isLive} onCheckedChange={setIsLive} />
            <Label className="text-sm">Live</Label>
          </div>
          {/* Audio Toggle */}
          <div className="flex items-center gap-2">
            {audioEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            <Switch checked={audioEnabled} onCheckedChange={setAudioEnabled} />
            <Label className="text-sm">Audio</Label>
          </div>
        </div>
      </div>

      {/* Live Indicator */}
      {isLive && (
        <div className="flex items-center gap-2 text-sm">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
          </span>
          <span className="text-green-600 font-medium">Live Monitoring Active</span>
          <span className="text-muted-foreground">- Updates every 5-15 seconds</span>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <Card className="bg-gradient-to-br from-slate-50 to-slate-100">
          <CardContent className="pt-4 text-center">
            <div className="text-2xl font-bold">{stats.totalActivities}</div>
            <p className="text-xs text-muted-foreground">Total</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardContent className="pt-4 text-center">
            <div className="text-2xl font-bold text-red-600">{stats.criticalCount}</div>
            <p className="text-xs text-red-600">Critical</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="pt-4 text-center">
            <div className="text-2xl font-bold text-orange-600">{stats.alertCount}</div>
            <p className="text-xs text-orange-600">Alerts</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
          <CardContent className="pt-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">{stats.suspiciousCount}</div>
            <p className="text-xs text-yellow-600">Suspicious</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="pt-4 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.okCount}</div>
            <p className="text-xs text-green-600">OK</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="pt-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.acknowledgedCount}</div>
            <p className="text-xs text-blue-600">Acknowledged</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="pt-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{stats.resolvedCount}</div>
            <p className="text-xs text-purple-600">Resolved</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filters:</span>
            </div>
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severities</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="alert">Alert</SelectItem>
                <SelectItem value="suspicious">Suspicious</SelectItem>
                <SelectItem value="ok">OK</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="acknowledged">Acknowledged</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="dismissed">Dismissed</SelectItem>
              </SelectContent>
            </Select>
            <Badge variant="outline">{filteredActivities.length} results</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Activities Feed */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Activity Feed
          </CardTitle>
          <CardDescription>Real-time alerts and anomalies detected by AI</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px] pr-4">
            <div className="space-y-4">
              {filteredActivities.map((activity) => (
                <Card 
                  key={activity.id} 
                  className={`transition-all ${
                    activity.severity === 'critical' ? 'border-red-300 bg-red-50/50' :
                    activity.severity === 'alert' ? 'border-orange-300 bg-orange-50/50' :
                    activity.severity === 'suspicious' ? 'border-yellow-300 bg-yellow-50/50' :
                    'border-green-300 bg-green-50/50'
                  } ${activity.status !== 'active' ? 'opacity-60' : ''}`}
                >
                  <CardContent className="pt-4">
                    <div className="flex flex-col md:flex-row justify-between gap-4">
                      {/* Main Info */}
                      <div className="flex-1 space-y-2">
                        <div className="flex items-start gap-2">
                          <div className="p-2 rounded-lg bg-white shadow-sm">
                            <ActivityTypeIcon type={activity.type} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-semibold">{activity.title}</h3>
                              <SeverityBadge severity={activity.severity} />
                              <StatusBadge status={activity.status} />
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {activity.description}
                            </p>
                          </div>
                        </div>
                        
                        {/* Meta Info */}
                        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {activity.timestamp.toLocaleTimeString()}
                          </span>
                          {activity.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {activity.location}
                            </span>
                          )}
                          {activity.entityId && (
                            <span className="flex items-center gap-1">
                              <Package className="h-3 w-3" />
                              {activity.entityType}: {activity.entityId}
                            </span>
                          )}
                        </div>

                        {/* Metrics */}
                        {activity.metrics && activity.metrics.length > 0 && (
                          <div className="flex flex-wrap gap-4 mt-2">
                            {activity.metrics.map((metric, idx) => (
                              <div key={idx} className="bg-white px-3 py-1 rounded shadow-sm">
                                <span className="text-xs text-muted-foreground">{metric.label}: </span>
                                <span className="text-sm font-medium">{metric.value}</span>
                                {metric.change !== undefined && (
                                  <span className={`ml-1 text-xs ${metric.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {metric.change >= 0 ? '↑' : '↓'}{Math.abs(metric.change).toFixed(1)}%
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Suggested Action */}
                        {activity.suggestedAction && activity.status === 'active' && (
                          <div className="mt-2 p-2 bg-blue-50 rounded border border-blue-200">
                            <span className="text-xs font-medium text-blue-800">💡 Suggested Action: </span>
                            <span className="text-xs text-blue-700">{activity.suggestedAction}</span>
                          </div>
                        )}

                        {/* Resolution Info */}
                        {activity.status === 'resolved' && activity.resolutionNotes && (
                          <div className="mt-2 p-2 bg-green-50 rounded border border-green-200">
                            <span className="text-xs font-medium text-green-800">✓ Resolution: </span>
                            <span className="text-xs text-green-700">{activity.resolutionNotes}</span>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      {activity.status === 'active' && (
                        <div className="flex md:flex-col gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleAcknowledge(activity)}
                          >
                            <CheckCircle2 className="h-4 w-4 mr-1" />
                            Acknowledge
                          </Button>
                          <Button 
                            size="sm" 
                            onClick={() => {
                              setSelectedActivity(activity);
                              setShowResolveDialog(true);
                            }}
                          >
                            <Zap className="h-4 w-4 mr-1" />
                            Resolve
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => handleDismiss(activity)}
                          >
                            Dismiss
                          </Button>
                        </div>
                      )}
                      
                      {activity.status === 'acknowledged' && (
                        <div className="flex md:flex-col gap-2">
                          <Button 
                            size="sm" 
                            onClick={() => {
                              setSelectedActivity(activity);
                              setShowResolveDialog(true);
                            }}
                          >
                            <Zap className="h-4 w-4 mr-1" />
                            Resolve
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Resolve Dialog */}
      <Dialog open={showResolveDialog} onOpenChange={setShowResolveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolve Activity</DialogTitle>
            <DialogDescription>
              Mark this activity as resolved and add resolution notes.
            </DialogDescription>
          </DialogHeader>
          {selectedActivity && (
            <div className="space-y-4">
              <div className="p-3 bg-muted rounded-lg">
                <h4 className="font-medium">{selectedActivity.title}</h4>
                <p className="text-sm text-muted-foreground">{selectedActivity.description}</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="resolution">Resolution Notes</Label>
                <Textarea
                  id="resolution"
                  placeholder="Describe how this issue was resolved..."
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  rows={4}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResolveDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleResolve}>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Mark Resolved
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}