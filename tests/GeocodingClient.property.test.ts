import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { GeocodingClient } from '../src/clients/GeocodingClient';

describe('GeocodingClient - Property Tests', () => {
  it('Property 3: Construcción correcta de la URL de Geocodificación', () => {
    const client = new GeocodingClient();
    fc.assert(
      fc.property(fc.string({ minLength: 1 }), (cityName) => {
        const url = client.buildUrl(cityName);
        const parsed = new URL(url);

        expect(parsed.origin + parsed.pathname).toBe('https://geocoding-api.open-meteo.com/v1/search');
        expect(parsed.searchParams.get('name')).toBe(cityName);
        expect(parsed.searchParams.get('count')).toBe('1');
      }),
      { numRuns: 100 }
    );
  });
});
