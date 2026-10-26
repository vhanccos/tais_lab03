import { describe, it, expect, vi, beforeEach } from 'vitest';
import { initApp } from '../src/main';

describe('Integration Tests - End to End Flow', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <main class="app-container">
        <section id="form-container"></section>
        <div id="loading-indicator" class="loading-indicator" role="status" style="display: none;"></div>
        <div id="error-container" class="error-box" role="alert" style="display: none;"></div>
        <section id="weather-display-container"></section>
      </main>
    `;
  });

  it('Flujo exitoso: búsqueda -> geocoding -> forecast -> datos visibles en el DOM', async () => {
    // Mock global fetch para geocoding y forecast
    const fetchMock = vi.fn().mockImplementation((url: string) => {
      if (url.includes('geocoding-api.open-meteo.com')) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              results: [
                {
                  id: 1,
                  name: 'Bogotá',
                  latitude: 4.6097,
                  longitude: -74.0817,
                },
              ],
            }),
            { status: 200 }
          )
        );
      } else if (url.includes('api.open-meteo.com/v1/forecast')) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              current: {
                temperature_2m: 17.3,
                relative_humidity_2m: 78,
                precipitation: 1.2,
              },
            }),
            { status: 200 }
          )
        );
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    vi.stubGlobal('fetch', fetchMock);

    const controller = initApp();
    expect(controller).not.toBeNull();

    const input = document.querySelector<HTMLInputElement>('#city-input')!;
    const form = document.querySelector<HTMLFormElement>('#city-search-form')!;

    input.value = 'Bogotá';
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    // Esperar resolución
    await vi.waitFor(() => {
      const cityEl = document.querySelector('#weather-city-name');
      expect(cityEl?.textContent).toBe('Bogotá');
    });

    const tempEl = document.querySelector('#temperature-value');
    const humEl = document.querySelector('#humidity-value');
    const precEl = document.querySelector('#precipitation-value');

    expect(tempEl?.textContent).toBe('17.3 °C');
    expect(humEl?.textContent).toBe('78 %');
    expect(precEl?.textContent).toBe('1.2 mm');

    // Input sigue accesible
    expect(input.disabled).toBe(false);

    vi.unstubAllGlobals();
  });

  it('Flujo de error: geocoding falla -> mensaje visible y City_Input accesible', async () => {
    const fetchMock = vi.fn().mockImplementation((url: string) => {
      if (url.includes('geocoding-api.open-meteo.com')) {
        return Promise.resolve(
          new Response(JSON.stringify({ results: [] }), { status: 200 })
        );
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    vi.stubGlobal('fetch', fetchMock);

    const controller = initApp();
    expect(controller).not.toBeNull();

    const input = document.querySelector<HTMLInputElement>('#city-input')!;
    const form = document.querySelector<HTMLFormElement>('#city-search-form')!;

    input.value = 'NonExistentCity12345';
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    await vi.waitFor(() => {
      const errorEl = document.querySelector('#error-container');
      expect(errorEl?.textContent).toBe('Ciudad no encontrada');
      expect((errorEl as HTMLElement).style.display).toBe('block');
    });

    expect(input.disabled).toBe(false);

    vi.unstubAllGlobals();
  });
});
