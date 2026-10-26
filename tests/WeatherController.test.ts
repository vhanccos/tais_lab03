import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { WeatherController } from '../src/WeatherController';
import { GeocodingService } from '../src/services/GeocodingService';
import { ForecastService } from '../src/services/ForecastService';
import { CitySearchForm } from '../src/components/CitySearchForm';
import { WeatherDisplay } from '../src/components/WeatherDisplay';
import { LoadingIndicator } from '../src/components/LoadingIndicator';
import { ErrorMessage } from '../src/components/ErrorMessage';

describe('WeatherController - Property & Unit Tests', () => {
  let formContainer: HTMLElement;
  let displayContainer: HTMLElement;
  let loadingEl: HTMLElement;
  let errorEl: HTMLElement;

  let searchForm: CitySearchForm;
  let weatherDisplay: WeatherDisplay;
  let loadingIndicator: LoadingIndicator;
  let errorMessage: ErrorMessage;

  beforeEach(() => {
    formContainer = document.createElement('div');
    displayContainer = document.createElement('div');
    loadingEl = document.createElement('div');
    errorEl = document.createElement('div');

    searchForm = new CitySearchForm(formContainer);
    weatherDisplay = new WeatherDisplay(displayContainer);
    loadingIndicator = new LoadingIndicator(loadingEl);
    errorMessage = new ErrorMessage(errorEl);
  });

  it('Property 13: Limpieza del Weather_Display al iniciar nueva búsqueda', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
        async (cityName) => {
          // Poblamos displayContainer previamente
          weatherDisplay.render('Anterior', { temperature: 20, humidity: 50, precipitation: 0 });
          expect(displayContainer.innerHTML).not.toBe('');

          const clearSpy = vi.spyOn(weatherDisplay, 'clear');

          const fakeGeo = {
            geocode: vi.fn().mockImplementation(async () => {
              // Verificamos que clear se haya llamado ANTES de resolver geocode/forecast
              expect(clearSpy).toHaveBeenCalled();
              return {
                success: true,
                data: { latitude: 10, longitude: 20, cityName },
              };
            }),
          } as unknown as GeocodingService;

          const fakeForecast = {
            getForecast: vi.fn().mockResolvedValue({
              success: true,
              data: { temperature: 25, humidity: 60, precipitation: 1 },
            }),
          } as unknown as ForecastService;

          const controller = new WeatherController({
            geocodingService: fakeGeo,
            forecastService: fakeForecast,
            searchForm,
            weatherDisplay,
            loadingIndicator,
            errorMessage,
          });

          await controller.handleSearch(cityName);
          expect(clearSpy).toHaveBeenCalled();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Unit: flujo exitoso completo (geocoding -> forecast -> display renderizado)', async () => {
    const fakeGeo = {
      geocode: vi.fn().mockResolvedValue({
        success: true,
        data: { latitude: 40.4168, longitude: -3.7038, cityName: 'Madrid' },
      }),
    } as unknown as GeocodingService;

    const fakeForecast = {
      getForecast: vi.fn().mockResolvedValue({
        success: true,
        data: { temperature: 22.4, humidity: 45, precipitation: 0.0 },
      }),
    } as unknown as ForecastService;

    const controller = new WeatherController({
      geocodingService: fakeGeo,
      forecastService: fakeForecast,
      searchForm,
      weatherDisplay,
      loadingIndicator,
      errorMessage,
    });

    await controller.handleSearch('Madrid');

    expect(displayContainer.querySelector('#weather-city-name')?.textContent).toBe('Madrid');
    expect(displayContainer.querySelector('#temperature-value')?.textContent).toBe('22.4 °C');
    expect(loadingEl.style.display).toBe('none');
    expect(errorEl.style.display).toBe('none');
  });

  it('Unit: GeocodingService retorna CITY_NOT_FOUND -> mensaje correcto en ErrorMessage', async () => {
    const fakeGeo = {
      geocode: vi.fn().mockResolvedValue({
        success: false,
        error: { type: 'CITY_NOT_FOUND' },
      }),
    } as unknown as GeocodingService;

    const fakeForecast = {
      getForecast: vi.fn(),
    } as unknown as ForecastService;

    const controller = new WeatherController({
      geocodingService: fakeGeo,
      forecastService: fakeForecast,
      searchForm,
      weatherDisplay,
      loadingIndicator,
      errorMessage,
    });

    await controller.handleSearch('CiudadInexistente');

    expect(errorEl.textContent).toBe('Ciudad no encontrada');
    expect(errorEl.style.display).toBe('block');
    expect(displayContainer.innerHTML).toBe('');
    expect(loadingEl.style.display).toBe('none');
  });

  it('Unit: ForecastService retorna INCOMPLETE_DATA -> mensaje de datos incompletos', async () => {
    const fakeGeo = {
      geocode: vi.fn().mockResolvedValue({
        success: true,
        data: { latitude: 10, longitude: 20, cityName: 'TestCity' },
      }),
    } as unknown as GeocodingService;

    const fakeForecast = {
      getForecast: vi.fn().mockResolvedValue({
        success: false,
        error: { type: 'INCOMPLETE_DATA' },
      }),
    } as unknown as ForecastService;

    const controller = new WeatherController({
      geocodingService: fakeGeo,
      forecastService: fakeForecast,
      searchForm,
      weatherDisplay,
      loadingIndicator,
      errorMessage,
    });

    await controller.handleSearch('TestCity');

    expect(errorEl.textContent).toBe('Los datos meteorológicos están incompletos');
    expect(errorEl.style.display).toBe('block');
    expect(loadingEl.style.display).toBe('none');
  });
});
