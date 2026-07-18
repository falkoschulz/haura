/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Sun, Cloud, CloudSun, CloudRain, CloudDrizzle, CloudSnow, CloudLightning,
  CloudFog, Wind, Droplets, RefreshCw, Compass, AlertTriangle, Sparkles, Database, Moon
} from 'lucide-react';
import { WeatherSourceId, WeatherData, ScreensaverSettings } from '../types';
import { WEATHER_SOURCES } from '../constants';

interface WeatherWidgetProps {
  settings: ScreensaverSettings;
  data: WeatherData | null;
  loading: boolean;
  errorMsg: string | null;
  onRefresh: () => void;
  onUpdateSetting: <K extends keyof ScreensaverSettings>(key: K, value: ScreensaverSettings[K]) => void;
}

export default function WeatherWidget({
  settings,
  data,
  loading,
  errorMsg,
  onRefresh,
  onUpdateSetting
}: WeatherWidgetProps) {
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const triggerRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 800);
    onRefresh();
  };

  const onUnitToggle = () => {
    onUpdateSetting('temperatureUnit', settings.temperatureUnit === 'C' ? 'F' : 'C');
  };

  // Render weather matching dynamic icon string
  const renderWeatherIcon = (iconName: string, sizeClass = "w-10 h-10") => {
    switch (iconName) {
      case 'Sun': return <Sun className={`${sizeClass} text-amber-400 animate-pulse-subtle`} />;
      case 'CloudSun': return <CloudSun className={`${sizeClass} text-yellow-300`} />;
      case 'Cloud': return <Cloud className={`${sizeClass} text-gray-300`} />;
      case 'CloudRain': return <CloudRain className={`${sizeClass} text-blue-400`} />;
      case 'CloudDrizzle': return <CloudDrizzle className={`${sizeClass} text-cyan-300`} />;
      case 'CloudSnow': return <CloudSnow className={`${sizeClass} text-indigo-200`} />;
      case 'CloudLightning': return <CloudLightning className={`${sizeClass} text-amber-300`} />;
      case 'CloudFog': return <CloudFog className={`${sizeClass} text-slate-400`} />;
      case 'Sparkles': return <Sparkles className={`${sizeClass} text-violet-400 animate-pulse`} />;
      case 'CloudAlert': return <AlertTriangle className={`${sizeClass} text-rose-400 animate-bounce`} />;
      case 'MoonStar': return <Moon className={`${sizeClass} text-indigo-300`} />;
      default: return <Sun className={`${sizeClass} text-amber-400`} />;
    }
  };

  const activeSourceDetail = WEATHER_SOURCES.find(s => s.id === settings.weatherSource);

  return (
    <div id="weather-card" className="bg-gray-900/60 border border-gray-800 rounded-2xl p-5 mb-6 backdrop-blur-md">
      {/* Header and Source choice */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gray-800/80 pb-4 mb-4 gap-3">
        <div>
          <h3 className="text-sm font-semibold text-gray-100 flex items-center gap-2">
            <Compass className="w-4 h-4 text-sky-400" />
            Meteorological Data Engine
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">
            Choose feed and target screen location.
          </p>
        </div>

        {/* Toggle units and refresh actions */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            id="temp-unit-toggle"
            onClick={onUnitToggle}
            className="px-2.5 py-1 bg-gray-800/80 hover:bg-gray-800 rounded-lg text-xs font-semibold text-gray-300 uppercase shrink-0 transition-colors border border-gray-700/60 cursor-pointer"
          >
            Show &deg;{settings.temperatureUnit === 'C' ? 'F' : 'C'}
          </button>
          
          <button
            id="refresh-weather-btn"
            onClick={triggerRefresh}
            disabled={loading}
            className="p-1.5 bg-gray-800/80 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-gray-200 transition-all shrink-0 border border-gray-700/60 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-sky-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Grid selector: Weather Source & Geography Preset */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
        
        {/* Source selector */}
        <div>
          <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
            Active Weather Source
          </label>
          <div className="grid grid-cols-2 gap-2">
            {WEATHER_SOURCES.map((s) => (
              <button
                id={`source-btn-${s.id}`}
                key={s.id}
                onClick={() => onUpdateSetting('weatherSource', s.id)}
                className={`py-2 px-3 text-left rounded-xl transition-all border text-xs flex flex-col justify-between h-16 cursor-pointer ${
                  settings.weatherSource === s.id
                    ? 'bg-sky-500/10 border-sky-500/60 text-sky-200 shadow-sm'
                    : 'bg-gray-950/40 border-gray-800/80 text-gray-400 hover:border-gray-700/80'
                }`}
              >
                <span className="font-semibold">{s.name}</span>
                <span className="text-[9px] text-gray-500 truncate">{s.provider}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Location selector */}
        <div>
          <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
            Geography Target
          </label>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <input 
                type="checkbox" 
                id="use-auto-location"
                checked={settings.useAutoLocation}
                onChange={(e) => onUpdateSetting('useAutoLocation', e.target.checked)}
                className="rounded border-gray-700 bg-gray-900 text-sky-500"
              />
              <label htmlFor="use-auto-location" className="text-xs text-gray-300 cursor-pointer">
                Auto-detect (GPS / IP Location)
              </label>
            </div>
            {!settings.useAutoLocation && (
              <div className="space-y-2">
                <div>
                  <label className="text-[10px] text-gray-500 block mb-1">Display Name</label>
                  <input
                    type="text"
                    value={settings.manualLocationName}
                    onChange={(e) => onUpdateSetting('manualLocationName', e.target.value)}
                    className="w-full bg-gray-950/60 text-gray-300 text-xs border border-gray-800 rounded p-1.5"
                    placeholder="Custom Location Name"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-gray-500 block mb-1">Latitude</label>
                    <input
                      type="text"
                      value={settings.latitude}
                      onChange={(e) => onUpdateSetting('latitude', e.target.value)}
                      className="w-full bg-gray-950/60 text-gray-300 text-xs border border-gray-800 rounded p-1.5"
                      placeholder="-33.86"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-500 block mb-1">Longitude</label>
                    <input
                      type="text"
                      value={settings.longitude}
                      onChange={(e) => onUpdateSetting('longitude', e.target.value)}
                      className="w-full bg-gray-950/60 text-gray-300 text-xs border border-gray-800 rounded p-1.5"
                      placeholder="151.20"
                    />
                  </div>
                </div>
              </div>
            )}
            
            {activeSourceDetail && (
              <p className="text-[10px] text-gray-500 italic mt-1 leading-relaxed">
                {activeSourceDetail.description}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Main meteorological content frame */}
      {loading ? (
        <div id="weather-details-loader" className="bg-gray-950/40 border border-gray-800/40 rounded-xl p-6 flex flex-col items-center justify-center h-32 gap-3 text-xs text-gray-400">
          <div className="w-5 h-5 border-2 border-sky-400 border-t-transparent rounded-full animate-spin"></div>
          Polling Atmospheric Feed...
        </div>
      ) : (
        <div id="weather-details-container" className="space-y-4">
          
          {errorMsg && (
            <div className="text-[10px] bg-red-950/30 text-rose-300 border border-rose-950 px-3 py-2 rounded-lg flex items-center gap-2">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {data && (
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 bg-gray-950/60 p-4 rounded-xl border border-gray-800/60">
              
              {/* Primary large display */}
              <div className="md:col-span-2 flex items-center gap-4 border-r border-gray-800/60 pr-4">
                <div className="p-3 bg-gray-900 border border-gray-800/80 rounded-xl">
                  {renderWeatherIcon(data.icon, "w-12 h-12")}
                </div>
                <div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold font-sans tracking-tight text-white">{data.temp}</span>
                    <span className="text-lg font-bold text-sky-400">&deg;{settings.temperatureUnit}</span>
                  </div>
                  <p className="text-xs text-gray-200 mt-1 font-medium capitalize prose line-clamp-2">{data.condition}</p>
                </div>
              </div>

              {/* Extra telemetry parameters */}
              <div className="md:col-span-3 grid grid-cols-2 gap-3 pl-0 md:pl-2 text-xs flex-col justify-center">
                <div className="flex items-center gap-2 bg-gray-900/40 p-2.5 rounded-lg border border-gray-800/30">
                  <Droplets className="w-4 h-4 text-sky-400 shrink-0" />
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide">Humidity</p>
                    <p className="font-semibold text-gray-200">{data.humidity}%</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 bg-gray-900/40 p-2.5 rounded-lg border border-gray-800/30">
                  <Wind className="w-4 h-4 text-teal-400 shrink-0" />
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide">Wind Speed</p>
                    <p className="font-semibold text-gray-200">{data.windSpeed} km/h</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 bg-gray-900/40 p-2.5 rounded-lg border border-gray-800/30 col-span-2">
                  <Database className="w-4 h-4 text-gray-500 shrink-0" />
                  <div className="flex justify-between w-full text-[11px] pr-2">
                    <div>
                      <span className="text-[10px] text-gray-400 block">High/Low Range</span>
                      <span className="font-medium text-gray-100">{data.high}&deg; / {data.low}&deg; {settings.temperatureUnit}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-gray-400 block">Telemetry Sync</span>
                      <span className="font-mono text-gray-300">{data.lastUpdated}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Forecast forecast series */}
          {data && data.forecast && (
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                Hourly Meteorological Outlook
              </p>
              <div className="grid grid-cols-5 gap-2">
                {data.forecast.map((f, i) => (
                  <div key={i} className="bg-gray-950/40 border border-gray-900 rounded-xl p-2.5 text-center flex flex-col items-center gap-1.5">
                    <span className="text-[10px] font-semibold text-gray-400 font-mono">{f.time}</span>
                    {renderWeatherIcon(f.icon, "w-6 h-6")}
                    <span className="text-xs font-bold text-white">{f.temp}&deg;</span>
                    <span className="text-[9px] text-gray-500 truncate w-full">{f.condition}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
