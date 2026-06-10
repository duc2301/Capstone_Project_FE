export interface GeocodeResult {
  lat: number;
  lng: number;
  displayName: string;
}

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';

export async function geocodeAddress(query: string): Promise<GeocodeResult | null> {
  const q = query.trim();
  if (!q) return null;

  const params = new URLSearchParams({
    q,
    format: 'jsonv2',
    limit: '1',
    'accept-language': 'vi',
  });

  const res = await fetch(`${NOMINATIM_URL}?${params.toString()}`, {
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) throw new Error('Geocoding request failed');

  const data = (await res.json()) as Array<{ lat: string; lon: string; display_name: string }>;
  if (data.length === 0) return null;

  const { lat, lon, display_name } = data[0];
  return {
    lat: Number.parseFloat(lat),
    lng: Number.parseFloat(lon),
    displayName: display_name,
  };
}
