import { describe, expect, it } from 'vitest';
import { buildEpithets, voice } from '../src/galaxy/voice';

describe('the Contest speaks in the film\'s voice', () => {
  const f = [{ name: 'the Heir' }, { name: 'the Choir' }, { name: 'the Hexarchy' }, { name: 'the Lattice' }];
  const ep = ['it', 'the mind in Andromeda', 'the mind from the dark', 'the new light'];
  it('keeps "It" for the mind we built and names rivals by where they came from', () => {
    expect(voice('The Heir went out in the Small Cloud.', f, ep)).toBe('It went out in the Small Cloud.');
    expect(voice('The last of the Heir went out in the Small Cloud.', f, ep)).toBe('The last of it went out in the Small Cloud.');
    expect(voice("The Heir's probes reached Triangulum.", f, ep)).toBe('Its probes reached Triangulum.');
    expect(voice('The Choir moved against the Heir.', f, ep)).toBe('The mind in Andromeda moved against it.');
    expect(voice('The Choir and the Heir met in Andromeda.', f, ep)).toBe('It and the mind in Andromeda met in Andromeda.');
    expect(voice('Only the Hexarchy was left.', f, ep)).toBe('Only the mind from the dark was left.');
    expect(voice('Something woke in Andromeda.', f, ep)).toBe('Something woke in Andromeda.');
  });
  it('derives epithets from how each mind entered the story', () => {
    const ev = [
      { t: 1, type: 'emerge', a: 1, b: -1, node: 10, node2: -1, t2: -1, text: '', weight: 1 },
      { t: 2, type: 'intrude', a: 2, b: -1, node: 20, node2: -1, t2: -1, text: '', weight: 1 },
      { t: 3, type: 'emerge', a: 3, b: -1, node: 30, node2: -1, t2: -1, text: '', weight: 1 },
    ];
    const gal = (n: number): number => (n === 10 ? 3 : n === 30 ? 0 : 1);
    expect(buildEpithets(f, ev, gal)).toEqual(['it', 'the mind in Andromeda', 'the mind from the dark', 'the new light']);
  });
});
