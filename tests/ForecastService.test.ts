import { describe, it, expect, vi } from 'vitest';
import * as fc from 'fast-check';
import { ForecastService } from '../src/services/ForecastService';
import { ForecastClient } from '../src/clients/ForecastClient';

describe('ForecastService - Property Tests', () => {
  it('Property 7: Round-trip de parseo de la respuesta Forecast -> WeatherData', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          temperature_2m: fc.float({ noDefaultInfinity: true, noNaN: true }),
          relative_humidity_2m: fc.float({ noDefaultInfinity: true, noNaN: true }),
          precipitation: fc.float({ noDefaultInfinity: true, noNaN: true }),
        }),
        async (current) => {
          const fakeClient = {
            getForecast: vi.fn().mockResolvedValue(
              new Response(JSON.stringify({ current }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
              })
            ),
            buildUrl: vi.fn(),
          } as unknown as ForecastClient;

          const service = new ForecastService(fakeClient);
          const result = await service.getForecast(40, -3);

          expect(result.success).toBe(true);
          if (result.success) {
            expect(result.data.temperature == current.temperature_2m).toBe(true);
            expect(result.data.humidity == current.relative_humidity_2m).toBe(true);
            expect(result.data.precipitation == current.precipitation).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 10: Campos meteorológicos faltantes generan INCOMPLETE_DATA', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.tuple(
          fc.oneof(fc.constant(null), fc.constant(undefined), fc.constant(NaN), fc.float({ noDefaultInfinity: true, noNaN: true })),
          fc.oneof(fc.constant(null), fc.constant(undefined), fc.constant(NaN), fc.float({ noDefaultInfinity: true, noNaN: true })),
          fc.oneof(fc.constant(null), fc.constant(undefined), fc.constant(NaN), fc.float({ noDefaultInfinity: true, noNaN: true }))
        ).filter(([t, h, p]) => (
          t === null || t === undefined || Number.isNaN(t) ||
          h === null || h === undefined || Number.isNaN(h) ||
          p === null || p === undefined || Number.isNaN(p)
        )),
        async ([t, h, p]) => {
          const current: Record<string, any> = {};
          if (t !== undefined) current.temperature_2m = t;
          if (h !== undefined) current.relative_humidity_2m = h;
          if (p !== undefined) current.precipitation = p;

          const fakeClient = {
            getForecast: vi.fn().mockResolvedValue(
              new Response(JSON.stringify({ current }), { status: 200 })
            ),
            buildUrl: vi.fn(),
          } as unknown as ForecastClient;

          const service = new ForecastService(fakeClient);
          const result = await service.getForecast(10, 20);

          expect(result.success).toBe(false);
          if (!result.success) {
            expect(result.error.type).toBe('INCOMPLETE_DATA');
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 8 (Forecast): Respuestas HTTP no-2xx siempre generan SERVICE_ERROR', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 300, max: 599 }).filter((code) => code !== 304),
        async (statusCode) => {
          const fakeClient = {
            getForecast: vi.fn().mockResolvedValue(
              new Response('Error', { status: statusCode })
            ),
            buildUrl: vi.fn(),
          } as unknown as ForecastClient;

          const service = new ForecastService(fakeClient);
          const result = await service.getForecast(10, 20);

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

  it('Property 9 (Forecast): Respuestas 2xx con cuerpo inválido generan INVALID_RESPONSE', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.oneof(
          fc.constant('not valid json'),
          fc.constant(''),
          fc.constant('{"no_current_field": 123}'),
          fc.constant('{"current": "not an object"}')
        ),
        async (invalidBody) => {
          const fakeClient = {
            getForecast: vi.fn().mockResolvedValue(
              new Response(invalidBody, { status: 200 })
            ),
            buildUrl: vi.fn(),
          } as unknown as ForecastClient;

          const service = new ForecastService(fakeClient);
          const result = await service.getForecast(10, 20);

          expect(result.success).toBe(false);
          if (!result.success) {
            expect(result.error.type).toBe('INVALID_RESPONSE');
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('ForecastService - Unit Tests', () => {
  it('Retorna NETWORK_ERROR ante un fallo de red', async () => {
    const fakeClient = {
      getForecast: vi.fn().mockRejectedValue(new TypeError('Failed to fetch')),
    } as unknown as ForecastClient;

    const service = new ForecastService(fakeClient);
    const result = await service.getForecast(10, 20);
    expect(result).toEqual({ success: false, error: { type: 'NETWORK_ERROR' } });
  });

  it('Retorna TIMEOUT ante un AbortError', async () => {
    const abortError = new Error('The operation was aborted');
    abortError.name = 'AbortError';

    const fakeClient = {
      getForecast: vi.fn().mockRejectedValue(abortError),
    } as unknown as ForecastClient;

    const service = new ForecastService(fakeClient);
    const result = await service.getForecast(10, 20);
    expect(result).toEqual({ success: false, error: { type: 'TIMEOUT' } });
  });

  it('Retorna datos válidos cuando la respuesta es exitosa y completa', async () => {
    const fakeClient = {
      getForecast: vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            current: {
              temperature_2m: 21.5,
              relative_humidity_2m: 65,
              precipitation: 0.2,
            },
          }),
          { status: 200 }
        )
      ),
    } as unknown as ForecastClient;

    const service = new ForecastService(fakeClient);
    const result = await service.getForecast(10, 20);
    expect(result).toEqual({
      success: true,
      data: {
        temperature: 21.5,
        humidity: 65,
        precipitation: 0.2,
      },
    });
  });
});
