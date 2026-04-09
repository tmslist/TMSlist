import { useState, useEffect, useCallback, useRef } from 'react';

// Leaflet type declarations for window-loaded library
declare namespace L {
  interface Map {
    setView(center: [number, number], zoom: number): Map;
    addLayer(layer: unknown): Map;
    on(event: string, fn: (...args: unknown[]) => void): Map;
    getBounds(): LatLngBounds;
    getCenter(): LatLng;
    remove(): void;
  }
  interface LatLngBounds {
    getNorthEast(): LatLng;
    getSouthWest(): LatLng;
  }
  interface LatLng {
    lat: number;
    lng: number;
  }
  interface MarkerClusterGroup {
    clearLayers(): void;
    addLayer(layer: unknown): void;
  }
}

interface MapClinic {
  id: string;
  slug: string;
  name: string;
  city: string;
  state: string;
  lat: number;
  lng: number;
  rating: number;
  reviewCount: number;
  verified: boolean;
  phone?: string;
  machines?: string[];
  distance?: number;
}

interface Props {
  initialLat?: number;
  initialLng?: number;
  initialZoom?: number;
  singleClinic?: { name: string; lat: number; lng: number; address: string };
  height?: string;
}

export default function ClinicMap({ initialLat, initialLng, initialZoom, singleClinic, height = '500px' }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.MarkerClusterGroup | null>(null);
  const [clinics, setClinics] = useState<MapClinic[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedClinic, setSelectedClinic] = useState<MapClinic | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [mapReady, setMapReady] = useState(false);

  // Load Leaflet dynamically (client-side only)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Add Leaflet CSS
    if (!document.querySelector('link[href*="leaflet"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    // Add MarkerCluster CSS
    if (!document.querySelector('link[href*="MarkerCluster"]')) {
      const link1 = document.createElement('link');
      link1.rel = 'stylesheet';
      link1.href = 'https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css';
      document.head.appendChild(link1);
      const link2 = document.createElement('link');
      link2.rel = 'stylesheet';
      link2.href = 'https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.Default.css';
      document.head.appendChild(link2);
    }

    // Load Leaflet JS
    const loadScript = (src: string): Promise<void> => {
      return new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) {
          resolve();
          return;
        }
        const script = document.createElement('script');
        script.src = src;
        script.onload = () => resolve();
        script.onerror = reject;
        document.head.appendChild(script);
      });
    };

    loadScript('https://unpkg.com/leaflet@1.9.4/dist/leaflet.js')
      .then(() => loadScript('https://unpkg.com/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js'))
      .then(() => {
        initMap();
        setMapReady(true);
      })
      .catch(() => setError('Failed to load map library'));
  }, []);

  const initMap = useCallback(() => {
    if (!mapRef.current || mapInstanceRef.current) return;
    const L = (window as any).L;
    if (!L) return;

    const center: [number, number] = singleClinic
      ? [singleClinic.lat, singleClinic.lng]
      : [initialLat || 39.8283, initialLng || -98.5795];
    const zoom = singleClinic ? 15 : (initialZoom || 4);

    const map = L.map(mapRef.current, {
      scrollWheelZoom: !singleClinic,
      zoomControl: true,
    }).setView(center, zoom);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    mapInstanceRef.current = map;

    // Single clinic mode - just place one marker
    if (singleClinic) {
      const icon = L.divIcon({
        className: 'custom-marker',
        html: `<div style="background:#2563eb;width:32px;height:32px;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/></svg>
        </div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
      });
      L.marker(center, { icon }).addTo(map)
        .bindPopup(`<strong>${singleClinic.name}</strong><br/>${singleClinic.address}`);
      return;
    }

    // Create marker cluster group
    markersRef.current = L.markerClusterGroup({
      maxClusterRadius: 50,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      iconCreateFunction: (cluster: any) => {
        const count = cluster.getChildCount();
        let size = 'small';
        if (count >= 50) size = 'large';
        else if (count >= 10) size = 'medium';
        return L.divIcon({
          html: `<div style="background:#2563eb;color:white;width:${size === 'large' ? 48 : size === 'medium' ? 40 : 32}px;height:${size === 'large' ? 48 : size === 'medium' ? 40 : 32}px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:${size === 'large' ? 14 : 12}px;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);">${count}</div>`,
          className: 'custom-cluster',
          iconSize: [size === 'large' ? 48 : size === 'medium' ? 40 : 32, size === 'large' ? 48 : size === 'medium' ? 40 : 32],
        });
      },
    });
    map.addLayer(markersRef.current);

    // Load clinics on map move
    map.on('moveend', () => {
      const bounds = map.getBounds();
      const center = map.getCenter();
      fetchClinicsInView(center.lat, center.lng, bounds);
    });
  }, [singleClinic, initialLat, initialLng, initialZoom]);

  const fetchClinicsInView = useCallback(async (lat: number, lng: number, bounds: any) => {
    setLoading(true);
    try {
      // Calculate radius from bounds
      const ne = bounds.getNorthEast();
      const sw = bounds.getSouthWest();
      const latDiff = Math.abs(ne.lat - sw.lat);
      const radius = Math.min(Math.max(latDiff * 69 / 2, 5), 200); // miles

      const res = await fetch(`/api/clinics/nearby?lat=${lat}&lng=${lng}&radius=${Math.round(radius)}&limit=100`);
      if (res.ok) {
        const { data } = await res.json();
        setClinics(data);
        updateMarkers(data);
      }
    } catch {
      setError('Failed to load clinics');
    } finally {
      setLoading(false);
    }
  }, []);

  const updateMarkers = useCallback((clinicList: MapClinic[]) => {
    const L = (window as any).L;
    if (!L || !markersRef.current) return;

    markersRef.current.clearLayers();

    clinicList.forEach((clinic) => {
      if (!clinic.lat || !clinic.lng) return;

      const icon = L.divIcon({
        className: 'custom-marker',
        html: `<div style="background:${clinic.verified ? '#059669' : '#6366f1'};width:28px;height:28px;border-radius:50%;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.25);display:flex;align-items:center;justify-content:center;cursor:pointer;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/></svg>
        </div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 28],
        popupAnchor: [0, -28],
      });

      const rating = typeof clinic.rating === 'number' ? clinic.rating : 0;
      const marker = L.marker([clinic.lat, clinic.lng], { icon })
        .bindPopup(`
          <div style="min-width:200px;font-family:system-ui,-apple-system,sans-serif;">
            <h3 style="margin:0 0 4px;font-size:14px;font-weight:700;">${clinic.name}</h3>
            <p style="margin:0 0 6px;font-size:12px;color:#64748b;">${clinic.city}, ${clinic.state}</p>
            <div style="display:flex;gap:8px;align-items:center;margin-bottom:8px;">
              <span style="color:#f59e0b;font-weight:600;font-size:13px;">${rating.toFixed(1)} ★</span>
              ${clinic.verified ? '<span style="font-size:11px;background:#d1fae5;color:#065f46;padding:1px 6px;border-radius:9999px;">Verified</span>' : ''}
            </div>
            ${clinic.distance ? `<p style="margin:0 0 8px;font-size:12px;color:#64748b;">${clinic.distance.toFixed(1)} miles away</p>` : ''}
            <a href="/clinic/${clinic.slug}" style="display:inline-block;background:#2563eb;color:white;padding:6px 14px;border-radius:8px;font-size:12px;font-weight:600;text-decoration:none;">View Profile</a>
          </div>
        `);

      marker.on('click', () => setSelectedClinic(clinic));
      markersRef.current.addLayer(marker);
    });
  }, []);

  // Geolocate user
  const locateUser = useCallback(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        if (mapInstanceRef.current) {
          mapInstanceRef.current.setView([latitude, longitude], 10);

          // Add user marker
          const L = (window as any).L;
          const userIcon = L.divIcon({
            className: 'user-marker',
            html: `<div style="width:16px;height:16px;background:#3b82f6;border:3px solid white;border-radius:50%;box-shadow:0 0 0 4px rgba(59,130,246,0.3);"></div>`,
            iconSize: [16, 16],
            iconAnchor: [8, 8],
          });
          L.marker([latitude, longitude], { icon: userIcon, zIndexOffset: 1000 })
            .addTo(mapInstanceRef.current)
            .bindPopup('Your Location');
        }
      },
      () => setError('Location access denied. Search by city instead.'),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  // Single clinic mode renders minimal
  if (singleClinic) {
    return (
      <div className="rounded-2xl overflow-hidden border border-slate-100 shadow-sm">
        <div ref={mapRef} style={{ height: height || '300px', width: '100%' }} />
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Controls bar */}
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={locateUser}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Find Near Me
        </button>
        {loading && (
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <div className="w-4 h-4 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin" />
            Loading clinics...
          </div>
        )}
        {clinics.length > 0 && !loading && (
          <span className="text-sm text-slate-500 font-medium">
            {clinics.length} clinics in view
          </span>
        )}
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-100 text-red-700 text-sm rounded-xl">
          {error}
        </div>
      )}

      {/* Map + sidebar layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div ref={mapRef} style={{ height, width: '100%' }} className="rounded-2xl border border-slate-200 shadow-sm" />
        </div>

        {/* Clinic list sidebar */}
        <div className="lg:col-span-1 max-h-[500px] overflow-y-auto space-y-3 pr-1">
          {clinics.length === 0 && !loading && mapReady && (
            <div className="text-center py-12 text-slate-400">
              <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              </svg>
              <p className="font-medium">Click "Find Near Me" or zoom into an area</p>
              <p className="text-sm mt-1">to discover TMS clinics</p>
            </div>
          )}

          {clinics.map((clinic) => {
            const rating = typeof clinic.rating === 'number' ? clinic.rating : 0;
            return (
              <button
                key={clinic.id}
                onClick={() => {
                  setSelectedClinic(clinic);
                  if (mapInstanceRef.current) {
                    mapInstanceRef.current.setView([clinic.lat, clinic.lng], 14);
                  }
                }}
                className={`w-full text-left p-4 rounded-xl border transition-all ${
                  selectedClinic?.id === clinic.id
                    ? 'border-blue-300 bg-blue-50 shadow-sm'
                    : 'border-slate-100 bg-white hover:border-slate-200 hover:shadow-sm'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h4 className="font-semibold text-sm text-slate-900 truncate">{clinic.name}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">{clinic.city}, {clinic.state}</p>
                  </div>
                  {clinic.verified && (
                    <span className="shrink-0 text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-semibold border border-emerald-100">
                      Verified
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-xs font-medium text-amber-600">{rating.toFixed(1)} ★</span>
                  {clinic.distance && (
                    <span className="text-xs text-slate-400">{clinic.distance.toFixed(1)} mi</span>
                  )}
                </div>
                <a
                  href={`/clinic/${clinic.slug}`}
                  className="inline-block mt-2 text-xs font-semibold text-blue-600 hover:text-blue-700"
                  onClick={(e) => e.stopPropagation()}
                >
                  View Profile →
                </a>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
