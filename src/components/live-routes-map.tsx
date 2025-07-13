
'use client';

import { useState, useRef, useEffect } from 'react';
import Map, { Source, Layer, Popup, type MapLayerMouseEvent, type MapRef } from 'react-map-gl';
import type { FeatureCollection } from 'geojson';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useTheme } from 'next-themes';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { AlertTriangle } from 'lucide-react';
import { Skeleton } from './ui/skeleton';

const transitData = {
    trucks: [
        {
            id: 'truck-1',
            color: '#3b82f6', // blue-500
            orders: ['ORD789', 'ORD790'],
            coordinates: [[-74.006, 40.7128], [-75.1652, 39.9526], [-77.0369, 38.9072]],
        },
        {
            id: 'truck-2',
            color: '#3b82f6',
            orders: ['ORD791'],
            coordinates: [[-118.2437, 34.0522], [-117.1611, 32.7157]],
        },
    ],
    trains: [
        {
            id: 'train-1',
            color: '#16a34a', // green-600
            orders: ['ORD801', 'ORD802', 'ORD803'],
            coordinates: [[-87.6298, 41.8781], [-90.1994, 38.6270], [-95.3698, 29.7604]],
        },
    ],
    flights: [
        {
            id: 'flight-1',
            color: '#ef4444', // red-500
            orders: ['ORD905', 'ORD906'],
            coordinates: [[-74.006, 40.7128], [-118.2437, 34.0522]],
        },
    ],
};

type TransitType = keyof typeof transitData;

interface PopupInfo {
    longitude: number;
    latitude: number;
    type: string;
    orders: string[];
}

const geojson: FeatureCollection = {
    type: 'FeatureCollection',
    features: Object.keys(transitData).flatMap((type) =>
        transitData[type as TransitType].map((item) => ({
            type: 'Feature',
            properties: {
                type: type.slice(0, -1), // truck, train, flight
                color: item.color,
                orders: item.orders,
            },
            geometry: {
                type: 'LineString',
                coordinates: item.coordinates,
            },
        }))
    ),
};

export default function LiveRoutesMap() {
    const mapRef = useRef<MapRef>(null);
    const { theme } = useTheme();
    const [popupInfo, setPopupInfo] = useState<PopupInfo | null>(null);

    const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_API_KEY;

    const onClick = (event: MapLayerMouseEvent) => {
        if (event.features && event.features.length > 0) {
            const feature = event.features[0];
            if (feature.geometry.type === 'LineString' && feature.properties) {
                setPopupInfo({
                    longitude: event.lngLat.lng,
                    latitude: event.lngLat.lat,
                    type: feature.properties.type,
                    orders: feature.properties.orders,
                });
            }
        }
    };
    
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
            onClick={onClick}
            style={{ width: '100%', height: '100%' }}
        >
            <Source id="routes-source" type="geojson" data={geojson}>
                <Layer
                    id="routes-layer"
                    type="line"
                    paint={{
                        'line-color': ['get', 'color'],
                        'line-width': 3,
                        'line-opacity': 0.8,
                    }}
                    layout={{
                        'line-join': 'round',
                        'line-cap': 'round'
                    }}
                />
            </Source>
            {popupInfo && (
                <Popup
                    longitude={popupInfo.longitude}
                    latitude={popupInfo.latitude}
                    onClose={() => setPopupInfo(null)}
                    closeButton={true}
                    closeOnClick={false}
                    anchor="bottom"
                >
                    <div className="p-1">
                        <h4 className="font-bold capitalize">{popupInfo.type}</h4>
                        <p className="text-xs">Order IDs: {popupInfo.orders.join(', ')}</p>
                    </div>
                </Popup>
            )}
        </Map>
    );
}
