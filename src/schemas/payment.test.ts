import { describe, expect, it } from 'vitest';
import { manualPaymentSchema } from './payment';

describe('manualPaymentSchema', () => {
  it('accepts a whole-krone amount from a text field', () => {
    const parsed = manualPaymentSchema.parse({
      amountNok: '300',
      method: 'bank',
      paidOn: '2026-11-18',
    });
    expect(parsed.amountNok).toBe(300);
  });

  it.each([
    [{ amountNok: '', method: 'bank', paidOn: '2026-11-18' }, 'amountNok'],
    [{ amountNok: '-5', method: 'bank', paidOn: '2026-11-18' }, 'amountNok'],
    [{ amountNok: '12.5', method: 'bank', paidOn: '2026-11-18' }, 'amountNok'],
    [{ amountNok: '300', method: 'crypto', paidOn: '2026-11-18' }, 'method'],
    [{ amountNok: '300', method: 'bank', paidOn: '18.11.2026' }, 'paidOn'],
  ])('rejects %o on %s', (input, field) => {
    const result = manualPaymentSchema.safeParse(input);
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path[0]).toBe(field);
  });
});
