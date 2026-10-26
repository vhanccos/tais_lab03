export class GeocodingClient {
  private readonly baseUrl: string;
  private readonly timeoutMs: number;

  constructor(baseUrl = 'https://geocoding-api.open-meteo.com/v1/search', timeoutMs = 10000) {
    this.baseUrl = baseUrl;
    this.timeoutMs = timeoutMs;
  }

  buildUrl(cityName: string): string {
    const encodedName = encodeURIComponent(cityName);
    return `${this.baseUrl}?name=${encodedName}&count=1`;
  }

  async search(cityName: string): Promise<Response> {
    const url = this.buildUrl(cityName);
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
