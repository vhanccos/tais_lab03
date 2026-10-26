export class LoadingIndicator {
  private element: HTMLElement;

  constructor(element: HTMLElement) {
    this.element = element;
    this.hide();
  }

  public show(): void {
    this.element.style.display = 'block';
    this.element.setAttribute('aria-busy', 'true');
  }

  public hide(): void {
    this.element.style.display = 'none';
    this.element.setAttribute('aria-busy', 'false');
  }

  public isVisible(): boolean {
    return this.element.style.display !== 'none';
  }
}
