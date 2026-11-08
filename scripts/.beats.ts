import { Odyssey } from '../src/time/odyssey';
const mods = await Promise.all(['c00_prologue', 'c01_microbial', 'c02_multicellular', 'c03_animals', 'c04_hominins', 'c05_ancient', 'c06_modern', 'c07_singularity', 'c08_expansion'].map((m) => import(`../src/chapters/${m}.ts`)));
const o = new Odyssey();
mods.forEach((mod, c) => {
  const ch = Object.values(mod).find((v: any) => v && v.shots && v.meta) as any;
  const sp = o.span(c);
  const total = ch.shots.reduce((a: number, s: any) => a + s.dur, 0);
  let s0 = sp.s0;
  const parts = ch.shots.map((d: any) => { const dur = d.dur * (sp.s1 - sp.s0) / total; const r = `${d.id}@${s0.toFixed(1)}[${o.T(s0).toPrecision(3)}]`; s0 += dur; return r; });
  console.log(c, sp.s0.toFixed(1), '-', sp.s1.toFixed(1), parts.join('  '));
});
for (const c of [9, 10]) { const sp = o.span(c); console.log(c, sp.s0.toFixed(1), '-', sp.s1.toFixed(1)); }
