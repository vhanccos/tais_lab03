import { describe, it, expect, vi } from 'vitest';
import * as fc from 'fast-check';
import { GeocodingService } from '../src/services/GeocodingService';
import { GeocodingClient } from '../src/clients/GeocodingClient';

describe('GeocodingService - Property Tests', () => {
  it('Property 4: Extracción de coordenadas del primer resultado sin modificar', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          latitude: fc.float({ noDefaultInfinity: true, noNaN: true }),
          longitude: fc.float({ noDefaultInfinity: true, noNaN: true }),
          name: fc.string(),
        }),
        async (item) => {
          const fakeClient = {
            search: vi.fn().mockResolvedValue(
              new Response(JSON.stringify({ results: [item] }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
              })
            ),
            buildUrl: vi.fn(),
          } as unknown as GeocodingClient;

          const service = new GeocodingService(fakeClient);
          const result = await service.geocode('AnyCity');

          expect(result.success).toBe(true);
          if (result.success) {
            expect(result.data.latitude == item.latitude).toBe(true);
            expect(result.data.longitude == item.longitude).toBe(true);
            expect(result.data.cityName).toBe(item.name);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 5: Validación de campos de coordenadas faltantes retorna CITY_NOT_FOUND', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          latitude: fc.oneof(fc.constant(null), fc.constant(undefined), fc.constant(NaN)),
          longitude: fc.oneof(fc.constant(null), fc.constant(undefined), fc.constant(NaN), fc.float()),
          name: fc.string(),
        }),
        async (invalidItem) => {
          const fakeClient = {
            search: vi.fn().mockResolvedValue(
              new Response(JSON.stringify({ results: [invalidItem] }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
              })
            ),
            buildUrl: vi.fn(),
          } as unknown as GeocodingClient;

          const service = new GeocodingService(fakeClient);
          const result = await service.geocode('TestCity');

          expect(result.success).toBe(false);
          if (!result.success) {
            expect(result.error.type).toBe('CITY_NOT_FOUND');
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 8 (Geocoding): Respuestas HTTP no-2xx siempre generan SERVICE_ERROR', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 300, max: 599 }).filter((code) => code !== 304),
        async (statusCode) => {
          const fakeClient = {
            search: vi.fn().mockResolvedValue(
              new Response('Error', {
                status: statusCode,
              })
            ),
            buildUrl: vi.fn(),
          } as unknown as GeocodingClient;

          const service = new GeocodingService(fakeClient);
          const result = await service.geocode('TestCity');

          expect(result.success).toBe(false);
          if (!result.success) {
            expect(result.error.type).toBe('SERVICE_ERROR');
            if (result.error.type === 'SERVICE_ERROR') {
              expect(result.error.statusCode).toBe(statusCode);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('GeocodingService - Unit Tests', () => {
  it('Retorna CITY_NOT_FOUND cuando results está vacío', async () => {
    const fakeClient = {
      search: vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ results: [] }), { status: 200 })
      ),
    } as unknown as GeocodingClient;

    const service = new GeocodingService(fakeClient);
    const result = await service.geocode('Desconocida');
    expect(result).toEqual({ success: false, error: { type: 'CITY_NOT_FOUND' } });
  });

  it('Retorna NETWORK_ERROR ante un fallo de red', async () => {
    const fakeClient = {
      search: vi.fn().mockRejectedValue(new TypeError('Failed to fetch')),
    } as unknown as GeocodingClient;

    const service = new GeocodingService(fakeClient);
    const result = await service.geocode('Paris');
    expect(result).toEqual({ success: false, error: { type: 'NETWORK_ERROR' } });
  });

  it('Retorna TIMEOUT ante un AbortError', async () => {
    const abortError = new Error('The operation was aborted');
    abortError.name = 'AbortError';

    const fakeClient = {
      search: vi.fn().mockRejectedValue(abortError),
    } as unknown as GeocodingClient;

    const service = new GeocodingService(fakeClient);
    const result = await service.geocode('Paris');
    expect(result).toEqual({ success: false, error: { type: 'TIMEOUT' } });
  });

  it('Retorna INVALID_RESPONSE ante un cuerpo malformado', async () => {
    const fakeClient = {
      search: vi.fn().mockResolvedValue(
        new Response('Not JSON', { status: 200 })
      ),
    } as unknown as GeocodingClient;

    const service = new GeocodingService(fakeClient);
    const result = await service.geocode('Paris');
    expect(result).toEqual({ success: false, error: { type: 'INVALID_RESPONSE' } });
  });
});
