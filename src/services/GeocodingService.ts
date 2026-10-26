import { GeocodingClient } from '../clients/GeocodingClient.js';
import type { Coordinates, GeocodingResult } from '../types/index.js';

export class GeocodingService {
  constructor(private client: GeocodingClient = new GeocodingClient()) {}

  async geocode(cityName: string): Promise<GeocodingResult> {
    let response: Response;
    try {
      response = await this.client.search(cityName);
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        return { success: false, error: { type: 'TIMEOUT' } };
      }
      return { success: false, error: { type: 'NETWORK_ERROR' } };
    }

    if (!response.ok) {
      return {
        success: false,
        error: { type: 'SERVICE_ERROR', statusCode: response.status },
      };
    }

    let data: any;
    try {
      data = await response.json();
    } catch {
      return { success: false, error: { type: 'INVALID_RESPONSE' } };
    }

    if (!data || !Array.isArray(data.results) || data.results.length === 0) {
      return { success: false, error: { type: 'CITY_NOT_FOUND' } };
    }

    const first = data.results[0];
    if (
      first === null ||
      typeof first !== 'object' ||
      typeof first.latitude !== 'number' ||
      Number.isNaN(first.latitude) ||
      typeof first.longitude !== 'number' ||
      Number.isNaN(first.longitude)
    ) {
      return { success: false, error: { type: 'CITY_NOT_FOUND' } };
    }

    const coordinates: Coordinates = {
      latitude: first.latitude,
      longitude: first.longitude,
      cityName: typeof first.name === 'string' ? first.name : cityName,
    };

    return { success: true, data: coordinates };
  }
}
