'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Map, { Source, Layer, Popup, type MapLayerMouseEvent, type MapRef } from 'react-map-gl';
import type { FeatureCollection, Feature, LineString } from 'geojson';
import type { LngLatBoundsLike } from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useTheme } from 'next-themes';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { AlertTriangle, Truck, Train, Plane, Ship, RefreshCw } from 'lucide-react';
import { Skeleton } from './ui/skeleton';
import { type Order } from './real-time-orders';
import { deliveryApi, type Delivery } from '@/lib/api';
import { Button } from './ui/button';

// Fallback mock transit data when backend is unavailable
const fallbackTransitData = {
    trucks: {
        id: 'trucks',
        name: 'Truck',
        icon: Truck,
        color: '#3b82f6',
        routes: [
            { id: 'truck-1', coordinates: [[-74.006, 40.7128], [-75.1652, 39.9526], [-77.0369, 38.9072]] },
            { id: 'truck-2', coordinates: [[-118.2437, 34.0522], [-117.1611, 32.7157]] },
        ]
    },
    trains: {
        id: 'trains',
        name: 'Train',
        icon: Train,
        color: '#16a34a',
        routes: [
            { id: 'train-1', coordinates: [[-87.6298, 41.8781], [-90.1994, 38.6270], [-95.3698, 29.7604]] },
        ]
    },
    flights: {
        id: 'flights',
        name: 'Flight',
        icon: Plane,
        color: '#ef4444',
        routes: [
            { id: 'flight-1', coordinates: [[-74.006, 40.7128], [-118.2437, 34.0522]] },
        ]
    },
    ships: {
        id: 'ships',
        name: 'Ship',
        icon: Ship,
        color: '#8b5cf6',
        routes: []
    }
};

type TransitType = 'trucks' | 'trains' | 'flights' | 'ships';

interface TransitRoute {
    id: string;
    coordinates: number[][];
}

interface TransitData {
    [key: string]: {
        id: string;
        name: string;
        icon: typeof Truck;
        color: string;
        routes: TransitRoute[];
    };
}

interface PopupInfo {
    longitude: number;
    latitude: number;
    type: string;
    orders: string[];
    delivery?: Delivery;
}

// Transform delivery data to route format
const transformDeliveryToRoute = (delivery: Delivery): TransitRoute | null => {
    if (!delivery.route || delivery.route.length < 2) {
        // Create a simple route from current location if no route data
        if (delivery.currentLatitude && delivery.currentLongitude) {
            return {
                id: delivery.id,
                coordinates: [
                    [delivery.currentLongitude, delivery.currentLatitude],
                    [delivery.currentLongitude + 0.1, delivery.currentLatitude + 0.05], // Mock destination
                ]
            };
        }
        return null;
    }
    
    return {
        id: delivery.id,
        coordinates: delivery.route.map(point => [point.lng, point.lat])
    };
};

// Build transit data from real deliveries
const buildTransitDataFromDeliveries = (deliveries: Delivery[]): TransitData => {
    const transitData: TransitData = {
        trucks: { id: 'trucks', name: 'Truck', icon: Truck, color: '#3b82f6', routes: [] },
        trains: { id: 'trains', name: 'Train', icon: Train, color: '#16a34a', routes: [] },
        flights: { id: 'flights', name: 'Flight', icon: Plane, color: '#ef4444', routes: [] },
        ships: { id: 'ships', name: 'Ship', icon: Ship, color: '#8b5cf6', routes: [] },
    };
    
    deliveries.forEach(delivery => {
        const route = transformDeliveryToRoute(delivery);
        if (!route) return;
        
        // Map vehicle type to transit type
        const vehicleType = delivery.vehicleType?.toLowerCase() || 'truck';
        
        if (vehicleType.includes('truck') || vehicleType.includes('van')) {
            transitData.trucks.routes.push(route);
        } else if (vehicleType.includes('train')) {
            transitData.trains.routes.push(route);
        } else if (vehicleType.includes('plane') || vehicleType.includes('flight') || vehicleType.includes('air')) {
            transitData.flights.routes.push(route);
        } else if (vehicleType.includes('ship') || vehicleType.includes('sea')) {
            transitData.ships.routes.push(route);
        } else {
            transitData.trucks.routes.push(route); // Default to truck
        }
    });
    
    return transitData;
};

const generateGeoJson = (
    transitData: TransitData, 
    orders: Order[], 
    selectedOrderId: string | null,
    deliveryMap: Map<string, Delivery>
): FeatureCollection => {
    const features: Feature<LineString>[] = [];
    
    Object.keys(transitData).forEach(type => {
        const transit = transitData[type as TransitType];
        transit.routes.forEach(route => {
            // Find associated orders
            const associatedOrders = orders.filter(o => o.transitId === route.id);
            const isSelected = selectedOrderId 
                ? associatedOrders.some(o => o.id === selectedOrderId)
                : false;
            
            features.push({
                type: 'Feature',
                properties: {
                    type: transit.name,
                    color: transit.color,
                    orders: JSON.stringify(associatedOrders.map(o => o.id)),
                    isSelected,
                    transitId: route.id,
                    deliveryId: route.id,
                },
                geometry: {
                    type: 'LineString',
                    coordinates: route.coordinates,
                },
            });
        });
    });
    
    return { type: 'FeatureCollection', features };
};

const MapLegend = ({ transitData }: { transitData: TransitData }) => (
    <div className="absolute bottom-2 left-2 bg-background/80 backdrop-blur-sm p-2 rounded-md shadow-md text-xs z-10">
        <h4 className="font-bold mb-1">Legend</h4>
        {Object.values(transitData).filter(t => t.routes.length > 0).map(transit => (
            <div key={transit.id} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: transit.color }} />
                <span>{transit.name} ({transit.routes.length})</span>
            </div>
        ))}
        {Object.values(transitData).every(t => t.routes.length === 0) && (
            <p className="text-muted-foreground">No active routes</p>
        )}
    </div>
);

interface LiveRoutesMapProps {
    orders: Order[];
    selectedOrderId: string | null;
}

// Type for bounds array
type BoundsArray = [[number, number], [number, number]];

export default function LiveRoutesMap({ orders, selectedOrderId }: LiveRoutesMapProps) {
    const mapRef = useRef<MapRef>(null);
    const { theme } = useTheme();
    const [popupInfo, setPopupInfo] = useState<PopupInfo | null>(null);
    const [transitData, setTransitData] = useState<TransitData>(fallbackTransitData);
    // FIX: Use lazy initializer to avoid JSX parsing issues with generic syntax
    const [deliveryMap, setDeliveryMap] = useState<Map<string, Delivery>>(() => new Map());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_API_KEY;

    // Fetch real delivery routes from backend
    const fetchDeliveryRoutes = useCallback(async () => {
        try {
            const deliveries = await deliveryApi.getActiveRoutes();
            
            if (deliveries && deliveries.length > 0) {
                const newTransitData = buildTransitDataFromDeliveries(deliveries);
                setTransitData(newTransitData);
                
                // FIX: Build delivery lookup map without generic syntax in JSX
                const newDeliveryMap: Map<string, Delivery> = new Map();
                deliveries.forEach(d => newDeliveryMap.set(d.id, d));
                setDeliveryMap(newDeliveryMap);
                
                setError(null);
            } else {
                // Use fallback data if no deliveries
                setTransitData(fallbackTransitData);
            }
        } catch (err) {
            console.warn('Could not fetch delivery routes, using fallback data:', err);
            // Keep using fallback data
            setTransitData(fallbackTransitData);
            setError('Using demo routes (backend unavailable)');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchDeliveryRoutes();
        
        // Poll for updates every 30 seconds
        const interval = setInterval(fetchDeliveryRoutes, 30000);
        return () => clearInterval(interval);
    }, [fetchDeliveryRoutes]);

    // Pan to selected order's route
    useEffect(() => {
        if (selectedOrderId && mapRef.current) {
            const selectedOrder = orders.find(o => o.id === selectedOrderId);
            if (!selectedOrder || !selectedOrder.transitId) return;

            // Find the route for this order
            let routeCoords: number[][] | undefined;
            
            Object.values(transitData).forEach(transit => {
                const route = transit.routes.find(r => r.id === selectedOrder.transitId);
                if (route) {
                    routeCoords = route.coordinates;
                }
            });

            if (routeCoords && routeCoords.length > 0) {
                // FIX: Use proper typing for bounds calculation
                const initialBounds: BoundsArray = [
                    [routeCoords[0][0], routeCoords[0][1]], 
                    [routeCoords[0][0], routeCoords[0][1]]
                ];
                
                const bounds = routeCoords.reduce<BoundsArray>(
                    (b, coord) => [
                        [Math.min(b[0][0], coord[0]), Math.min(b[0][1], coord[1])],
                        [Math.max(b[1][0], coord[0]), Math.max(b[1][1], coord[1])],
                    ],
                    initialBounds
                );
                
                mapRef.current.fitBounds(bounds as LngLatBoundsLike, { padding: 60, duration: 1000 });
            }
        }
    }, [selectedOrderId, orders, transitData]);

    const geojson = generateGeoJson(transitData, orders, selectedOrderId, deliveryMap);

    const onMouseMove = useCallback((event: MapLayerMouseEvent) => {
        if (event.features && event.features.length > 0) {
            const feature = event.features[0];
            if (mapRef.current) mapRef.current.getCanvas().style.cursor = 'pointer';

            if (feature.geometry.type === 'LineString' && feature.properties) {
                let orderIds = feature.properties.orders;
                if (typeof orderIds === 'string') {
                    try {
                        orderIds = JSON.parse(orderIds);
                    } catch (e) {
                        orderIds = [];
                    }
                }
                
                const deliveryId = feature.properties.deliveryId;
                const delivery = deliveryMap.get(deliveryId);
                
                setPopupInfo({
                    longitude: event.lngLat.lng,
                    latitude: event.lngLat.lat,
                    type: feature.properties.type,
                    orders: Array.isArray(orderIds) ? orderIds : [],
                    delivery,
                });
            }
        }
    }, [deliveryMap]);

    const onMouseLeave = useCallback(() => {
        if (mapRef.current) mapRef.current.getCanvas().style.cursor = '';
        setPopupInfo(null);
    }, []);

    if (!mapboxToken || mapboxToken === 'pk.YOUR_MAPBOX_API_KEY_HERE' || mapboxToken.startsWith('sk.')) {
        return (
            <Alert variant="destructive" className="h-full">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Mapbox Public Key Missing</AlertTitle>
                <AlertDescription>
                    Please add your public Mapbox API key to your `.env` file as 
                    `NEXT_PUBLIC_MAPBOX_API_KEY=pk.YOUR_API_KEY`. You can get a key 
                    from the Mapbox website.
                </AlertDescription>
            </Alert>
        );
    }

    if (!theme || loading) {
        return <Skeleton className="h-full w-full" />;
    }

    return (
        <div className="relative h-full w-full">
            {error && (
                <div className="absolute top-2 right-2 z-20">
                    <Button 
                        variant="outline" 
                        size="sm"
                        onClick={fetchDeliveryRoutes}
                        className="text-xs"
                    >
                        <RefreshCw className="h-3 w-3 mr-1" />
                        Retry
                    </Button>
                </div>
            )}
            <Map
                ref={mapRef}
                mapboxAccessToken={mapboxToken}
                initialViewState={{
                    longitude: -98.5795,
                    latitude: 39.8283,
                    zoom: 3.5,
                }}
                mapStyle={theme === 'dark' 
                    ? 'mapbox://styles/mapbox/dark-v11' 
                    : 'mapbox://styles/mapbox/streets-v11'
                }
                interactiveLayerIds={['routes-layer']}
                onMouseMove={onMouseMove}
                onMouseLeave={onMouseLeave}
                style={{ width: '100%', height: '100%' }}
            >
                <Source id="routes-source" type="geojson" data={geojson}>
                    <Layer
                        id="routes-layer"
                        type="line"
                        paint={{
                            'line-color': ['get', 'color'],
                            'line-width': [
                                'case',
                                ['boolean', ['get', 'isSelected'], false],
                                6,
                                3
                            ],
                            'line-opacity': [
                                'case',
                                ['boolean', ['get', 'isSelected'], false],
                                1.0,
                                0.8
                            ],
                        }}
                        layout={{
                            'line-join': 'round',
                            'line-cap': 'round'
                        }}
                    />
                </Source>
                
                {popupInfo && (popupInfo.orders.length > 0 || popupInfo.delivery) && (
                    <Popup
                        longitude={popupInfo.longitude}
                        latitude={popupInfo.latitude}
                        onClose={() => setPopupInfo(null)}
                        closeButton={false}
                        closeOnClick={false}
                        anchor="bottom"
                        offset={15}
                    >
                        <div className="p-1">
                            <h4 className="font-bold capitalize">{popupInfo.type}</h4>
                            {popupInfo.delivery && (
                                <div className="text-xs space-y-1">
                                    <p>Driver: {popupInfo.delivery.driverName || 'Unknown'}</p>
                                    <p>Status: {popupInfo.delivery.status}</p>
                                    {popupInfo.delivery.estimatedArrival && (
                                        <p>ETA: {new Date(popupInfo.delivery.estimatedArrival).toLocaleString()}</p>
                                    )}
                                </div>
                            )}
                            {popupInfo.orders.length > 0 && (
                                <p className="text-xs mt-1">
                                    Orders: {popupInfo.orders.join(', ')}
                                </p>
                            )}
                        </div>
                    </Popup>
                )}
            </Map>
            <MapLegend transitData={transitData} />
        </div>
    );
}