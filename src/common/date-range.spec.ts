import { dateRange } from './date-range';

describe('dateRange', () => {
  it('devuelve Between cuando hay fecha inicial y final', () => {
    const operator = dateRange('2026-01-01', '2026-01-31');

    expect(operator?.type).toBe('between');
    expect(operator?.value).toEqual(['2026-01-01', '2026-01-31']);
  });

  it('devuelve MoreThanOrEqual cuando solo hay fecha inicial', () => {
    const operator = dateRange('2026-01-01', undefined);

    expect(operator?.type).toBe('moreThanOrEqual');
    expect(operator?.value).toBe('2026-01-01');
  });

  it('devuelve LessThanOrEqual cuando solo hay fecha final', () => {
    const operator = dateRange(undefined, '2026-01-31');

    expect(operator?.type).toBe('lessThanOrEqual');
    expect(operator?.value).toBe('2026-01-31');
  });

  it('devuelve undefined cuando no hay fechas', () => {
    expect(dateRange()).toBeUndefined();
  });

  it('funciona con objetos Date', () => {
    const from = new Date('2026-01-01T00:00:00.000Z');
    const to = new Date('2026-01-31T00:00:00.000Z');

    const operator = dateRange(from, to);

    expect(operator?.type).toBe('between');
    expect(operator?.value).toEqual([from, to]);
  });
});
