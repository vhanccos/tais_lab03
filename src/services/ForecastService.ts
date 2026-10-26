import { ForecastClient } from '../clients/ForecastClient.js';
import type { WeatherData, ForecastResult } from '../types/index.js';

export class ForecastService {
  constructor(private client: ForecastClient = new ForecastClient()) {}

  async getForecast(latitude: number, longitude: number): Promise<ForecastResult> {
    let response: Response;
    try {
      response = await this.client.getForecast(latitude, longitude);
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        return { success: false, error: { type: 'TIMEOUT' } };
      }
      return { success: false, error: { type: 'NETWORK_ERROR' } };
    }

    if (!response.ok) {
      return {
        success: false,
        error: { type: 'SERVICE_ERROR', statusCode: response.status },
      };
    }

    let data: any;
    try {
      data = await response.json();
    } catch {
      return { success: false, error: { type: 'INVALID_RESPONSE' } };
    }

    if (!data || typeof data !== 'object' || !data.current || typeof data.current !== 'object') {
      return { success: false, error: { type: 'INVALID_RESPONSE' } };
    }

    const { temperature_2m, relative_humidity_2m, precipitation } = data.current;

    if (
      typeof temperature_2m !== 'number' ||
      Number.isNaN(temperature_2m) ||
      typeof relative_humidity_2m !== 'number' ||
      Number.isNaN(relative_humidity_2m) ||
      typeof precipitation !== 'number' ||
      Number.isNaN(precipitation)
    ) {
      return { success: false, error: { type: 'INCOMPLETE_DATA' } };
    }

    const weatherData: WeatherData = {
      temperature: temperature_2m,
      humidity: relative_humidity_2m,
      precipitation: precipitation,
    };

    return { success: true, data: weatherData };
  }
}
