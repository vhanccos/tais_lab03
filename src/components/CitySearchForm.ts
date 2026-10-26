export type SearchCallback = (cityName: string) => void;

export class CitySearchForm {
  private container: HTMLElement;
  private formElement: HTMLFormElement | null = null;
  private inputElement: HTMLInputElement | null = null;
  private validationErrorElement: HTMLElement | null = null;
  private onSearchCallback: SearchCallback | null = null;

  constructor(container: HTMLElement) {
    this.container = container;
    this.render();
  }

  public onSearch(callback: SearchCallback): void {
    this.onSearchCallback = callback;
  }

  private render(): void {
    this.container.innerHTML = `
      <form id="city-search-form" class="search-form" novalidate>
        <div class="form-group">
          <label for="city-input" class="form-label">Ciudad</label>
          <div class="input-row">
            <input
              type="text"
              id="city-input"
              class="city-input"
              maxlength="100"
              placeholder="Ej: Madrid, Buenos Aires, Tokio"
              autocomplete="off"
            />
            <button type="submit" id="search-button" class="btn-search">Buscar</button>
          </div>
          <span id="city-validation-error" class="validation-message" role="alert" style="display: none;"></span>
        </div>
      </form>
    `;

    this.formElement = this.container.querySelector('#city-search-form');
    this.inputElement = this.container.querySelector('#city-input');
    this.validationErrorElement = this.container.querySelector('#city-validation-error');

    this.bindEvents();
  }

  private bindEvents(): void {
    if (!this.formElement || !this.inputElement) return;

    this.formElement.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleSubmit();
    });

    this.inputElement.addEventListener('input', () => {
      this.clearValidation();
    });
  }

  public handleSubmit(): void {
    if (!this.inputElement) return;

    const rawValue = this.inputElement.value;
    const trimmed = rawValue.trim();

    if (trimmed.length === 0) {
      this.showValidation('El nombre de la ciudad es obligatorio');
      return;
    }

    this.clearValidation();
    if (this.onSearchCallback) {
      this.onSearchCallback(trimmed);
    }
  }

  public showValidation(message: string): void {
    if (this.validationErrorElement) {
      this.validationErrorElement.textContent = message;
      this.validationErrorElement.style.display = 'block';
    }
  }

  public clearValidation(): void {
    if (this.validationErrorElement) {
      this.validationErrorElement.textContent = '';
      this.validationErrorElement.style.display = 'none';
    }
  }

  public getInput(): HTMLInputElement | null {
    return this.inputElement;
  }

  public setInputValue(val: string): void {
    if (this.inputElement) {
      this.inputElement.value = val;
    }
  }
}
