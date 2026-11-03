import type { Page } from '@playwright/test';

/** Console messages that are environment noise in headless SwiftShader, not app errors. */
const IGNORE = [/GPU stall due to ReadPixels/, /Instance dropped in popErrorScope/, /A valid external Instance reference no longer exists/, /WebGL-.*Performance/];

export function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', (m) => {
    if (m.type() !== 'error') return;
    const t = m.text();
    if (IGNORE.some((r) => r.test(t))) return;
    errors.push(t);
  });
  page.on('pageerror', (e) => {
    if (IGNORE.some((r) => r.test(e.message))) return;
    errors.push(`pageerror: ${e.message}`);
  });
  return errors;
}

export async function waitReady(page: Page, timeout = 180_000): Promise<void> {
  await page.waitForFunction(() => (window as unknown as { __deeptime?: { ready: boolean } }).__deeptime?.ready === true, null, { timeout });
}
