'use client';
import { useState, useEffect, useRef } from 'react';

interface PlaceResult {
  address: string;
  city: string;
  state: string;
  zip: string;
  lat?: number;
  lng?: number;
}

interface UsePlacesAutocompleteOptions {
  apiKey: string;
  debounceMs?: number;
}

export function usePlacesAutocomplete({ apiKey, debounceMs = 300 }: UsePlacesAutocompleteOptions) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Array<{
    placeId: string;
    description: string;
    mainText: string;
    secondaryText: string;
  }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const abortRef = useRef<AbortController>();

  useEffect(() => {
    if (!query.trim() || query.length < 3) {
      setSuggestions([]);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      if (abortRef.current) abortRef.current.abort();
      abortRef.current = new AbortController();

      setLoading(true);
      setError('');

      try {
        // Use Google Places Autocomplete API
        const res = await fetch(
          `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(query)}&types=address&components=country:us&key=${apiKey}`,
          { signal: abortRef.current.signal }
        );

        if (!res.ok) throw new Error('Autocomplete failed');
        const data = await res.json() as {
          predictions: Array<{ place_id: string; description: string; structured_formatting: { main_text: string; secondary_text: string } }>;
          status: string;
          error_message?: string;
        };

        if (data.status === 'REQUEST_DENIED') {
          setError(data.error_message || 'API key issue');
          setSuggestions([]);
          return;
        }

        setSuggestions(
          (data.predictions || []).map(p => ({
            placeId: p.place_id,
            description: p.description,
            mainText: p.structured_formatting.main_text,
            secondaryText: p.structured_formatting.secondary_text,
          }))
        );
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          setError('Failed to fetch suggestions');
          setSuggestions([]);
        }
      } finally {
        setLoading(false);
      }
    }, debounceMs);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, apiKey, debounceMs]);

  const getPlaceDetails = async (placeId: string): Promise<PlaceResult | null> => {
    try {
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=address_components,formatted_address,geometry&key=${apiKey}`
      );
      if (!res.ok) return null;
      const data = await res.json() as {
        result?: {
          formatted_address?: string;
          geometry?: { location: { lat: number; lng: number } };
          address_components?: Array<{ long_name: string; short_name: string; types: string[] }>;
        };
        status: string;
      };

      if (data.status !== 'OK' || !data.result) return null;

      const comps = data.result.address_components || [];
      const get = (type: string) => comps.find(c => c.types.includes(type))?.long_name ?? '';
      const streetNumber = get('street_number');
      const route = get('route');
      const city = get('locality') || get('sublocality') || get('postal_town');
      const state = get('administrative_area_level_1');
      const zip = get('postal_code');

      return {
        address: [streetNumber, route].filter(Boolean).join(' '),
        city,
        state,
        zip,
        lat: data.result.geometry?.location.lat,
        lng: data.result.geometry?.location.lng,
      };
    } catch {
      return null;
    }
  };

  return { query, setQuery, suggestions, loading, error, getPlaceDetails };
}

// Simple free geocoding using Nominatim (OpenStreetMap) as fallback
export async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1&addressdetails=0`,
      { headers: { 'User-Agent': 'TMSList/1.0' } }
    );
    if (!res.ok) return null;
    const data = await res.json() as Array<{ lat: string; lon: string }>;
    if (data.length === 0) return null;
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  } catch {
    return null;
  }
}

// Check if Google Places API key is configured
export function useGooglePlacesAvailable() {
  // Client-side check — actual API key should be in env
  const [available, setAvailable] = useState(false);
  useEffect(() => {
    fetch('/api/health')
      .then(r => r.json())
      .then(() => setAvailable(true))
      .catch(() => setAvailable(false));
  }, []);
  return available;
}