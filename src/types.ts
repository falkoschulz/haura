/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type FontStyleId = 'modern' | 'digital' | 'mono' | 'serif' | 'clean';

export interface FontStyleConfig {
  id: FontStyleId;
  name: string;
  cssClass: string;
  description: string;
}

export type WeatherSourceId = 'open-meteo' | 'noaa' | 'tomorrow' | 'gemini-ai';

export interface WeatherSourceConfig {
  id: WeatherSourceId;
  name: string;
  provider: string;
  description: string;
  isSimulated: boolean;
}

export type PaletteId = 'morning' | 'afternoon' | 'evening' | 'night';

export interface ColorPaletteConfig {
  id: PaletteId;
  name: string;
  timeRange: string;
  bgGrad: string; // Tailwind background gradient classes
  text: string;   // Accent text class
  secondary: string;
  borderColors: string;
  glowColor: string; // Box shadow blur color representation
}

export interface WeatherData {
  temp: number;
  condition: string;
  locationName: string;
  icon: string; // Lucide icon name or description
  humidity: number;
  windSpeed: number;
  high: number;
  low: number;
  lastUpdated: string;
  forecast: {
    time: string;
    temp: number;
    icon: string;
    condition: string;
  }[];
}

export interface ScreensaverSettings {
  fontStyle: FontStyleId;
  weatherSource: WeatherSourceId;
  nightMode: 'off' | 'on' | 'auto';
  nightModeDimLevel: number; // 0 to 100
  showBackgroundWaves: boolean;
  motionSensingEnabled: boolean;
  motionSensitivity: number; // 5 to 50
  inactivityTimeout: number; // seconds
  burnInInterval: number; // seconds
  paletteOverride: 'auto' | PaletteId;
  temperatureUnit: 'C' | 'F';
  showSeconds: boolean;
  
  // Weather location settings
  useAutoLocation: boolean;
  latitude: string;
  longitude: string;
  manualLocationName: string;
  
  // Screensaver layout settings
  screensaverContentScale: number; // 0.1 to 2.0
  
  // Home Assistant FoxESS integration settings
  enableHomeAssistant: boolean;
  haUrl: string;
  haToken: string;
  entityBatterySoc: string;
  entityInvBatPower: string;
  entityGridCt: string;
  entitySolarToday: string;
  entityHouseLoad: string;
  entityIndoorTemp: string;
  entityOutdoorTemp: string;
  simBatterySoc: number;
  simInvBatPower: number;
  simGridCt: number;
  simSolarToday: number;
  simHouseLoad: number;
  simIndoorTemp: number;
  simOutdoorTemp: number;
  simIndoorTempOffline: boolean;
  simOutdoorTempOffline: boolean;
  inverterSize: number;
}
