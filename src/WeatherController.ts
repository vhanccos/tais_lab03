import { GeocodingService } from './services/GeocodingService.js';
import { ForecastService } from './services/ForecastService.js';
import { CitySearchForm } from './components/CitySearchForm.js';
import { WeatherDisplay } from './components/WeatherDisplay.js';
import { LoadingIndicator } from './components/LoadingIndicator.js';
import { ErrorMessage } from './components/ErrorMessage.js';
import type { AppState } from './types/index.js';

export class WeatherController {
  private geocodingService: GeocodingService;
  private forecastService: ForecastService;
  private searchForm: CitySearchForm;
  private weatherDisplay: WeatherDisplay;
  private loadingIndicator: LoadingIndicator;
  private errorMessage: ErrorMessage;

  private state: AppState = {
    cityName: '',
    coordinates: null,
    weather: null,
    isLoading: false,
    errorMessage: null,
  };

  constructor(dependencies: {
    geocodingService: GeocodingService;
    forecastService: ForecastService;
    searchForm: CitySearchForm;
    weatherDisplay: WeatherDisplay;
    loadingIndicator: LoadingIndicator;
    errorMessage: ErrorMessage;
  }) {
    this.geocodingService = dependencies.geocodingService;
    this.forecastService = dependencies.forecastService;
    this.searchForm = dependencies.searchForm;
    this.weatherDisplay = dependencies.weatherDisplay;
    this.loadingIndicator = dependencies.loadingIndicator;
    this.errorMessage = dependencies.errorMessage;

    this.searchForm.onSearch((cityName: string) => {
      this.handleSearch(cityName);
    });
  }

  public getState(): Readonly<AppState> {
    return this.state;
  }

  public async handleSearch(cityName: string): Promise<void> {
    const trimmedCity = cityName.trim();
    if (!trimmedCity) {
      this.errorMessage.show('El nombre de la ciudad es obligatorio');
      return;
    }

    // Limpiar estado y UI previa
    this.weatherDisplay.clear();
    this.errorMessage.clear();
    this.loadingIndicator.show();

    this.state = {
      ...this.state,
      cityName: trimmedCity,
      coordinates: null,
      weather: null,
      isLoading: true,
      errorMessage: null,
    };

    try {
      // 1. Geocodificación
      const geoResult = await this.geocodingService.geocode(trimmedCity);

      if (!geoResult.success) {
        let msg = 'No se pudo obtener la geolocalización de la ciudad';
        switch (geoResult.error.type) {
          case 'CITY_NOT_FOUND':
            msg = 'Ciudad no encontrada';
            break;
          case 'TIMEOUT':
          case 'NETWORK_ERROR':
            msg = 'El servicio de geocodificación no está disponible';
            break;
          case 'SERVICE_ERROR':
            msg = `El servicio de geocodificación retornó un error (${geoResult.error.statusCode})`;
            break;
          case 'INVALID_RESPONSE':
            msg = 'Los datos recibidos del servicio de geocodificación no son válidos';
            break;
        }

        this.state = { ...this.state, isLoading: false, errorMessage: msg };
        this.loadingIndicator.hide();
        this.errorMessage.show(msg);
        return;
      }

      this.state.coordinates = geoResult.data;

      // 2. Consulta de pronóstico
      // Validación estricta de coordenadas según Requisito 3.1 (-90 a 90 latitud, -180 a 180 longitud)
      const { latitude, longitude } = geoResult.data;
      if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
        const msg = 'Las coordenadas obtenidas no son válidas';
        this.state = { ...this.state, isLoading: false, errorMessage: msg };
        this.loadingIndicator.hide();
        this.errorMessage.show(msg);
        return;
      }

      const forecastResult = await this.forecastService.getForecast(
        latitude,
        longitude
      );

      if (!forecastResult.success) {
        let msg = 'No se pudo obtener el pronóstico del clima';
        switch (forecastResult.error.type) {
          case 'TIMEOUT':
          case 'NETWORK_ERROR':
            msg = 'El servicio de pronóstico no está disponible';
            break;
          case 'SERVICE_ERROR':
            msg = `El servicio de pronóstico retornó un error (${forecastResult.error.statusCode})`;
            break;
          case 'INCOMPLETE_DATA':
            msg = 'Los datos meteorológicos están incompletos';
            break;
          case 'INVALID_RESPONSE':
            msg = 'Los datos recibidos del servicio de pronóstico no son válidos';
            break;
        }

        this.state = { ...this.state, isLoading: false, errorMessage: msg };
        this.loadingIndicator.hide();
        this.errorMessage.show(msg);
        return;
      }

      // 3. Renderizar resultados exitosos
      const displayName = geoResult.data.cityName?.trim() ? geoResult.data.cityName : trimmedCity;
      this.state = {
        ...this.state,
        weather: forecastResult.data,
        isLoading: false,
        errorMessage: null,
      };

      this.loadingIndicator.hide();
      this.weatherDisplay.render(displayName, forecastResult.data);
    } catch {
      const fallbackMsg = 'Ocurrió un error inesperado al procesar la solicitud';
      this.state = { ...this.state, isLoading: false, errorMessage: fallbackMsg };
      this.loadingIndicator.hide();
      this.errorMessage.show(fallbackMsg);
    }
  }
}
