/**
 * Modern cities (Chapter 6–7): [name, lat, lon, industrial year, weight 2026 (≈ metro size, log-ish)].
 * Industrial year ≈ when the city's lights become electric-scale.
 */
export type ModernCity = [string, number, number, number, number];

export const MODERN_CITIES: ModernCity[] = [
  ['London', 51.51, -0.13, 1770, 1.0], ['Manchester', 53.48, -2.24, 1765, 0.6], ['Birmingham', 52.49, -1.89, 1770, 0.55], ['Glasgow', 55.86, -4.25, 1790, 0.45],
  ['Liverpool', 53.41, -2.98, 1780, 0.45], ['Leeds', 53.8, -1.55, 1790, 0.4], ['Paris', 48.86, 2.35, 1820, 1.0], ['Lille', 50.63, 3.06, 1830, 0.4],
  ['Brussels', 50.85, 4.35, 1825, 0.5], ['Amsterdam', 52.37, 4.9, 1840, 0.55], ['Essen', 51.46, 7.01, 1840, 0.6], ['Cologne', 50.94, 6.96, 1845, 0.5],
  ['Berlin', 52.52, 13.4, 1850, 0.8], ['Hamburg', 53.55, 9.99, 1850, 0.6], ['Munich', 48.14, 11.58, 1870, 0.5], ['Vienna', 48.21, 16.37, 1860, 0.6],
  ['Prague', 50.08, 14.44, 1860, 0.45], ['Warsaw', 52.23, 21.01, 1880, 0.55], ['Milan', 45.46, 9.19, 1880, 0.65], ['Turin', 45.07, 7.69, 1885, 0.45],
  ['Rome', 41.9, 12.5, 1900, 0.6], ['Naples', 40.85, 14.27, 1910, 0.5], ['Barcelona', 41.39, 2.17, 1870, 0.6], ['Madrid', 40.42, -3.7, 1900, 0.65],
  ['Lisbon', 38.72, -9.14, 1910, 0.45], ['Stockholm', 59.33, 18.07, 1890, 0.45], ['Copenhagen', 55.68, 12.57, 1880, 0.45], ['Oslo', 59.91, 10.75, 1900, 0.35],
  ['Helsinki', 60.17, 24.94, 1910, 0.35], ['St Petersburg', 59.93, 30.36, 1870, 0.65], ['Moscow', 55.76, 37.62, 1880, 0.95], ['Kyiv', 50.45, 30.52, 1900, 0.55],
  ['Budapest', 47.5, 19.04, 1880, 0.5], ['Bucharest', 44.43, 26.1, 1920, 0.45], ['Istanbul', 41.01, 28.98, 1920, 0.85], ['Athens', 37.98, 23.73, 1930, 0.5],
  ['New York', 40.71, -74.01, 1830, 1.1], ['Philadelphia', 39.95, -75.17, 1830, 0.65], ['Boston', 42.36, -71.06, 1825, 0.6], ['Baltimore', 39.29, -76.61, 1840, 0.45],
  ['Washington', 38.91, -77.04, 1880, 0.6], ['Pittsburgh', 40.44, -80.0, 1850, 0.45], ['Chicago', 41.88, -87.63, 1860, 0.85], ['Detroit', 42.33, -83.05, 1890, 0.55],
  ['Cleveland', 41.5, -81.69, 1870, 0.4], ['St Louis', 38.63, -90.2, 1870, 0.45], ['Atlanta', 33.75, -84.39, 1910, 0.6], ['Miami', 25.76, -80.19, 1930, 0.6],
  ['Houston', 29.76, -95.37, 1920, 0.7], ['Dallas', 32.78, -96.8, 1920, 0.65], ['Denver', 39.74, -104.99, 1920, 0.45], ['Phoenix', 33.45, -112.07, 1950, 0.55],
  ['Los Angeles', 34.05, -118.24, 1910, 0.95], ['San Francisco', 37.77, -122.42, 1890, 0.65], ['Seattle', 47.61, -122.33, 1920, 0.55], ['Toronto', 43.65, -79.38, 1890, 0.65],
  ['Montreal', 45.5, -73.57, 1880, 0.55], ['Vancouver', 49.28, -123.12, 1930, 0.45], ['Mexico City', 19.43, -99.13, 1930, 0.95], ['Monterrey', 25.69, -100.32, 1950, 0.5],
  ['Guadalajara', 20.66, -103.35, 1950, 0.5], ['Havana', 23.11, -82.37, 1930, 0.4], ['Bogotá', 4.71, -74.07, 1950, 0.65], ['Caracas', 10.48, -66.9, 1950, 0.5],
  ['Lima', -12.05, -77.04, 1950, 0.65], ['Santiago', -33.45, -70.67, 1940, 0.6], ['Buenos Aires', -34.6, -58.38, 1900, 0.85], ['São Paulo', -23.55, -46.63, 1930, 1.0],
  ['Rio de Janeiro', -22.91, -43.17, 1920, 0.8], ['Belo Horizonte', -19.92, -43.94, 1960, 0.5], ['Cairo', 30.04, 31.24, 1930, 0.9], ['Alexandria', 31.2, 29.92, 1940, 0.5],
  ['Lagos', 6.52, 3.38, 1970, 0.8], ['Kinshasa', -4.44, 15.27, 1980, 0.65], ['Nairobi', -1.29, 36.82, 1970, 0.5], ['Addis Ababa', 9.03, 38.74, 1980, 0.5],
  ['Johannesburg', -26.2, 28.05, 1900, 0.7], ['Cape Town', -33.92, 18.42, 1920, 0.45], ['Casablanca', 33.57, -7.59, 1950, 0.5], ['Algiers', 36.75, 3.06, 1950, 0.45],
  ['Accra', 5.6, -0.19, 1980, 0.45], ['Khartoum', 15.5, 32.56, 1980, 0.45], ['Tehran', 35.69, 51.39, 1950, 0.8], ['Baghdad', 33.31, 44.37, 1950, 0.6],
  ['Riyadh', 24.71, 46.68, 1970, 0.6], ['Dubai', 25.2, 55.27, 1980, 0.55], ['Karachi', 24.86, 67.01, 1960, 0.8], ['Lahore', 31.55, 74.34, 1960, 0.7],
  ['Delhi', 28.61, 77.21, 1950, 1.0], ['Mumbai', 19.08, 72.88, 1900, 1.0], ['Kolkata', 22.57, 88.36, 1900, 0.85], ['Chennai', 13.08, 80.27, 1930, 0.7],
  ['Bangalore', 12.97, 77.59, 1960, 0.75], ['Hyderabad', 17.39, 78.49, 1960, 0.7], ['Dhaka', 23.81, 90.41, 1970, 0.9], ['Bangkok', 13.76, 100.5, 1960, 0.8],
  ['Yangon', 16.87, 96.2, 1980, 0.5], ['Kuala Lumpur', 3.14, 101.69, 1970, 0.6], ['Singapore', 1.35, 103.82, 1960, 0.6], ['Jakarta', -6.21, 106.85, 1970, 0.95],
  ['Manila', 14.6, 120.98, 1960, 0.85], ['Ho Chi Minh City', 10.82, 106.63, 1975, 0.7], ['Hanoi', 21.03, 105.85, 1980, 0.6], ['Hong Kong', 22.32, 114.17, 1950, 0.7],
  ['Guangzhou', 23.13, 113.26, 1980, 0.95], ['Shenzhen', 22.54, 114.06, 1985, 0.9], ['Shanghai', 31.23, 121.47, 1920, 1.05], ['Beijing', 39.9, 116.4, 1950, 1.0],
  ['Tianjin', 39.34, 117.36, 1950, 0.7], ['Wuhan', 30.59, 114.31, 1960, 0.7], ['Chengdu', 30.57, 104.07, 1970, 0.75], ['Chongqing', 29.56, 106.55, 1970, 0.75],
  ["Xi'an", 34.34, 108.94, 1970, 0.6], ['Shenyang', 41.81, 123.43, 1940, 0.55], ['Seoul', 37.57, 126.98, 1960, 0.95], ['Busan', 35.18, 129.08, 1970, 0.5],
  ['Tokyo', 35.68, 139.69, 1900, 1.15], ['Osaka', 34.69, 135.5, 1900, 0.85], ['Nagoya', 35.18, 136.91, 1920, 0.55], ['Taipei', 25.03, 121.57, 1960, 0.6],
  ['Sydney', -33.87, 151.21, 1910, 0.6], ['Melbourne', -37.81, 144.96, 1900, 0.55], ['Brisbane', -27.47, 153.03, 1950, 0.4], ['Perth', -31.95, 115.86, 1960, 0.35],
  ['Auckland', -36.85, 174.76, 1960, 0.35], ['Novosibirsk', 55.03, 82.92, 1950, 0.4], ['Almaty', 43.24, 76.89, 1960, 0.35], ['Tashkent', 41.3, 69.24, 1960, 0.45],
];

/** Great-circle links of the fibre backbone (indices by city name). */
export const FIBER_LINKS: [string, string][] = [
  ['New York', 'London'], ['New York', 'Paris'], ['Boston', 'London'], ['Miami', 'São Paulo'], ['Miami', 'Bogotá'], ['Los Angeles', 'Tokyo'],
  ['San Francisco', 'Tokyo'], ['Seattle', 'Tokyo'], ['Los Angeles', 'Sydney'], ['London', 'Lisbon'], ['Lisbon', 'Lagos'], ['Lagos', 'Cape Town'],
  ['Marseille', 'Cairo'], ['Cairo', 'Mumbai'], ['Mumbai', 'Singapore'], ['Singapore', 'Hong Kong'], ['Hong Kong', 'Tokyo'], ['Singapore', 'Sydney'],
  ['Singapore', 'Jakarta'], ['Hong Kong', 'Shanghai'], ['Shanghai', 'Tokyo'], ['Seoul', 'Tokyo'], ['London', 'Amsterdam'], ['Amsterdam', 'Berlin'],
  ['Berlin', 'Moscow'], ['Moscow', 'Beijing'], ['Paris', 'Milan'], ['Frankfurt', 'Istanbul'], ['Istanbul', 'Tehran'], ['Tehran', 'Delhi'],
  ['Delhi', 'Mumbai'], ['Mumbai', 'Dubai'], ['Dubai', 'Cairo'], ['New York', 'Chicago'], ['Chicago', 'Los Angeles'], ['Chicago', 'Dallas'],
  ['Dallas', 'Mexico City'], ['Mexico City', 'Bogotá'], ['Bogotá', 'Lima'], ['Lima', 'Santiago'], ['Santiago', 'Buenos Aires'], ['Buenos Aires', 'São Paulo'],
  ['São Paulo', 'Lagos'], ['Cape Town', 'Mumbai'], ['Nairobi', 'Dubai'], ['Sydney', 'Auckland'], ['Toronto', 'New York'], ['Washington', 'Atlanta'],
  ['Atlanta', 'Houston'], ['Houston', 'Los Angeles'], ['Madrid', 'Paris'], ['Madrid', 'Lisbon'], ['Rome', 'Cairo'], ['Bangkok', 'Singapore'],
  ['Kolkata', 'Bangkok'], ['Beijing', 'Seoul'], ['Beijing', 'Shanghai'], ['Delhi', 'Kolkata'], ['Karachi', 'Dubai'], ['Riyadh', 'Dubai'],
];

/** Age of Sail and modern sea lanes. */
export const SEA_LANES: { from: number; to: number; pts: [number, number][]; weight: number }[] = [
  { from: 1493, to: 2030, weight: 0.8, pts: [[38.7, -9.1], [28.0, -16.0], [18.5, -40.0], [18.4, -66.1], [23.1, -82.4]] },
  { from: 1520, to: 2030, weight: 0.6, pts: [[36.5, -6.3], [25.0, -30.0], [19.2, -96.1]] },
  { from: 1565, to: 1815, weight: 0.5, pts: [[14.6, 121.0], [20.0, 160.0], [35.0, -140.0], [16.8, -99.9]] },
  { from: 1500, to: 2030, weight: 0.7, pts: [[38.7, -9.1], [15.0, -20.0], [-34.4, 18.5], [-25.0, 45.0], [11.2, 75.8]] },
  { from: 1600, to: 2030, weight: 0.6, pts: [[52.4, 4.9], [50.0, -5.0], [5.0, -20.0], [-34.4, 18.5], [-6.2, 106.8]] },
  { from: 1620, to: 2030, weight: 0.6, pts: [[51.5, -0.1], [49.0, -20.0], [42.4, -71.0]] },
  { from: 1700, to: 2030, weight: 0.5, pts: [[51.5, -0.1], [10.0, -25.0], [-22.9, -43.2]] },
  { from: 1869, to: 2030, weight: 0.8, pts: [[51.5, -0.1], [36.0, -6.0], [31.2, 32.3], [12.6, 43.4], [6.9, 79.9], [1.3, 103.8], [22.3, 114.2]] },
  { from: 1914, to: 2030, weight: 0.6, pts: [[40.7, -74.0], [9.3, -79.9], [-12.0, -77.1]] },
  { from: 1850, to: 2030, weight: 0.6, pts: [[37.8, -122.4], [21.3, -157.9], [35.4, 139.7]] },
];
