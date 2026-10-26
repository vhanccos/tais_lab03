export class ForecastClient {
  private readonly baseUrl: string;
  private readonly timeoutMs: number;

  constructor(baseUrl = 'https://api.open-meteo.com/v1/forecast', timeoutMs = 10000) {
    this.baseUrl = baseUrl;
    this.timeoutMs = timeoutMs;
  }

  buildUrl(latitude: number, longitude: number): string {
    return `${this.baseUrl}?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,precipitation`;
  }

  async getForecast(latitude: number, longitude: number): Promise<Response> {
    const url = this.buildUrl(latitude, longitude);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(url, { signal: controller.signal });
      return response;
    } finally {
      clearTimeout(timeoutId);
    }
  }
}
