#!/usr/bin/env python3
"""Contact sheets and a merged timeline from one or more odyssey-run output folders.

usage: python3 scripts/contact-sheets.py <outDir> <runDir> [<runDir> ...] [--cols=6] [--w=320]

Writes <outDir>/sheet_cXX.png (one per chapter, frames labelled with story time) and
<outDir>/timeline.md (the drama engine's lines, builds, hits and ruptures, with audio levels).
"""
import json
import os
import re
import sys

from PIL import Image, ImageDraw

args = [a for a in sys.argv[1:] if not a.startswith('--')]
opts = dict(a[2:].split('=', 1) for a in sys.argv[1:] if a.startswith('--') and '=' in a)
cols = int(opts.get('cols', 6))
W = int(opts.get('w', 320))
out, runs = args[0], args[1:]
os.makedirs(out, exist_ok=True)

frames = {}
drama = {}
levels = {}
for r in runs:
    for f in sorted(os.listdir(r)):
        m = re.match(r's(\d+)_c(\d+)\.png$', f)
        if m:
            s = int(m.group(1)) / 10
            frames.setdefault(int(m.group(2)), {})[s] = os.path.join(r, f)
    idx = os.path.join(r, 'index.json')
    if os.path.exists(idx):
        j = json.load(open(idx))
        for d in j.get('drama', []):
            drama[(round(d['s'], 2), d['kind'], d['what'])] = d
        for lv in j.get('levels', []):
            levels[lv['s']] = lv

for ch, fs in sorted(frames.items()):
    items = sorted(fs.items())
    H = W * 9 // 16
    rows = (len(items) + cols - 1) // cols
    sheet = Image.new('RGB', (cols * W, rows * (H + 16)), (20, 20, 20))
    dr = ImageDraw.Draw(sheet)
    for i, (s, p) in enumerate(items):
        im = Image.open(p).convert('RGB').resize((W, H))
        x, y = (i % cols) * W, (i // cols) * (H + 16)
        sheet.paste(im, (x, y + 16))
        dr.text((x + 4, y + 2), f's {s:.1f}', fill=(230, 230, 230))
    sheet.save(os.path.join(out, f'sheet_c{ch:02d}.png'))

with open(os.path.join(out, 'timeline.md'), 'w') as f:
    f.write('# Drama timeline (story seconds)\n\n| s | kind | what |\n|---|---|---|\n')
    for d in sorted(drama.values(), key=lambda d: d['s']):
        f.write(f"| {d['s']:.2f} | {d['kind']} | {d['what']} |\n")
    f.write('\n# Audio level trace (master RMS, approximate: audio runs in real time while the capture clock steps story time)\n\n')
    f.write('| s | dB | music duck | shake | rupture |\n|---|---|---|---|---|\n')
    for s in sorted(levels):
        lv = levels[s]
        f.write(f"| {s:.2f} | {lv['db']} | {lv['duck']} | {lv['shake']} | {lv['glitch']} |\n")
print('chapters:', sorted(frames), 'drama events:', len(drama), 'levels:', len(levels))
