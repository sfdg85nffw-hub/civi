import { describe, expect, it } from 'vitest';
import { Odyssey } from '../src/time/odyssey';
import { formatDate, formatCardDate, formatSpeed } from '../src/time/format';
import { TimeEngine } from '../src/time/TimeEngine';
import { CHAPTERS } from '../src/chapters/meta';

describe('odyssey schedule', () => {
  const o = new Odyssey();
  it('runs about five minutes', () => {
    expect(o.total).toBeGreaterThan(280);
    expect(o.total).toBeLessThan(330);
  });
  it('is monotone in sim time', () => {
    let prev = -Infinity;
    for (let s = 0; s <= o.total; s += 0.05) {
      const T = o.T(s);
      expect(T).toBeGreaterThanOrEqual(prev - Math.abs(prev) * 1e-12);
      prev = T;
    }
  });
  it('round-trips story time ↔ sim time', () => {
    for (let s = 0.3; s < o.codaStart + 10; s += 1.7) {
      const T = o.T(s);
      const s2 = o.s(T);
      expect(o.T(s2) / T).toBeCloseTo(1, 6);
    }
  });
  it('starts at the vent and passes through every chapter in order', () => {
    expect(o.T(0)).toBeCloseTo(-4.0e9, -3);
    for (const ch of CHAPTERS) {
      const sp = o.span(ch.id);
      expect(o.chapterAtStory(sp.s0 + 0.01)).toBe(ch.id);
    }
  });
  it('hits canonical milestones on schedule', () => {
    // the Great Oxidation (~2.4 Gya) happens inside Microbial Earth
    const sGOE = o.s(-2.4e9);
    expect(o.chapterAtStory(sGOE)).toBe(1);
    // Chicxulub inside the Animal Kingdom; the fall of Rome inside Ancient Civilizations
    expect(o.chapterAtStory(o.s(-66.0e6))).toBe(3);
    expect(o.chapterAtStory(o.s(476 - 2026))).toBe(5);
  });
  it('slows below the LOD threshold at the agent beats', () => {
    for (const id of [1, 2, 3, 4, 5]) {
      const sp = o.span(id);
      let minSpeed = Infinity;
      for (let s = sp.s0; s < sp.s1; s += 0.05) minSpeed = Math.min(minSpeed, o.speed(s));
      expect(minSpeed).toBeLessThan(CHAPTERS[id]!.lodThreshold);
    }
  });
});

describe('date formatting', () => {
  it('formats by scale', () => {
    expect(formatDate(-3.47e9)).toBe('3.47 billion years ago');
    expect(formatDate(-66e6)).toBe('66.0 million years ago');
    expect(formatDate(-4624.5)).toBe('2,600 BCE');
    expect(formatDate(1969 - 2026 + 0.5)).toBe('1969 CE');
    expect(formatDate(4.2e9)).toBe('+4.20 billion years');
    expect(formatDate(1e14)).toBe('+10¹⁴ years');
    expect(formatDate(-45000)).toBe('45,000 years ago');
  });
  it('shows days at very slow speeds', () => {
    expect(formatDate(1969 - 2026 + 200 / 365, { speed: 1 / 365.25 })).toMatch(/July 1969 CE/);
  });
  it('formats cards and speeds', () => {
    expect(formatCardDate(-4.0e9)).toBe('4.0 BILLION YEARS AGO');
    expect(formatSpeed(1e6)).toBe('1.00 Myr/s');
    expect(formatSpeed(1 / 365.25)).toBe('1.0 days/s');
  });
});

describe('time engine', () => {
  it('manual speed is logarithmic between 1 day/s and 1 Gyr/s', () => {
    const t = new TimeEngine();
    t.setSpeed01(0);
    for (let i = 0; i < 600; i++) t.update(1 / 60);
    expect(Math.abs(t.speed)).toBeCloseTo(1 / 365.25, 4);
    t.setSpeed01(1);
    for (let i = 0; i < 1200; i++) t.update(1 / 60);
    expect(Math.abs(t.speed) / 1e9).toBeGreaterThan(0.9);
  });
  it('returns to the Odyssey at the matching story time', () => {
    const t = new TimeEngine();
    t.seekStory(100);
    const T = t.T;
    t.enterManual();
    t.returnToOdyssey();
    expect(t.storyTime).toBeCloseTo(100, 3);
    expect(t.T / T).toBeCloseTo(1, 6);
  });
});
