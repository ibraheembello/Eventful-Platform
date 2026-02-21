let lastRequestTime = 0;

export async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  try {
    // Nominatim requires at most 1 request per second
    const now = Date.now();
    const wait = Math.max(0, 1000 - (now - lastRequestTime));
    if (wait > 0) {
      await new Promise((resolve) => setTimeout(resolve, wait));
    }
    lastRequestTime = Date.now();

    const url = `https://nominatim.openstreetmap.org/search?${new URLSearchParams({
      q: address,
      format: 'json',
      limit: '1',
    })}`;

    const response = await fetch(url, {
      headers: { 'User-Agent': 'Eventful-Platform/1.0' },
    });

    if (!response.ok) return null;

    const results = await response.json() as Array<{ lat: string; lon: string }>;
    if (!results || results.length === 0) return null;

    return {
      lat: parseFloat(results[0].lat),
      lng: parseFloat(results[0].lon),
    };
  } catch {
    return null;
  }
}
