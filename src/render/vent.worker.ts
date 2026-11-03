/// <reference lib="webworker" />
import { buildVentGeometry } from './spires';

self.onmessage = () => {
  const g = buildVentGeometry();
  const transfer: Transferable[] = [];
  for (const m of [...g.meshes, g.floor]) transfer.push(m.positions.buffer as ArrayBuffer, m.normals.buffer as ArrayBuffer, m.indices.buffer as ArrayBuffer);
  (self as unknown as Worker).postMessage(g, transfer);
};
