
'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Map, { Source, Layer, Popup, type MapLayerMouseEvent, type MapRef } from 'react-map-gl';
import type { FeatureCollection, Feature, LineString } from 'geojson';
import type { LngLatBoundsLike } from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useTheme } from 'next-themes';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { AlertTriangle, Truck, Train, Plane } from 'lucide-react';
import { Skeleton } from './ui/skeleton';
import { type Order } from './real-time-orders';

const transitData = {
    trucks: {
        id: 'trucks',
        name: 'Truck',
        icon: Truck,
        color: '#3b82f6', // blue-500
        routes: [
            { id: 'truck-1', coordinates: [[-74.006, 40.7128], [-75.1652, 39.9526], [-77.0369, 38.9072]] },
            { id: 'truck-2', coordinates: [[-118.2437, 34.0522], [-117.1611, 32.7157]] },
            { id: 'truck-3', coordinates: [[-80.1918, 25.7617], [-84.3880, 33.7490]] },
            { id: 'truck-4', coordinates: [[-104.9903, 39.7392], [-111.8910, 40.7608]] },
            { id: 'truck-5', coordinates: [[-97.7431, 30.2672], [-96.7970, 32.7767]] },
            { id: 'truck-6', coordinates: [[-122.6784, 45.5152], [-122.4194, 37.7749]] },
        ]
    },
    trains: {
        id: 'trains',
        name: 'Train',
        icon: Train,
        color: '#16a34a', // green-600
        routes: [
            { id: 'train-1', coordinates: [[-87.6298, 41.8781], [-90.1994, 38.6270], [-95.3698, 29.7604]] },
            { id: 'train-2', coordinates: [[-122.3321, 47.6062], [-122.4194, 37.7749]] },
            { id: 'train-3', coordinates: [[-71.0589, 42.3601], [-73.935242, 40.730610], [-77.0369, 38.9072]] },
        ]
    },
    flights: {
        id: 'flights',
        name: 'Flight',
        icon: Plane,
        color: '#ef4444', // red-500
        routes: [
             { id: 'flight-1', coordinates: [[-74.006, 40.7128], [-118.2437, 34.0522]] },
             { id: 'flight-2', coordinates: [[-87.6298, 41.8781], [-104.9903, 39.7392]] },
             { id: 'flight-3', coordinates: [[-80.1918, 25.7617], [-87.6298, 41.8781]] },
        ]
    },
};

type TransitType = keyof typeof transitData;

interface PopupInfo {
    longitude: number;
    latitude: number;
    type: string;
    orders: string[];
}

const generateGeoJson = (orders: Order[], selectedOrderId: string | null): FeatureCollection => {
    const features: Feature<LineString>[] = Object.keys(transitData).flatMap((type) =>
        transitData[type as TransitType].routes.map((route) => {
            const associatedOrders = orders.filter(o => o.transitId === route.id);
            const isSelected = selectedOrderId ? associatedOrders.some(o => o.id === selectedOrderId) : false;

            return {
                type: 'Feature',
                properties: {
                    type: transitData[type as TransitType].name,
                    color: transitData[type as TransitType].color,
                    orders: JSON.stringify(associatedOrders.map(o => o.id)),
                    isSelected: isSelected,
                    transitId: route.id,
                },
                geometry: {
                    type: 'LineString',
                    coordinates: route.coordinates,
                },
            };
        })
    );

    return { type: 'FeatureCollection', features };
};

const MapLegend = () => (
    <div className="absolute bottom-2 left-2 bg-background/80 backdrop-blur-sm p-2 rounded-md shadow-md text-xs z-10">
        <h4 className="font-bold mb-1">Legend</h4>
        {Object.values(transitData).map(transit => (
            <div key={transit.id} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: transit.color }} />
                <span>{transit.name}</span>
            </div>
        ))}
    </div>
);

interface LiveRoutesMapProps {
    orders: Order[];
    selectedOrderId: string | null;
}

export default function LiveRoutesMap({ orders, selectedOrderId }: LiveRoutesMapProps) {
    const mapRef = useRef<MapRef>(null);
    const { theme } = useTheme();
    const [popupInfo, setPopupInfo] = useState<PopupInfo | null>(null);

    const geojson = generateGeoJson(orders, selectedOrderId);
    const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_API_KEY;

    useEffect(() => {
        if (selectedOrderId && mapRef.current) {
            const selectedOrder = orders.find(o => o.id === selectedOrderId);
            if (!selectedOrder || !selectedOrder.transitId) return;

            const routeInfo = Object.values(transitData)
                .flatMap(t => t.routes)
                .find(r => r.id === selectedOrder.transitId);

            if (routeInfo) {
                const coords = routeInfo.coordinates;
                const bounds = coords.reduce<LngLatBoundsLike>(
                    (b, coord) => [
                        [Math.min(b[0][0], coord[0]), Math.min(b[0][1], coord[1])],
                        [Math.max(b[1][0], coord[0]), Math.max(b[1][1], coord[1])],
                    ],
                    [[coords[0][0], coords[0][1]], [coords[0][0], coords[0][1]]]
                );
                mapRef.current.fitBounds(bounds, { padding: 60, duration: 1000 });
            }
        }
    }, [selectedOrderId, orders]);


    const onMouseMove = useCallback((event: MapLayerMouseEvent) => {
        if (event.features && event.features.length > 0) {
            const feature = event.features[0];
            if (mapRef.current) mapRef.current.getCanvas().style.cursor = 'pointer';

            if (feature.geometry.type === 'LineString' && feature.properties) {
                let orders = feature.properties.orders;
                if (typeof orders === 'string') {
                    try {
                        orders = JSON.parse(orders);
                    } catch (e) {
                        orders = [];
                    }
                }
                
                setPopupInfo({
                    longitude: event.lngLat.lng,
                    latitude: event.lngLat.lat,
                    type: feature.properties.type,
                    orders: Array.isArray(orders) ? orders : [],
                });
            }
        }
    }, []);

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
                Please add your public Mapbox API key to your `.env` file as `NEXT_PUBLIC_MAPBOX_API_KEY=pk.YOUR_API_KEY`. You can get a key from the Mapbox website.
              </AlertDescription>
            </Alert>
        )
    }

    if (!theme) {
        return <Skeleton className="h-full w-full" />;
    }

    return (
        <div className="relative h-full w-full">
            <Map
                ref={mapRef}
                mapboxAccessToken={mapboxToken}
                initialViewState={{
                    longitude: -98.5795,
                    latitude: 39.8283,
                    zoom: 3.5,
                }}
                mapStyle={theme === 'dark' ? 'mapbox://styles/mapbox/dark-v11' : 'mapbox://styles/mapbox/streets-v11'}
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
                                6, // width for selected
                                3  // default width
                            ],
                            'line-opacity': [
                                'case',
                                ['boolean', ['get', 'isSelected'], false],
                                1.0, // opacity for selected
                                0.8  // default opacity
                            ],
                        }}
                        layout={{
                            'line-join': 'round',
                            'line-cap': 'round'
                        }}
                    />
                </Source>
                {popupInfo && popupInfo.orders.length > 0 && (
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
                            <p className="text-xs">Order IDs: {popupInfo.orders.join(', ')}</p>
                        </div>
                    </Popup>
                )}
            </Map>
            <MapLegend />
        </div>
    );
}
