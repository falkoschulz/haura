/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { FontStyleConfig, WeatherSourceConfig, ColorPaletteConfig, WeatherSourceId } from './types';

export const FONT_STYLES: FontStyleConfig[] = [
  {
    id: 'digital',
    name: 'Share Tech Mono',
    cssClass: 'font-digital',
    description: 'High visibility segmented LCD layout ideal for distant wall viewing.'
  },
  {
    id: 'modern',
    name: 'Space Grotesk',
    cssClass: 'font-space',
    description: 'Modern, wide geometric typography with a subtle architectural posture.'
  },
  {
    id: 'mono',
    name: 'JetBrains Mono',
    cssClass: 'font-mono',
    description: 'Clean coding character terminals designed for pixel-perfect readability.'
  },
  {
    id: 'serif',
    name: 'Playfair Display',
    cssClass: 'font-serif',
    description: 'Timeless typographic romance with graceful curves and contrast strokes.'
  },
  {
    id: 'clean',
    name: 'Plus Jakarta Sans',
    cssClass: 'font-sans',
    description: 'A polished, modern geometric sans-serif prioritizing everyday clarity.'
  }
];

export const WEATHER_SOURCES: WeatherSourceConfig[] = [
  {
    id: 'open-meteo',
    name: 'Open-Meteo',
    provider: 'Open-Meteo API (Live Client)',
    description: 'Direct live public cloud query with real coordinates (defaults to current geolocation).',
    isSimulated: false
  },
  {
    id: 'noaa',
    name: 'NWS (NOAA)',
    provider: 'Simulated National Service Feed',
    description: 'Simulates the high-detail alerts and meteorological metrics outputted by US national stations.',
    isSimulated: true
  },
  {
    id: 'tomorrow',
    name: 'ClimaCell / Tomorrow.io',
    provider: 'Simulated Premium Clima',
    description: 'Simulates premium hyper-local data with micro-precipitation metrics.',
    isSimulated: true
  },
  {
    id: 'gemini-ai',
    name: 'Gemini Clima-AI',
    provider: 'Simulated LLM-Weather Engine',
    description: 'Simulates smart AI observations parsing barometric trends into a human summary.',
    isSimulated: true
  }
];

export const COLOR_PALETTES: ColorPaletteConfig[] = [
  {
    id: 'morning',
    name: 'Twilight Violet (Late Night / Morning)',
    timeRange: 'Twilight Deep',
    bgGrad: 'from-violet-950/40 via-elegant-bg to-zinc-950',
    text: 'text-indigo-200',
    secondary: 'text-indigo-400/80',
    borderColors: 'border-zinc-800/80',
    glowColor: 'glow-time-morning'
  },
  {
    id: 'afternoon',
    name: 'Cosmic Indigo (Solar peak)',
    timeRange: 'Afternoon Space',
    bgGrad: 'from-indigo-950/40 via-elegant-bg to-zinc-950',
    text: 'text-zinc-200',
    secondary: 'text-indigo-300/85',
    borderColors: 'border-zinc-800/80',
    glowColor: 'glow-time-afternoon'
  },
  {
    id: 'evening',
    name: 'Sunset Plum (Dusk transition)',
    timeRange: 'Plum Dusk',
    bgGrad: 'from-fuchsia-950/30 via-elegant-bg to-zinc-950',
    text: 'text-fuchsia-200',
    secondary: 'text-indigo-400/80',
    borderColors: 'border-zinc-800/80',
    glowColor: 'glow-time-evening'
  },
  {
    id: 'night',
    name: 'Midnight Velvet (Late Night)',
    timeRange: 'Late Night Protection',
    bgGrad: 'from-zinc-950 via-elegant-bg to-zinc-900/10',
    text: 'text-zinc-300',
    secondary: 'text-zinc-500',
    borderColors: 'border-zinc-900/90',
    glowColor: 'glow-time-night'
  }
];

// Generates beautiful prefilled weather records for each source scenario
export function generateMockWeatherData(source: WeatherSourceId, unit: 'C' | 'F'): any {
  const isCel = unit === 'C';
  const getTempVal = (cVal: number) => {
    return isCel ? Math.round(cVal) : Math.round((cVal * 9) / 5 + 32);
  };

  const baseForecast = [
    { time: '12:00', temp: getTempVal(22), icon: 'Sun', condition: 'Sunny' },
    { time: '15:00', temp: getTempVal(24), icon: 'CloudSun', condition: 'Partly Cloudy' },
    { time: '18:00', temp: getTempVal(19), icon: 'Cloud', condition: 'Overcast' },
    { time: '21:00', temp: getTempVal(16), icon: 'MoonStar', condition: 'Clear Night' },
    { time: '00:00', temp: getTempVal(14), icon: 'MoonStar', condition: 'Cool Breeze' },
  ];

  switch (source) {
    case 'noaa':
      return {
        temp: getTempVal(21.4),
        condition: 'Severe Storm Advisories Out',
        locationName: 'Simulated Location',
        icon: 'CloudAlert',
        humidity: 84,
        windSpeed: 24, // mph / kmh
        high: getTempVal(25),
        low: getTempVal(15),
        lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        forecast: [
          { time: '12:00', temp: getTempVal(21), icon: 'CloudRain', condition: 'Showers' },
          { time: '15:00', temp: getTempVal(23), icon: 'CloudLightning', condition: 'Thunderstorms' },
          { time: '18:00', temp: getTempVal(20), icon: 'CloudAlert', condition: 'Heavy Storms' },
          { time: '21:00', temp: getTempVal(16), icon: 'Cloud', condition: 'Overcast' },
          { time: '00:00', temp: getTempVal(14), icon: 'Moon', condition: 'Foggy Damp' },
        ]
      };
    case 'tomorrow':
      return {
        temp: getTempVal(23.1),
        condition: 'Slight Micro-Precipitation',
        locationName: 'Simulated Location',
        icon: 'CloudDrizzle',
        humidity: 62,
        windSpeed: 12,
        high: getTempVal(26),
        low: getTempVal(14),
        lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        forecast: [
          { time: '12:00', temp: getTempVal(23), icon: 'CloudSun', condition: 'Clearing Up' },
          { time: '15:00', temp: getTempVal(25), icon: 'Sun', condition: 'Full Sunlight' },
          { time: '18:00', temp: getTempVal(21), icon: 'Sun', condition: 'Golden Sunset' },
          { time: '21:00', temp: getTempVal(17), icon: 'MoonStar', condition: 'Dry Air' },
          { time: '00:00', temp: getTempVal(15), icon: 'Moon', condition: 'Serene Midnight' },
        ]
      };
    case 'gemini-ai':
      return {
        temp: getTempVal(22.8),
        condition: 'Perfect ambient ventilation. Barometer is trending higher. High comfort index.',
        locationName: 'Simulated Location',
        icon: 'Sparkles',
        humidity: 45,
        windSpeed: 8,
        high: getTempVal(24),
        low: getTempVal(16),
        lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        forecast: [
          { time: '12:00', temp: getTempVal(22), icon: 'Sparkles', condition: 'Delightful Daylight' },
          { time: '15:00', temp: getTempVal(24), icon: 'Sparkles', condition: 'Warm Breezes' },
          { time: '18:00', temp: getTempVal(20), icon: 'Sparkles', condition: 'Sunset Chill' },
          { time: '21:00', temp: getTempVal(18), icon: 'MoonStar', condition: 'Dew formation likely' },
          { time: '00:00', temp: getTempVal(16), icon: 'Moon', condition: 'Ideal Sleeping Temp' },
        ]
      };
    default:
      return {
        temp: getTempVal(20.0),
        condition: 'Mild and Sunny',
        locationName: 'Simulated Location',
        icon: 'Sun',
        humidity: 50,
        windSpeed: 10,
        high: getTempVal(23),
        low: getTempVal(13),
        lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        forecast: baseForecast
      };
  }
}
