import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { WeatherDisplay } from '../src/components/WeatherDisplay';

describe('WeatherDisplay - Property Tests', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  it('Property 12: Weather_Display contiene todos los campos con sus unidades', () => {
    const display = new WeatherDisplay(container);

    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
        fc.record({
          temperature: fc.float({ min: -60, max: 60, noDefaultInfinity: true, noNaN: true }),
          humidity: fc.float({ min: 0, max: 100, noDefaultInfinity: true, noNaN: true }),
          precipitation: fc.float({ min: 0, max: 500, noDefaultInfinity: true, noNaN: true }),
        }),
        (cityName, weather) => {
          display.render(cityName, weather);

          const cityEl = container.querySelector('#weather-city-name');
          const tempEl = container.querySelector('#temperature-value');
          const humEl = container.querySelector('#humidity-value');
          const precEl = container.querySelector('#precipitation-value');

          expect(cityEl?.textContent).toBe(cityName);
          expect(tempEl?.textContent).toContain('°C');
          expect(humEl?.textContent).toContain('%');
          expect(precEl?.textContent).toContain('mm');
        }
      ),
      { numRuns: 100 }
    );
  });
});
