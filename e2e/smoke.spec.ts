import { expect, test } from '@playwright/test';
import { collectErrors, waitReady } from './helpers';

test('start screen → Begin → plays with zero console errors', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto('/?backend=webgl&res=640x360');
  const begin = page.getByRole('button', { name: 'Begin' });
  await expect(begin).toBeEnabled({ timeout: 60_000 });
  await begin.click();
  await waitReady(page);
  // let the Odyssey run for a while in real time
  await page.waitForTimeout(4000);
  const st = await page.evaluate(() => (window as any).__deeptime.state());
  expect(st.phase).toBe('running');
  expect(st.s).toBeGreaterThan(0.5);
  expect(errors).toEqual([]);
});

test('deep links into every chapter render without errors', async ({ page }) => {
  const errors = collectErrors(page);
  for (const ch of [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]) {
    await page.goto(`/?backend=webgl&capture=1&res=480x270&chapter=${ch}&shot=0&nocard=1&warm=3&mute=1`);
    await waitReady(page);
    const st = await page.evaluate(() => (window as any).__deeptime.state());
    expect(st.chapter).toBe(ch);
  }
  expect(errors).toEqual([]);
});
