import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { ForecastClient } from '../src/clients/ForecastClient';

describe('ForecastClient - Property Tests', () => {
  it('Property 6: Construcción correcta de la URL de Pronóstico', () => {
    const client = new ForecastClient();
    fc.assert(
      fc.property(
        fc.float({ min: -90, max: 90, noNaN: true }),
        fc.float({ min: -180, max: 180, noNaN: true }),
        (lat, lon) => {
          const url = client.buildUrl(lat, lon);
          const parsed = new URL(url);

          expect(parsed.origin + parsed.pathname).toBe('https://api.open-meteo.com/v1/forecast');
          expect(Number(parsed.searchParams.get('latitude'))).toBeCloseTo(lat, 5);
          expect(Number(parsed.searchParams.get('longitude'))).toBeCloseTo(lon, 5);
          expect(parsed.searchParams.get('current')).toBe(
            'temperature_2m,relative_humidity_2m,precipitation'
          );
        }
      ),
      { numRuns: 100 }
    );
  });
});
