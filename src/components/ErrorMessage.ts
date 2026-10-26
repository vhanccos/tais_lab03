export class ErrorMessage {
  private element: HTMLElement;

  constructor(element: HTMLElement) {
    this.element = element;
    this.clear();
  }

  public show(message: string): void {
    this.element.textContent = message;
    this.element.style.display = 'block';
  }

  public clear(): void {
    this.element.textContent = '';
    this.element.style.display = 'none';
  }

  public getMessage(): string {
    return this.element.textContent || '';
  }
}
