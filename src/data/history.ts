/**
 * Historical data for Chapters 5–6 (astronomical years: 1 BCE = 0, 500 BCE = −499).
 * Coordinates are approximate city centres.
 */
export interface City { name: string; lat: number; lon: number; from: number; to?: number; size: number }
export interface Polity { name: string; lat: number; lon: number; r: number; rise: number; peak: number; fall: number; color: [number, number, number] }
export interface Route { name: string; from: number; to: number; pts: [number, number][]; weight: number }

export const ANCIENT_CITIES: City[] = [
  { name: 'Jericho', lat: 31.87, lon: 35.44, from: -9000, size: 0.3 },
  { name: 'Çatalhöyük', lat: 37.67, lon: 32.83, from: -7400, to: -5600, size: 0.4 },
  { name: 'Uruk', lat: 31.32, lon: 45.64, from: -4000, to: 300, size: 0.9 },
  { name: 'Ur', lat: 30.96, lon: 46.1, from: -3800, to: -500, size: 0.7 },
  { name: 'Susa', lat: 32.19, lon: 48.26, from: -4200, size: 0.5 },
  { name: 'Nineveh', lat: 36.36, lon: 43.15, from: -3000, to: -612, size: 0.7 },
  { name: 'Babylon', lat: 32.54, lon: 44.42, from: -2300, to: 100, size: 1.0 },
  { name: 'Memphis', lat: 29.84, lon: 31.25, from: -3100, to: 600, size: 0.9 },
  { name: 'Thebes', lat: 25.7, lon: 32.64, from: -3200, to: 0, size: 0.8 },
  { name: 'Harappa', lat: 30.63, lon: 72.86, from: -3300, to: -1300, size: 0.7 },
  { name: 'Mohenjo-daro', lat: 27.33, lon: 68.14, from: -2500, to: -1700, size: 0.7 },
  { name: 'Erlitou', lat: 34.7, lon: 112.69, from: -1900, to: -1500, size: 0.5 },
  { name: 'Anyang', lat: 36.1, lon: 114.35, from: -1300, to: -1046, size: 0.6 },
  { name: 'Luoyang', lat: 34.62, lon: 112.45, from: -2000, size: 0.8 },
  { name: "Chang'an", lat: 34.34, lon: 108.94, from: -1100, size: 1.1 },
  { name: 'Caral', lat: -10.89, lon: -77.52, from: -2600, to: -1800, size: 0.4 },
  { name: 'Chavín', lat: -9.59, lon: -77.18, from: -900, to: -200, size: 0.3 },
  { name: 'La Venta', lat: 18.1, lon: -94.04, from: -1200, to: -400, size: 0.35 },
  { name: 'Monte Albán', lat: 17.04, lon: -96.77, from: -500, to: 800, size: 0.4 },
  { name: 'Teotihuacan', lat: 19.69, lon: -98.84, from: -100, to: 550, size: 0.9 },
  { name: 'Tikal', lat: 17.22, lon: -89.62, from: -400, to: 900, size: 0.6 },
  { name: 'Tiwanaku', lat: -16.55, lon: -68.67, from: 100, to: 1000, size: 0.5 },
  { name: 'Cusco', lat: -13.53, lon: -71.97, from: 1100, size: 0.6 },
  { name: 'Tenochtitlan', lat: 19.43, lon: -99.13, from: 1325, size: 0.9 },
  { name: 'Cahokia', lat: 38.66, lon: -90.06, from: 1050, to: 1350, size: 0.4 },
  { name: 'Athens', lat: 37.98, lon: 23.73, from: -1400, size: 0.7 },
  { name: 'Rome', lat: 41.9, lon: 12.5, from: -753, size: 1.2 },
  { name: 'Carthage', lat: 36.85, lon: 10.32, from: -814, to: 698, size: 0.7 },
  { name: 'Alexandria', lat: 31.2, lon: 29.92, from: -331, size: 1.0 },
  { name: 'Byzantium', lat: 41.01, lon: 28.98, from: -660, size: 1.0 },
  { name: 'Persepolis', lat: 29.94, lon: 52.89, from: -518, to: -330, size: 0.5 },
  { name: 'Ctesiphon', lat: 33.09, lon: 44.58, from: -120, to: 637, size: 0.8 },
  { name: 'Baghdad', lat: 33.31, lon: 44.37, from: 762, size: 1.1 },
  { name: 'Damascus', lat: 33.51, lon: 36.29, from: -3000, size: 0.6 },
  { name: 'Jerusalem', lat: 31.77, lon: 35.23, from: -3000, size: 0.4 },
  { name: 'Antioch', lat: 36.2, lon: 36.16, from: -300, to: 1268, size: 0.7 },
  { name: 'Pataliputra', lat: 25.61, lon: 85.14, from: -490, size: 0.9 },
  { name: 'Taxila', lat: 33.75, lon: 72.82, from: -1000, to: 500, size: 0.5 },
  { name: 'Anuradhapura', lat: 8.31, lon: 80.4, from: -400, to: 1017, size: 0.5 },
  { name: 'Angkor', lat: 13.41, lon: 103.87, from: 800, size: 0.9 },
  { name: 'Nara', lat: 34.69, lon: 135.8, from: 710, size: 0.5 },
  { name: 'Kyoto', lat: 35.01, lon: 135.77, from: 794, size: 0.8 },
  { name: 'Gyeongju', lat: 35.86, lon: 129.22, from: -57, size: 0.5 },
  { name: 'Samarkand', lat: 39.65, lon: 66.96, from: -700, size: 0.7 },
  { name: 'Merv', lat: 37.66, lon: 62.19, from: -500, to: 1221, size: 0.7 },
  { name: 'Dunhuang', lat: 40.14, lon: 94.66, from: -100, size: 0.4 },
  { name: 'Kashgar', lat: 39.47, lon: 75.99, from: -200, size: 0.5 },
  { name: 'Aksum', lat: 14.13, lon: 38.72, from: 100, to: 940, size: 0.5 },
  { name: 'Meroë', lat: 16.94, lon: 33.75, from: -800, to: 350, size: 0.5 },
  { name: 'Djenné', lat: 13.91, lon: -4.55, from: 250, size: 0.4 },
  { name: 'Timbuktu', lat: 16.77, lon: -3.0, from: 1100, size: 0.5 },
  { name: 'Great Zimbabwe', lat: -20.27, lon: 30.93, from: 1100, to: 1450, size: 0.4 },
  { name: 'Córdoba', lat: 37.88, lon: -4.78, from: 700, size: 0.8 },
  { name: 'Cairo', lat: 30.04, lon: 31.24, from: 969, size: 1.0 },
  { name: 'Paris', lat: 48.86, lon: 2.35, from: 500, size: 0.6 },
  { name: 'London', lat: 51.51, lon: -0.13, from: 50, size: 0.5 },
  { name: 'Venice', lat: 45.44, lon: 12.33, from: 800, size: 0.7 },
  { name: 'Hangzhou', lat: 30.27, lon: 120.16, from: 600, size: 1.0 },
  { name: 'Kaifeng', lat: 34.8, lon: 114.31, from: 900, size: 0.9 },
  { name: 'Beijing', lat: 39.9, lon: 116.4, from: 1000, size: 1.0 },
  { name: 'Delhi', lat: 28.61, lon: 77.21, from: 1050, size: 0.8 },
  { name: 'Vijayanagara', lat: 15.33, lon: 76.46, from: 1336, size: 0.8 },
  { name: 'Malacca', lat: 2.19, lon: 102.25, from: 1400, size: 0.6 },
  { name: 'Guangzhou', lat: 23.13, lon: 113.26, from: -200, size: 0.8 },
  { name: 'Calicut', lat: 11.26, lon: 75.78, from: 1100, size: 0.5 },
  { name: 'Aden', lat: 12.79, lon: 45.02, from: -500, size: 0.4 },
  { name: 'Kaffa', lat: 45.03, lon: 35.38, from: 1266, size: 0.3 },
];

export const POLITIES: Polity[] = [
  { name: 'Akkad', lat: 32.5, lon: 44.5, r: 6, rise: -2334, peak: -2250, fall: -2154, color: [0.9, 0.7, 0.3] },
  { name: 'Old Kingdom', lat: 27, lon: 31.2, r: 5, rise: -2686, peak: -2500, fall: -2181, color: [0.95, 0.78, 0.35] },
  { name: 'Harappa', lat: 28, lon: 70, r: 7, rise: -2600, peak: -2200, fall: -1900, color: [0.75, 0.55, 0.35] },
  { name: 'New Kingdom', lat: 26.5, lon: 32, r: 8, rise: -1550, peak: -1400, fall: -1070, color: [0.95, 0.78, 0.35] },
  { name: 'Shang', lat: 35, lon: 114, r: 5, rise: -1600, peak: -1300, fall: -1046, color: [0.45, 0.75, 0.6] },
  { name: 'Zhou', lat: 34.5, lon: 111, r: 7, rise: -1046, peak: -800, fall: -256, color: [0.45, 0.75, 0.6] },
  { name: 'Achaemenid', lat: 31, lon: 52, r: 17, rise: -550, peak: -480, fall: -330, color: [0.55, 0.45, 0.85] },
  { name: 'Macedon', lat: 33, lon: 45, r: 19, rise: -336, peak: -323, fall: -305, color: [0.85, 0.8, 0.6] },
  { name: 'Maurya', lat: 24, lon: 80, r: 12, rise: -322, peak: -260, fall: -185, color: [0.9, 0.5, 0.3] },
  { name: 'Han', lat: 34, lon: 110, r: 13, rise: -202, peak: 0, fall: 220, color: [0.4, 0.8, 0.6] },
  { name: 'Rome', lat: 41.9, lon: 12.5, r: 16, rise: -264, peak: 117, fall: 476, color: [0.85, 0.22, 0.18] },
  { name: 'Byzantium', lat: 39.5, lon: 30, r: 11, rise: 395, peak: 555, fall: 1453, color: [0.65, 0.3, 0.55] },
  { name: 'Gupta', lat: 25, lon: 82, r: 10, rise: 320, peak: 400, fall: 550, color: [0.95, 0.6, 0.25] },
  { name: 'Teotihuacan', lat: 19.7, lon: -98.8, r: 3, rise: -100, peak: 450, fall: 550, color: [0.35, 0.75, 0.65] },
  { name: 'Maya', lat: 17.5, lon: -89.5, r: 5, rise: 250, peak: 700, fall: 900, color: [0.3, 0.8, 0.55] },
  { name: 'Tang', lat: 34, lon: 108, r: 14, rise: 618, peak: 700, fall: 907, color: [0.4, 0.8, 0.6] },
  { name: 'Abbasid', lat: 33, lon: 44, r: 16, rise: 750, peak: 800, fall: 1258, color: [0.3, 0.65, 0.4] },
  { name: 'Khmer', lat: 13.4, lon: 103.9, r: 6, rise: 802, peak: 1150, fall: 1431, color: [0.85, 0.65, 0.3] },
  { name: 'Song', lat: 30, lon: 115, r: 10, rise: 960, peak: 1100, fall: 1279, color: [0.45, 0.8, 0.6] },
  { name: 'Mongol', lat: 45, lon: 95, r: 30, rise: 1206, peak: 1279, fall: 1368, color: [0.75, 0.75, 0.85] },
  { name: 'Mali', lat: 14, lon: -4, r: 8, rise: 1235, peak: 1350, fall: 1600, color: [0.95, 0.75, 0.3] },
  { name: 'Ottoman', lat: 39, lon: 32, r: 12, rise: 1299, peak: 1520, fall: 1922, color: [0.7, 0.25, 0.25] },
  { name: 'Aztec', lat: 19.4, lon: -99.1, r: 4, rise: 1428, peak: 1500, fall: 1521, color: [0.35, 0.75, 0.65] },
  { name: 'Inca', lat: -13, lon: -72, r: 12, rise: 1438, peak: 1500, fall: 1533, color: [0.95, 0.7, 0.3] },
];

export const ROUTES: Route[] = [
  { name: 'Silk Road', from: -130, to: 1450, weight: 1.0, pts: [[34.34, 108.94], [36.06, 103.8], [40.14, 94.66], [39.47, 75.99], [39.65, 66.96], [37.66, 62.19], [35.7, 51.4], [33.1, 44.6], [36.2, 36.2], [41.0, 29.0]] },
  { name: 'Maritime Silk Road', from: -100, to: 1550, weight: 0.9, pts: [[23.1, 113.3], [10.8, 106.7], [2.2, 102.2], [5.9, 95.3], [7.9, 80.5], [11.2, 75.8], [12.8, 45.0], [23.9, 35.5], [31.2, 29.9]] },
  { name: 'Mediterranean', from: -800, to: 1550, weight: 0.8, pts: [[31.2, 29.9], [35.5, 24.0], [37.9, 15.3], [41.9, 12.5], [43.3, 5.4], [36.85, 10.32], [37.9, 15.3]] },
  { name: 'Aegean', from: -1500, to: 1550, weight: 0.6, pts: [[41.0, 29.0], [38.0, 23.7], [35.3, 25.1], [31.2, 29.9]] },
  { name: 'Incense Road', from: -1000, to: 300, weight: 0.5, pts: [[12.8, 45.0], [15.5, 44.2], [21.5, 39.8], [26.6, 37.9], [30.3, 35.4], [31.5, 34.4]] },
  { name: 'Trans-Saharan', from: 800, to: 1550, weight: 0.6, pts: [[16.77, -3.0], [22.7, -6.2], [31.3, -4.3], [34.0, -5.0]] },
  { name: 'Grand Canal', from: 610, to: 1550, weight: 0.5, pts: [[30.27, 120.16], [32.4, 119.4], [34.8, 114.3], [39.9, 116.4]] },
  { name: 'Venetian', from: 900, to: 1550, weight: 0.5, pts: [[45.44, 12.33], [40.6, 19.0], [37.0, 22.0], [41.0, 29.0]] },
  { name: 'Mesoamerica', from: -100, to: 1520, weight: 0.35, pts: [[19.69, -98.84], [18.1, -94.0], [17.22, -89.62]] },
  { name: 'Andes', from: 1100, to: 1533, weight: 0.35, pts: [[-13.53, -71.97], [-16.5, -68.2], [-8.1, -79.0], [-0.2, -78.5]] },
  { name: 'Indian Ocean', from: -50, to: 1550, weight: 0.6, pts: [[12.8, 45.0], [-4.0, 39.7], [-6.2, 39.2]] },
];

/** Population weight of a city at astronomical year y (0 before founding). */
export function cityWeight(c: City, y: number): number {
  if (y < c.from) return 0;
  const grow = Math.min(1, (y - c.from) / 400);
  const fade = c.to !== undefined ? Math.max(0, Math.min(1, (c.to - y) / 150 + 0.15)) : 1;
  return c.size * grow * fade;
}

/** 0..1 power of a polity at astronomical year y. */
export function polityPower(p: Polity, y: number): number {
  if (y < p.rise || y > p.fall + 60) return 0;
  if (y < p.peak) return 0.25 + 0.75 * ((y - p.rise) / Math.max(1, p.peak - p.rise));
  return Math.max(0, 1 - ((y - p.peak) / Math.max(1, p.fall - p.peak)) * 0.75 - Math.max(0, y - p.fall) / 60);
}

export function gcDist(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const D = Math.PI / 180;
  const a = Math.sin(((lat2 - lat1) * D) / 2) ** 2 + Math.cos(lat1 * D) * Math.cos(lat2 * D) * Math.sin(((lon2 - lon1) * D) / 2) ** 2;
  return (2 * Math.asin(Math.min(1, Math.sqrt(a)))) / D;
}
