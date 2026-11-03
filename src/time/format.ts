/**
 * Scale-aware date formatting.
 * T is years relative to 2026 CE (negative = past).
 */
export const PRESENT_YEAR = 2026;

const SUP: Record<string, string> = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', '-': '⁻' };
export const superscript = (n: number | string): string => String(n).split('').map((c) => SUP[c] ?? c).join('');

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const MONTH_DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

function sig(x: number, digits: number): string {
  if (x === 0) return '0';
  const p = Math.floor(Math.log10(Math.abs(x)));
  const decimals = Math.max(0, digits - 1 - p);
  return x.toFixed(Math.min(decimals, 2));
}

function groupInt(n: number): string {
  return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/** Round to `digits` significant figures and group thousands. */
function roundGroup(n: number, digits: number): string {
  if (n === 0) return '0';
  const p = Math.floor(Math.log10(Math.abs(n)));
  const f = Math.pow(10, Math.max(0, p - digits + 1));
  return groupInt(Math.round(n / f) * f);
}

export function astronomicalYear(T: number): number {
  return PRESENT_YEAR + T;
}

export interface FormatOptions {
  /** years per real second; finer formats appear at slow speeds in the historical era */
  speed?: number;
  /** use relative "+N years" for the future (Regime B) */
  relativeFuture?: boolean;
}

export function formatDate(T: number, opts: FormatOptions = {}): string {
  const speed = Math.abs(opts.speed ?? 1e6);
  if (!Number.isFinite(T)) return T > 0 ? '+∞' : '−∞';
  if (T <= -1e9) return `${sig(-T / 1e9, 3)} billion years ago`;
  if (T <= -1e6) return `${sig(-T / 1e6, 3)} million years ago`;
  const astro = astronomicalYear(T);
  if (astro < -9999) return `${roundGroup(-T, 3)} years ago`;
  const future = T > 50.5 || (opts.relativeFuture && T > 0);
  if (!future) {
    const y = Math.floor(astro);
    if (y <= 0) return `${groupInt(1 - y)} BCE`;
    if (speed < 0.5) {
      const frac = astro - y;
      let day = Math.floor(frac * 365);
      let m = 0;
      while (m < 11 && day >= MONTH_DAYS[m]!) day -= MONTH_DAYS[m++]!;
      if (speed < 2 / 365) return `${day + 1} ${MONTHS[m]} ${y} CE`;
      return `${MONTHS[m]} ${y} CE`;
    }
    return `${y} CE`;
  }
  // Future, relative to the present
  if (T < 1e6) return `+${roundGroup(T, 3)} years`;
  if (T < 1e9) return `+${sig(T / 1e6, 3)} million years`;
  if (T < 1e12) return `+${sig(T / 1e9, 3)} billion years`;
  const e = Math.floor(Math.log10(T));
  const m = T / Math.pow(10, e);
  if (m < 1.05) return `+10${superscript(e)} years`;
  return `+${m.toFixed(1)} × 10${superscript(e)} years`;
}

/** Card-style uppercase date, e.g. "4.0 BILLION YEARS AGO". */
export function formatCardDate(T: number): string {
  if (T <= -1e9) return `${(-T / 1e9).toFixed(1)} BILLION YEARS AGO`;
  if (T <= -1e6) return `${Math.round(-T / 1e6)} MILLION YEARS AGO`;
  return formatDate(T, { speed: 1e6 }).toUpperCase();
}

/** Format a speed (years per second) for the HUD. */
export function formatSpeed(yps: number): string {
  if (yps === 0) return 'paused';
  const a = Math.abs(yps);
  if (a < 1 / 52) return `${sig(a * 365.25, 2)} days/s`;
  if (a < 1) return `${sig(a * 12, 2)} months/s`;
  if (a < 1e3) return `${sig(a, 3)} yr/s`;
  if (a < 1e6) return `${sig(a / 1e3, 3)} kyr/s`;
  if (a < 1e9) return `${sig(a / 1e6, 3)} Myr/s`;
  if (a < 1e12) return `${sig(a / 1e9, 3)} Gyr/s`;
  return `10${superscript(Math.floor(Math.log10(a)))} yr/s`;
}
