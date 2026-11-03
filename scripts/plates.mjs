// Present-day plate assignment for land (lat/lon degrees). Shared by the mask builder and the preview tool.
export const PLATES = ['namerica', 'samerica', 'africa', 'eurasia', 'india', 'australia', 'antarctica', 'greenland', 'arabia', 'madagascar', 'zealandia', 'pacific'];

function inPoly(lat, lon, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [yi, xi] = poly[i];
    const [yj, xj] = poly[j];
    if (yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

const ARABIA = [[12.3, 43.2], [16, 41.5], [22, 38.8], [27.5, 34.8], [29.5, 34.9], [31.2, 34.2], [33.2, 35.1], [36.4, 35.8], [37.1, 38], [37.3, 42.5], [33.5, 46.2], [30.2, 48.6], [27.2, 56.4], [25.6, 57.2], [24.6, 59.8], [21, 60.5], [16, 54], [12.6, 45]];
const INDIA = [[25.2, 61.6], [29.8, 66.4], [33.2, 69.6], [35.3, 73.8], [32.6, 78.6], [30.2, 81.0], [27.9, 86.6], [27.9, 92.2], [28.6, 97.4], [24.5, 94.6], [21.6, 92.6], [20.5, 92.4], [5.5, 92.4], [5.2, 79.2], [8, 72], [20.5, 66], [24.5, 61.2]];
const AUSTRALIA = [[-0.4, 129.2], [-0.4, 156.5], [-11, 156.5], [-47, 156.5], [-47, 110], [-10.6, 110], [-9.6, 120], [-8.2, 126]];
const GREENLAND = [[59.2, -50], [59.2, -40.5], [66, -32], [70.5, -20], [76, -17], [83.8, -10], [84, -72], [78.6, -74], [76.4, -71], [68, -56], [61.5, -50.5]];

export function plateAt(lat, lon) {
  if (lat < -60) return 6;
  if (inPoly(lat, lon, GREENLAND)) return 7;
  if (lat > -26.5 && lat < -11.3 && lon > 42.5 && lon < 51.5) return 9;
  if (lat > -48.5 && lat < -33.5 && lon > 165 && lon < 179.9) return 10;
  if (inPoly(lat, lon, AUSTRALIA)) return 5;
  if (inPoly(lat, lon, INDIA)) return 4;
  if (inPoly(lat, lon, ARABIA)) return 8;
  // Pacific islands (Hawaii and friends)
  if (lat > 15 && lat < 30 && lon < -150 && lon > -180) return 11;
  // Americas
  if (lon < -25 && lon > -170) {
    if (lat > 8.6) return 0;
    if (lat > 7.0 && lon < -77.4) return 0;
    if (lat > 6.0 && lon < -81) return 0;
    return 1;
  }
  if (lon > 168 && lat > 50) return 0; // Aleutians
  // Africa
  if (lon > -20 && lon < 52 && lat < 38 && lat > -40) {
    let nb;
    if (lon < -5.6) nb = 35.95;
    else if (lon < 0) nb = 35.6;
    else if (lon < 8) nb = 37.2;
    else if (lon < 11.5) nb = 37.6;
    else if (lon < 25) nb = 33.5;
    else if (lon < 32.4) nb = 31.8;
    else if (lon < 35) nb = 31.4;
    else nb = 15;
    if (lat < nb) return 2;
  }
  return 3;
}
