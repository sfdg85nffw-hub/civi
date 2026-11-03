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
  test.setTimeout(1_500_000);
  const errors = collectErrors(page);
  for (const ch of [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]) {
    await page.goto(`/?backend=webgl&capture=1&res=${ch >= 8 ? '320x180' : '480x270'}&chapter=${ch}&shot=0&nocard=1&warm=3&mute=1&quality=low&seed=C0FFEE`);
    const t0 = Date.now();
    await waitReady(page, 420_000);
    const st = await page.evaluate(() => (window as any).__deeptime.state());
    console.log(`chapter ${ch} ready in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
    expect(st.chapter).toBe(ch);
  }
  expect(errors).toEqual([]);
});

test('the Return saves the spark, and the next run opens with it', async ({ page }) => {
  test.setTimeout(1_500_000);
  const errors = collectErrors(page);
  // C0FFEE ends in vacuum decay (white spark); 1234ABCD ends with a victor
  for (const seed of ['C0FFEE', '1234ABCD']) {
    await page.goto(`/?backend=webgl&capture=1&res=320x180&chapter=10&shot=6&su=0.6&nocard=1&warm=3&mute=1&quality=low&seed=${seed}`);
    await page.evaluate(() => localStorage.removeItem('deep-time.spark'));
    await waitReady(page, 420_000);
    await page.evaluate(() => (window as any).__deeptime.run(6));
    await page.evaluate(() => (window as any).__deeptime.frames(6));
    const saved = await page.evaluate(() => localStorage.getItem('deep-time.spark'));
    const outcome = await page.evaluate(() => (window as any).__deeptime.state().outcome);
    console.log(`seed ${seed}: ${outcome}, spark ${saved}`);
    expect(saved).toMatch(/^#[0-9a-f]{6}$/);
    if (outcome === 'vacuum') expect(saved).toBe('#ffffff');
    else expect(saved).not.toBe('#ffffff');
    // a fresh load keeps it for the next run's first frame
    await page.goto('/?backend=webgl&res=320x180');
    expect(await page.evaluate(() => localStorage.getItem('deep-time.spark'))).toBe(saved);
  }
  expect(errors).toEqual([]);
});
