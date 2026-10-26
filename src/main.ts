import './styles.css';
import { GeocodingClient } from './clients/GeocodingClient.js';
import { ForecastClient } from './clients/ForecastClient.js';
import { GeocodingService } from './services/GeocodingService.js';
import { ForecastService } from './services/ForecastService.js';
import { CitySearchForm } from './components/CitySearchForm.js';
import { WeatherDisplay } from './components/WeatherDisplay.js';
import { LoadingIndicator } from './components/LoadingIndicator.js';
import { ErrorMessage } from './components/ErrorMessage.js';
import { WeatherController } from './WeatherController.js';

export function initApp(): WeatherController | null {
  const formMount = document.querySelector<HTMLElement>('#form-container');
  const loadingMount = document.querySelector<HTMLElement>('#loading-indicator');
  const errorMount = document.querySelector<HTMLElement>('#error-container');
  const displayMount = document.querySelector<HTMLElement>('#weather-display-container');

  if (!formMount || !loadingMount || !errorMount || !displayMount) {
    return null;
  }

  const geocodingClient = new GeocodingClient();
  const forecastClient = new ForecastClient();
  const geocodingService = new GeocodingService(geocodingClient);
  const forecastService = new ForecastService(forecastClient);

  const searchForm = new CitySearchForm(formMount);
  const weatherDisplay = new WeatherDisplay(displayMount);
  const loadingIndicator = new LoadingIndicator(loadingMount);
  const errorMessage = new ErrorMessage(errorMount);

  return new WeatherController({
    geocodingService,
    forecastService,
    searchForm,
    weatherDisplay,
    loadingIndicator,
    errorMessage,
  });
}

if (typeof window !== 'undefined' && document.readyState !== 'loading') {
  initApp();
} else if (typeof window !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => initApp());
}
