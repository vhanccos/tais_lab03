import type { WeatherData } from '../types/index.js';
import { formatTemperature, formatHumidity, formatPrecipitation } from '../utils/formatters.js';

export class WeatherDisplay {
  private container: HTMLElement;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  public render(cityName: string, data: WeatherData): void {
    const card = document.createElement('section');
    card.className = 'weather-card';
    card.setAttribute('aria-label', 'Pronóstico del clima actual');

    const h2 = document.createElement('h2');
    h2.className = 'weather-city';
    h2.id = 'weather-city-name';
    h2.textContent = cityName;

    const metrics = document.createElement('div');
    metrics.className = 'weather-metrics';

    metrics.innerHTML = `
      <div class="metric-item">
        <span class="metric-label">Temperatura</span>
        <span class="metric-value" id="temperature-value">${formatTemperature(data.temperature)}</span>
      </div>
      <div class="metric-item">
        <span class="metric-label">Humedad</span>
        <span class="metric-value" id="humidity-value">${formatHumidity(data.humidity)}</span>
      </div>
      <div class="metric-item">
        <span class="metric-label">Precipitaciones</span>
        <span class="metric-value" id="precipitation-value">${formatPrecipitation(data.precipitation)}</span>
      </div>
    `;

    card.appendChild(h2);
    card.appendChild(metrics);

    this.container.innerHTML = '';
    this.container.appendChild(card);
  }

  public clear(): void {
    this.container.innerHTML = '';
  }
}
