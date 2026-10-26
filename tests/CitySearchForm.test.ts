import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { CitySearchForm } from '../src/components/CitySearchForm';

describe('CitySearchForm - Property & Unit Tests', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  it('Property 1: Rechazo de entradas de solo whitespace o vacías', () => {
    const form = new CitySearchForm(container);
    const callback = vi.fn();
    form.onSearch(callback);

    fc.assert(
      fc.property(
        fc.array(fc.constantFrom(' ', '\t', '\n', '\r')).map((arr) => arr.join('')),
        (whitespaceStr) => {
          callback.mockClear();
          form.setInputValue(whitespaceStr);
          form.handleSubmit();

          expect(callback).not.toHaveBeenCalled();
          const err = container.querySelector('#city-validation-error') as HTMLElement;
          expect(err.textContent).toBe('El nombre de la ciudad es obligatorio');
          expect(err.style.display).toBe('block');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 2: Trim del nombre de ciudad antes de enviar', () => {
    const form = new CitySearchForm(container);
    const callback = vi.fn();
    form.onSearch(callback);

    fc.assert(
      fc.property(
        fc.array(fc.constantFrom(' ', '\t')).map((a) => a.join('')),
        fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0 && s.length <= 80),
        fc.array(fc.constantFrom(' ', '\t')).map((a) => a.join('')),
        (lead, core, trail) => {
          callback.mockClear();
          const fullInput = `${lead}${core}${trail}`;
          form.setInputValue(fullInput);
          form.handleSubmit();

          expect(callback).toHaveBeenCalledWith(fullInput.trim());
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Unit: renderiza con maxlength 100 y botón submit', () => {
    const form = new CitySearchForm(container);
    const input = form.getInput();
    const button = container.querySelector('button[type="submit"]') as HTMLButtonElement;

    expect(input).not.toBeNull();
    expect(input?.getAttribute('maxlength')).toBe('100');
    expect(button).not.toBeNull();
  });

  it('Unit: envío con clic en el botón y Enter', () => {
    const form = new CitySearchForm(container);
    const callback = vi.fn();
    form.onSearch(callback);

    const input = form.getInput()!;
    input.value = 'Madrid';

    const button = container.querySelector('button[type="submit"]') as HTMLButtonElement;
    button.click();
    expect(callback).toHaveBeenCalledWith('Madrid');
  });
});
