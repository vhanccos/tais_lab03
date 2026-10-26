import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { formatTemperature, formatHumidity, formatPrecipitation } from '../src/utils/formatters';

describe('formatters - Property Tests', () => {
  it('Property 11: Formateo numérico correcto de los valores del clima', () => {
    fc.assert(
      fc.property(
        fc.float({ min: -1e9, max: 1e9, noDefaultInfinity: true, noNaN: true }),
        fc.float({ min: -1e9, max: 1e9, noDefaultInfinity: true, noNaN: true }),
        fc.float({ min: -1e9, max: 1e9, noDefaultInfinity: true, noNaN: true }),
        (temp, hum, prec) => {
          const tempStr = formatTemperature(temp);
          const humStr = formatHumidity(hum);
          const precStr = formatPrecipitation(prec);

          expect(tempStr.endsWith(' °C')).toBe(true);
          const tempNumPart = tempStr.replace(' °C', '');
          const tempDecimals = tempNumPart.includes('.') ? tempNumPart.split('.')[1] : '';
          expect(tempDecimals.length).toBeLessThanOrEqual(1);

          expect(humStr.endsWith(' %')).toBe(true);
          const humNumPart = humStr.replace(' %', '');
          expect(humNumPart).not.toContain('.');

          expect(precStr.endsWith(' mm')).toBe(true);
          const precNumPart = precStr.replace(' mm', '');
          const precDecimals = precNumPart.includes('.') ? precNumPart.split('.')[1] : '';
          expect(precDecimals.length).toBeLessThanOrEqual(1);
        }
      ),
      { numRuns: 100 }
    );
  });
});
