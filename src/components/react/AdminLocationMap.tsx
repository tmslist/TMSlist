'use client';
import { useState, useEffect, useRef } from 'react';

interface Props {
  lat: string | null;
  lng: string | null;
  onLocationChange: (lat: string, lng: string) => void;
  className?: string;
}

export default function AdminLocationMap({ lat, lng, onLocationChange, className = '' }: Props) {
  const [latVal, setLatVal] = useState(lat ?? '');
  const [lngVal, setLngVal] = useState(lng ?? '');
  const [mapLoaded, setMapLoaded] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  useEffect(() => {
    setLatVal(lat ?? '');
    setLngVal(lng ?? '');
  }, [lat, lng]);

  const initMap = async () => {
    if (!mapRef.current || leafletRef.current) return;

    // Dynamically load Leaflet CSS
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    // Dynamically load Leaflet JS
    if (!(window as any).L) {
      await new Promise<void>((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.onload = () => resolve();
        script.onerror = () => reject();
        document.head.appendChild(script);
      });
    }

    const L = (window as any).L;
    const initialLat = latVal ? parseFloat(latVal) : 39.8283;
    const initialLng = lngVal ? parseFloat(lngVal) : -98.5795;

    const map = L.map(mapRef.current!).setView([initialLat, initialLng], latVal ? 14 : 4);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    // Add marker if coords exist
    if (latVal && lngVal) {
      const marker = L.marker([initialLat, initialLng], { draggable: true }).addTo(map);
      marker.on('dragend', () => {
        const pos = marker.getLatLng();
        const latStr = pos.lat.toFixed(7);
        const lngStr = pos.lng.toFixed(7);
        setLatVal(latStr);
        setLngVal(lngStr);
        onLocationChange(latStr, lngStr);
      });
      markerRef.current = marker;
    }

    // Click to set marker
    map.on('click', (e: any) => {
      const { lat: clickLat, lng: clickLng } = e;
      const latStr = clickLat.toFixed(7);
      const lngStr = clickLng.toFixed(7);
      setLatVal(latStr);
      setLngVal(lngStr);

      if (markerRef.current) {
        markerRef.current.setLatLng([clickLat, clickLng]);
      } else {
        const marker = L.marker([clickLat, clickLng], { draggable: true }).addTo(map);
        marker.on('dragend', () => {
          const pos = marker.getLatLng();
          const latS = pos.lat.toFixed(7);
          const lngS = pos.lng.toFixed(7);
          setLatVal(latS);
          setLngVal(lngS);
          onLocationChange(latS, lngS);
        });
        markerRef.current = marker;
      }

      onLocationChange(latStr, lngStr);
    });

    leafletRef.current = map;
    setMapLoaded(true);
  };

  return (
    <div className={`${className}`}>
      {/* Coordinate inputs */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <label className="block text-xs font-medium text-[var(--ink2)] mb-1">Latitude</label>
          <input
            type="text"
            value={latVal}
            onChange={e => setLatVal(e.target.value)}
            onBlur={() => {
              if (latVal && lngVal) onLocationChange(latVal, lngVal);
            }}
            placeholder="e.g. 37.7749295"
            className="w-full px-3 py-2 border border-[var(--line)] rounded-lg text-sm font-mono focus:ring-2 focus:ring-[#1E2A3B] focus:border-[var(--ink2)] outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-[var(--ink2)] mb-1">Longitude</label>
          <input
            type="text"
            value={lngVal}
            onChange={e => setLngVal(e.target.value)}
            onBlur={() => {
              if (latVal && lngVal) onLocationChange(latVal, lngVal);
            }}
            placeholder="e.g. -122.4194155"
            className="w-full px-3 py-2 border border-[var(--line)] rounded-lg text-sm font-mono focus:ring-2 focus:ring-[#1E2A3B] focus:border-[var(--ink2)] outline-none"
          />
        </div>
      </div>

      {/* Map */}
      <div className="relative">
        <button
          type="button"
          onClick={initMap}
          className="mb-2 px-3 py-1.5 text-xs font-medium border border-[var(--line)] rounded-lg text-[var(--ink2)] hover:bg-[var(--paper2)] transition-colors"
        >
          {mapLoaded ? 'Refresh Map' : 'Open Map (click to place marker)'}
        </button>
        <div
          ref={mapRef}
          className="w-full h-64 border border-[var(--line)] rounded-lg overflow-hidden"
          style={{ display: mapLoaded ? 'block' : 'none' }}
        />
        {!mapLoaded && (
          <div className="w-full h-64 border border-[var(--line)] rounded-lg flex items-center justify-center bg-[var(--paper2)]">
            <p className="text-xs text-[var(--muted)]">Click "Open Map" to interactively place the marker</p>
          </div>
        )}
      </div>

      {latVal && lngVal && (
        <p className="mt-1.5 text-xs text-emerald-600 flex items-center gap-1">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Pin set at {latVal}, {lngVal}
        </p>
      )}
    </div>
  );
}