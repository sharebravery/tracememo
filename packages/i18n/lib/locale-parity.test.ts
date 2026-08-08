import en from '../locales/en/messages.json' with { type: 'json' };
import zhCN from '../locales/zh_CN/messages.json' with { type: 'json' };
import { describe, expect, it } from 'vitest';

/**
 * Locale parity: English and zh_CN are the only shipped locales, and every
 * user-visible string must exist in both. This guards against adding a key to
 * en but forgetting zh_CN (or vice versa).
 */
describe('locale parity (en + zh_CN)', () => {
  const enKeys = Object.keys(en).sort();
  const zhKeys = Object.keys(zhCN).sort();

  it('en and zh_CN declare the same key set', () => {
    expect(zhKeys).toEqual(enKeys);
  });

  it('every key has a non-empty message in both locales', () => {
    for (const key of enKeys) {
      expect(en[key as keyof typeof en].message.length).toBeGreaterThan(0);
      expect(zhCN[key as keyof typeof zhCN].message.length).toBeGreaterThan(0);
    }
  });
});
