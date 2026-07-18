/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Monitor,
  Tv,
  Keyboard,
  Clock,
  Settings,
  FlameKindling,
  Smartphone,
  Sparkles,
  RefreshCw,
  SunMoon,
  VolumeX,
  Type,
  Gamepad2,
  Lock,
  Unlock,
  ShieldAlert,
  Sliders,
  Maximize,
  HelpCircle,
  Undo2,
  Layers,
  Moon
} from 'lucide-react';
import { ScreensaverSettings, WeatherData, FontStyleId, WeatherSourceId, PaletteId } from './types';
import { FONT_STYLES, WEATHER_SOURCES, COLOR_PALETTES, generateMockWeatherData } from './constants';
import WeatherWidget from './components/WeatherWidget';
import MotionSensingPanel from './components/MotionSensingPanel';
import ActiveScreensaverStage from './components/ActiveScreensaverStage';
import { useHomeAssistant } from './hooks/useHomeAssistant';
import { useWeather } from './hooks/useWeather';
import HomeAssistantPanel from './components/HomeAssistantPanel';

export default function App() {
  // Initialize state from environment or defaults (no localStorage persistence)
  const [settings, setSettings] = useState<ScreensaverSettings>(() => {
    // Helper parsers for ENV defaults
    const envString = (key: string, fb: any) => import.meta.env[key] as any || fb;
    const envNum = (key: string, fb: number) => import.meta.env[key] ? Number(import.meta.env[key]) : fb;
    const envBool = (key: string, fb: boolean) => import.meta.env[key] ? import.meta.env[key] === 'true' : fb;

    return {
      fontStyle: envString('VITE_FONT_STYLE', 'digital'),
      weatherSource: envString('VITE_WEATHER_SOURCE', 'open-meteo'),
      useAutoLocation: envBool('VITE_USE_AUTO_LOCATION', true),
      latitude: envString('VITE_LATITUDE', '-33.8688'),
      longitude: envString('VITE_LONGITUDE', '151.2093'),
      manualLocationName: envString('VITE_MANUAL_LOCATION_NAME', 'Configured Location'),
      nightMode: envString('VITE_NIGHT_MODE', 'auto'),
      nightModeDimLevel: envNum('VITE_NIGHT_MODE_DIM_LEVEL', 15),
      showBackgroundWaves: envBool('VITE_SHOW_BACKGROUND_WAVES', true),
      motionSensingEnabled: envBool('VITE_MOTION_SENSING_ENABLED', false),
      motionSensitivity: envNum('VITE_MOTION_SENSITIVITY', 25),
      inactivityTimeout: envNum('VITE_INACTIVITY_TIMEOUT', 30), // 30s requested!
      burnInInterval: envNum('VITE_BURN_IN_INTERVAL', 15), // shift position for fast demo feedback
      paletteOverride: envString('VITE_PALETTE_OVERRIDE', 'auto'),
      temperatureUnit: envString('VITE_TEMPERATURE_UNIT', 'C'),
      showSeconds: envBool('VITE_SHOW_SECONDS', true),
      screensaverContentScale: envNum('VITE_SCREENSAVER_CONTENT_SCALE', 0.5),
      
      enableHomeAssistant: !!(import.meta.env.VITE_HA_URL && import.meta.env.VITE_HA_TOKEN),
      haUrl: envString('VITE_HA_URL', 'http://homeassistant.local:8123'),
      haToken: envString('VITE_HA_TOKEN', ''),
      entityBatterySoc: envString('VITE_HA_ENTITY_BATTERY_SOC', 'sensor.foxess_bat_soc'),
      entityInvBatPower: envString('VITE_HA_ENTITY_INV_BAT_POWER', 'sensor.fox_ess_h3_10_0_smart_10kw_inverter_invbatpower_1'),
      entityGridCt: envString('VITE_HA_ENTITY_GRID_CT', 'sensor.fox_ess_h3_10_0_smart_10kw_inverter_grid_ct'),
      entitySolarToday: envString('VITE_HA_ENTITY_SOLAR_TODAY', 'sensor.foxess_solar_today'),
      entityHouseLoad: envString('VITE_HA_ENTITY_HOUSE_LOAD', 'sensor.foxess_house_load'),
      entityIndoorTemp: envString('VITE_HA_ENTITY_INDOOR_TEMP', 'sensor.indoor_t_h_sensor_temperature'),
      entityOutdoorTemp: envString('VITE_HA_ENTITY_OUTDOOR_TEMP', 'sensor.outdoor_t_h_sensor_temperature'),
      simBatterySoc: envNum('VITE_SIM_BATTERY_SOC', 78),
      simInvBatPower: envNum('VITE_SIM_INV_BAT_POWER', 0.5),
      simGridCt: envNum('VITE_SIM_GRID_CT', 1.5),
      simSolarToday: envNum('VITE_SIM_SOLAR_TODAY', 12.4),
      simHouseLoad: envNum('VITE_SIM_HOUSE_LOAD', 0.85),
      simIndoorTemp: envNum('VITE_SIM_INDOOR_TEMP', 22.5),
      simOutdoorTemp: envNum('VITE_SIM_OUTDOOR_TEMP', 18.2),
      simIndoorTempOffline: envBool('VITE_SIM_INDOOR_TEMP_OFFLINE', false),
      simOutdoorTempOffline: envBool('VITE_SIM_OUTDOOR_TEMP_OFFLINE', false),
      inverterSize: envNum('VITE_INVERTER_SIZE', 10.0)
    };
  });

  // Determine if configuration screen is allowed
  const [isConfigMode] = useState<boolean>(() => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.has('setup') || urlParams.has('config');
  });

  // State managers
  const [isScreensaverActive, setIsScreensaverActive] = useState<boolean>(true); // active by default
  const [secondsOfInactivity, setSecondsOfInactivity] = useState<number>(0);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [lastMotionTime, setLastMotionTime] = useState<number>(0);
  const [activityLogs, setActivityLogs] = useState<{ id: string; msg: string; time: string }[]>([]);
  const [activeDate, setActiveDate] = useState<Date>(new Date());
  const [showDemoTip, setShowDemoTip] = useState<boolean>(true);

  // Log activity helper
  const addActivityLog = useCallback((msg: string) => {
    const logTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setActivityLogs(prev => [
      { id: Math.random().toString(36), msg, time: logTime },
      ...prev.slice(0, 19) // preserve last 20 records
    ]);
  }, []);

  // Home Assistant FoxESS state hook
  const { data: haData, refetch: testHaConnection } = useHomeAssistant(settings, addActivityLog);

  // No longer syncing settings to LocalStorage, relying on ENV
  useEffect(() => {
    // Only used conceptually now to update active components while in the config screen
  }, [settings]);

  // Update clock ticks
  useEffect(() => {
    const clockTimer = setInterval(() => {
      setActiveDate(new Date());
    }, 1000);
    return () => clearInterval(clockTimer);
  }, []);

  // Handle active user interaction inside home dash
  const resetInactivityTimer = useCallback((triggerSource: string) => {
    setSecondsOfInactivity(0);
    if (isScreensaverActive) {
      if (!isConfigMode) return;
      setIsScreensaverActive(false);
      addActivityLog(`Device unlocked via raw intent: [${triggerSource}]`);
    } else {
      // Avoid spamming log on mouse move
      if (triggerSource !== 'Passive Hover') {
        addActivityLog(`Activity registered: [${triggerSource}]`);
      }
    }
  }, [isScreensaverActive, isConfigMode, addActivityLog]);

  // Bind mouse, click, keyboard interaction reset listeners
  useEffect(() => {
    const handleResetPassive = () => resetInactivityTimer('Passive Hover');
    const handleResetActive = () => resetInactivityTimer('Touch / Click');
    const handleResetKey = () => resetInactivityTimer('Keyboard Input');

    window.addEventListener('mousemove', handleResetPassive);
    window.addEventListener('mousedown', handleResetActive);
    window.addEventListener('keydown', handleResetKey);
    window.addEventListener('touchstart', handleResetActive);

    // Warm start first logs
    addActivityLog("HAura Dashboard Initialized.");
    addActivityLog("30s default inactivity rule active.");

    return () => {
      window.removeEventListener('mousemove', handleResetPassive);
      window.removeEventListener('mousedown', handleResetActive);
      window.removeEventListener('keydown', handleResetKey);
      window.removeEventListener('touchstart', handleResetActive);
    };
  }, [resetInactivityTimer, addActivityLog]);

  // Dynamic ticker to evaluate inactivity sleep transitions
  useEffect(() => {
    const sleepTicker = setInterval(() => {
      if (isScreensaverActive) return;

      setSecondsOfInactivity(prev => {
        const next = prev + 1;
        if (next >= settings.inactivityTimeout) {
          setIsScreensaverActive(true);
          addActivityLog(`System sleep triggered! Inactivity met limit (${settings.inactivityTimeout}s)`);
          return 0;
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(sleepTicker);
  }, [isScreensaverActive, settings.inactivityTimeout, addActivityLog]);

  // Set selected palette theme classes
  const getSelectedPaletteConfig = () => {
    if (settings.paletteOverride !== 'auto') {
      return COLOR_PALETTES.find(p => p.id === settings.paletteOverride) || COLOR_PALETTES[3];
    }
    const currentHour = activeDate.getHours();
    if (currentHour >= 6 && currentHour < 12) return COLOR_PALETTES[0]; // Morning
    if (currentHour >= 12 && currentHour < 17) return COLOR_PALETTES[1]; // Afternoon
    if (currentHour >= 17 && currentHour < 21) return COLOR_PALETTES[2]; // Evening
    return COLOR_PALETTES[3]; // Night
  };

  const selectedPalette = getSelectedPaletteConfig();

  // Retrieve weather from unified hook
  const { data: unifiedWeatherData, loading: weatherLoading, errorMsg: weatherError, forceRefresh: refreshWeather } = useWeather(settings, addActivityLog);

  // Sync to local state if needed (or just use unifiedWeatherData directly)
  useEffect(() => {
    if (unifiedWeatherData) {
      setWeatherData(unifiedWeatherData);
    }
  }, [unifiedWeatherData]);

  // Handlers for settings changes
  const updateSetting = <K extends keyof ScreensaverSettings>(key: K, value: ScreensaverSettings[K]) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
    addActivityLog(`Configuration adjusted: ${String(key)} -> ${String(value)}`);
  };

  const handleManualWake = () => {
    if (!isConfigMode) {
      // If config mode is disabled, we don't exit the screensaver,
      // but we can log the tap. We may also want to manually un-dim it
      // if it's currently dimmed and relying on screensaver exit to see bright screen.
      // But typically, screensavers don't un-dim unless they exit or have specific logic.
      addActivityLog("Screensaver tapped, but config mode is locked.");
      return;
    }
    setIsScreensaverActive(false);
    setSecondsOfInactivity(0);
    addActivityLog("Screensaver dismissed manually by interactive tap.");
  };

  const handleMotionDetectedEvent = useCallback(() => {
    // Reset inactivity timer
    setSecondsOfInactivity(0);
    setLastMotionTime(Date.now());
    if (isScreensaverActive) {
      if (!isConfigMode) return;
      setIsScreensaverActive(false);
      addActivityLog("Webcam motion sensor woke device up!");
    } else {
      addActivityLog("Local motion gesture sensed. Timeout reset.");
    }
  }, [isScreensaverActive, isConfigMode, addActivityLog]);

  const testScreensaverNow = () => {
    setIsScreensaverActive(true);
    addActivityLog("Screensaver preview force-initialized.");
  };

  // Convert time to beautiful string representation
  const formatTimeText = () => {
    const hours = String(activeDate.getHours()).padStart(2, '0');
    const minutes = String(activeDate.getMinutes()).padStart(2, '0');
    const seconds = String(activeDate.getSeconds()).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  };

  const [showEnvModal, setShowEnvModal] = useState<boolean>(false);

  const generateEnvString = () => {
    return `# Wall Tablet Controller Configuration
VITE_FONT_STYLE="${settings.fontStyle}"
VITE_WEATHER_SOURCE="${settings.weatherSource}"
VITE_USE_AUTO_LOCATION="${settings.useAutoLocation}"
VITE_LATITUDE="${settings.latitude}"
VITE_LONGITUDE="${settings.longitude}"
VITE_MANUAL_LOCATION_NAME="${settings.manualLocationName}"
VITE_NIGHT_MODE="${settings.nightMode}"
VITE_NIGHT_MODE_DIM_LEVEL="${settings.nightModeDimLevel}"
VITE_SHOW_BACKGROUND_WAVES="${settings.showBackgroundWaves}"
VITE_MOTION_SENSING_ENABLED="${settings.motionSensingEnabled}"
VITE_MOTION_SENSITIVITY="${settings.motionSensitivity}"
VITE_INACTIVITY_TIMEOUT="${settings.inactivityTimeout}"
VITE_BURN_IN_INTERVAL="${settings.burnInInterval}"
VITE_PALETTE_OVERRIDE="${settings.paletteOverride}"
VITE_TEMPERATURE_UNIT="${settings.temperatureUnit}"
VITE_SHOW_SECONDS="${settings.showSeconds}"
VITE_SCREENSAVER_CONTENT_SCALE="${settings.screensaverContentScale}"

# Home Assistant Config
VITE_HA_URL="${settings.haUrl}"
VITE_HA_TOKEN="${settings.haToken}"
VITE_HA_ENTITY_BATTERY_SOC="${settings.entityBatterySoc}"
VITE_HA_ENTITY_INV_BAT_POWER="${settings.entityInvBatPower}"
VITE_HA_ENTITY_GRID_CT="${settings.entityGridCt}"
VITE_HA_ENTITY_SOLAR_TODAY="${settings.entitySolarToday}"
VITE_HA_ENTITY_HOUSE_LOAD="${settings.entityHouseLoad}"
VITE_HA_ENTITY_INDOOR_TEMP="${settings.entityIndoorTemp}"
VITE_HA_ENTITY_OUTDOOR_TEMP="${settings.entityOutdoorTemp}"

# Simulation Modes
VITE_SIM_BATTERY_SOC="${settings.simBatterySoc}"
VITE_SIM_INV_BAT_POWER="${settings.simInvBatPower}"
VITE_SIM_GRID_CT="${settings.simGridCt}"
VITE_SIM_SOLAR_TODAY="${settings.simSolarToday}"
VITE_SIM_HOUSE_LOAD="${settings.simHouseLoad}"
VITE_SIM_INDOOR_TEMP="${settings.simIndoorTemp}"
VITE_SIM_OUTDOOR_TEMP="${settings.simOutdoorTemp}"
VITE_SIM_INDOOR_TEMP_OFFLINE="${settings.simIndoorTempOffline}"
VITE_SIM_OUTDOOR_TEMP_OFFLINE="${settings.simOutdoorTempOffline}"
VITE_INVERTER_SIZE="${settings.inverterSize}"`;
  };

  const copyEnvToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generateEnvString());
      addActivityLog(".env configuration copied to clipboard.");
    } catch (err) {
      addActivityLog("Failed to copy .env to clipboard.");
    }
  };

  const resetSettingsToDefaults = () => {
    if (window.confirm("This will reload the page and reset all configuration properties to their default .env values. Continue?")) {
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col font-sans selection:bg-sky-500/30 selection:text-white">
      
      {/* 1. TOP HEADER NAVIGATION DECK */}
      <header className="border-b border-gray-900 bg-gray-950/80 backdrop-blur-md px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between sticky top-0 z-40 gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-tr from-sky-500/20 to-indigo-500/20 rounded-xl border border-sky-500/30">
            <Smartphone className="w-6 h-6 text-sky-400" />
          </div>
          <div>
            <h1 className="text-base font-bold text-gray-100 uppercase tracking-wide">
              HAura
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">
              Dual-State Smart Home Screensaver & Dashboard
            </p>
          </div>
        </div>

        {/* Real-Time Controller clock */}
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <div className="text-right hidden sm:block mr-2">
            <span className="text-xs font-bold text-gray-500 block uppercase tracking-wider font-mono">Current Local Time</span>
            <span className="font-mono text-sm text-sky-400 font-semibold">{formatTimeText()}</span>
          </div>

          <button
            onClick={() => setShowEnvModal(true)}
            className="px-3 py-2 bg-indigo-900/50 hover:bg-indigo-800/50 border border-indigo-500/30 rounded-xl text-xs font-semibold text-indigo-300 cursor-pointer active:scale-95 transition-all shadow-lg shrink-0"
            title="Show generated .env properties based on current settings"
          >
            Export .env
          </button>

          <button
            onClick={resetSettingsToDefaults}
            className="px-3 py-2 bg-gray-900 hover:bg-gray-800 border border-gray-800 rounded-xl text-xs font-semibold text-gray-300 cursor-pointer active:scale-95 transition-all shadow-lg shrink-0"
            title="Reload default settings"
          >
            Reset Defaults
          </button>

          <button
            id="force-screensaver-btn"
            onClick={testScreensaverNow}
            className="px-4 py-2 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 rounded-xl text-xs font-semibold text-white cursor-pointer active:scale-95 transition-all flex items-center gap-2 shadow-lg shadow-indigo-950/30 shrink-0"
          >
            <Maximize className="w-3.5 h-3.5" />
            Enter Screensaver
          </button>
        </div>
      </header>

      {/* Interactive Demonstration Helper Bar */}
      {showDemoTip && (
        <div className="bg-sky-500/10 border-b border-sky-500/20 px-6 py-3 flex items-center justify-between gap-4 text-xs text-sky-200">
          <div className="flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
            <p>
              <strong>Interactive Demo Tip:</strong> By default, if you don't move your mouse or click for <strong>30 seconds</strong>, the tablet automatically engages screensaver mode. You can adjust this timeout below. Wave your hand over your webcam (if enabled) or click <strong>'Simulate Wave Gesture'</strong> to watch the screensaver dismiss itself instantly from a distance!
            </p>
          </div>
          <button
            onClick={() => setShowDemoTip(false)}
            className="text-sky-400 hover:text-white shrink-0 font-medium underline cursor-pointer"
          >
            Acknowledge
          </button>
        </div>
      )}

      {/* 2. THE MAIN SPLIT GRID INTERACTION DESK */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-6 py-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: ACTIVE CONTROL & CUSTOMIZATIONS MODULES */}
        <section className="lg:col-span-7 space-y-6">
          
          {/* A. Typography selection card */}
          <div className="bg-gray-900/40 border border-gray-900 rounded-2xl p-5">
            <h3 className="text-sm font-bold text-gray-100 flex items-center gap-2 mb-1.5">
              <Type className="w-4 h-4 text-amber-400" />
              1. Typography & Character Aesthetics
            </h3>
            <p className="text-xs text-gray-400 mb-4">
              Select standard or stylized font configurations for time display.
            </p>

            <div className="space-y-3">
              {FONT_STYLES.map((f) => (
                <button
                  id={`font-option-${f.id}`}
                  key={f.id}
                  onClick={() => updateSetting('fontStyle', f.id)}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-center justify-between gap-4 cursor-pointer relative overflow-hidden ${
                    settings.fontStyle === f.id
                      ? 'bg-amber-500/5 col-span-2 border-amber-500/40 text-amber-200'
                      : 'bg-gray-950/40 border-gray-800/60 text-gray-400 hover:border-gray-800'
                  }`}
                >
                  <div className="flex-1 overflow-hidden">
                    <span className="text-xs font-bold block">{f.name}</span>
                    <span className="text-[10px] text-gray-500 block truncate mt-0.5">{f.description}</span>
                  </div>

                  {/* Visual typography preview of selected font */}
                  <span className={`${f.cssClass} text-2xl font-bold font-mono tracking-tight shrink-0 select-none ${
                    settings.fontStyle === f.id ? 'text-amber-400' : 'text-gray-500'
                  }`}>
                    02:45 PM
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* B. Weather controller card (Mounted widget handles geo state and fetch inputs) */}
          <WeatherWidget
            settings={settings}
            data={weatherData}
            loading={weatherLoading}
            errorMsg={weatherError}
            onRefresh={refreshWeather}
            onUpdateSetting={updateSetting}
          />

          {/* C. Camera Motion Sensing controller */}
          <MotionSensingPanel
            enabled={settings.motionSensingEnabled}
            onToggle={(val) => updateSetting('motionSensingEnabled', val)}
            sensitivity={settings.motionSensitivity}
            onSensitivityChange={(val) => updateSetting('motionSensitivity', val)}
            onMotionDetected={handleMotionDetectedEvent}
          />

          {/* D. Home Assistant & FoxESS integration configuration */}
          <HomeAssistantPanel
            settings={settings}
            haData={haData}
            onUpdateSetting={updateSetting}
            onTestConnection={testHaConnection}
          />
        </section>

        {/* RIGHT COLUMN: SMART HUD & PHYSICAL MOCKUP SIMULATOR */}
        <section className="lg:col-span-5 space-y-6">

          {/* A. Live Inactivity sleep countdown gauge */}
          <div className="bg-gray-900/40 border border-gray-950 rounded-2xl p-5">
            <h3 className="text-sm font-bold text-gray-100 flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-sky-400" />
              Automated Sleep Counter
            </h3>
            <p className="text-xs text-gray-400 mb-4">
              Enter screensaver state after inactive countdown.
            </p>

            <div className="bg-gray-950/80 p-4 rounded-xl border border-gray-800 flex items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-1 text-xs text-gray-300 font-semibold uppercase mb-1">
                  <span>Current Idle state</span>
                </div>
                
                {/* Visual state representation */}
                <div className="flex items-baseline gap-1.5">
                  <span className={`text-4xl font-extrabold font-mono tracking-tight ${
                    (settings.inactivityTimeout - secondsOfInactivity) <= 5
                      ? 'text-rose-500 animate-pulse'
                      : 'text-sky-400'
                  }`}>
                    {Math.max(0, settings.inactivityTimeout - secondsOfInactivity)}s
                  </span>
                  <span className="text-xs text-gray-500">remaining to sleep</span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-gray-900 h-1.5 rounded-full mt-3 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-1000 ${
                      (settings.inactivityTimeout - secondsOfInactivity) <= 5
                        ? 'bg-rose-500'
                        : 'bg-gradient-to-r from-sky-500 to-indigo-500'
                    }`}
                    style={{ width: `${((settings.inactivityTimeout - secondsOfInactivity) / settings.inactivityTimeout) * 100}%` }}
                  ></div>
                </div>
              </div>

              {/* Selector for Inactivity Limit duration */}
              <div className="border-l border-gray-800/80 pl-4 shrink-0 text-right">
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5">
                  Inactivity Limit
                </label>
                <select
                  id="inactivity-timeout-select"
                  value={settings.inactivityTimeout}
                  onChange={(e) => updateSetting('inactivityTimeout', Number(e.target.value))}
                  className="bg-gray-900 text-xs text-gray-300 font-semibold border border-gray-800 rounded-lg p-1.5 focus:outline-none"
                >
                  <option value={10}>10 Seconds (Fast Demo)</option>
                  <option value={30}>30 Seconds (Standard)</option>
                  <option value={60}>1 Minute</option>
                  <option value={120}>2 Minutes</option>
                  <option value={300}>5 Minutes</option>
                </select>
              </div>
            </div>
          </div>

          {/* B. Dark mode configuration panel */}
          <div className="bg-gray-900/40 border border-gray-900 rounded-2xl p-5">
            <h3 className="text-sm font-bold text-gray-100 flex items-center gap-2 mb-1.5">
              <SunMoon className="w-4 h-4 text-emerald-400" />
              2. Dark/Night Mode Scheduling
            </h3>
            <p className="text-xs text-gray-400 mb-4.5">
              Dim brightness and apply severe-contrast tints to protect sleep cycles at night.
            </p>

            <div className="space-y-4">
              {/* Dark mode state selectors */}
              <div className="grid grid-cols-3 gap-2 bg-gray-950 p-1.5 rounded-xl border border-gray-800/80">
                {(['off', 'on', 'auto'] as const).map((mode) => (
                  <button
                    id={`night-mode-btn-${mode}`}
                    key={mode}
                    onClick={() => updateSetting('nightMode', mode)}
                    className={`py-1.5 rounded-lg text-xs font-semibold capitalize cursor-pointer transition-all ${
                      settings.nightMode === mode
                        ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                        : 'text-gray-500 hover:text-gray-300 border border-transparent'
                    }`}
                  >
                    {mode === 'auto' ? 'Auto (Sunset)' : mode}
                  </button>
                ))}
              </div>

              {/* Slider for Dim Level */}
              {settings.nightMode !== 'off' && (
                <div className="bg-gray-950/60 p-3 rounded-xl border border-gray-900">
                  <div className="flex justify-between items-center text-xs font-semibold text-gray-300 mb-2">
                    <span className="flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-gray-400" />
                      Night Mode Dim Level
                    </span>
                    <span className="text-emerald-400 font-mono">{settings.nightModeDimLevel}% Brightness</span>
                  </div>
                  <input
                    id="night-dim-range"
                    type="range"
                    min="5"
                    max="60"
                    value={settings.nightModeDimLevel}
                    onChange={(e) => updateSetting('nightModeDimLevel', Number(e.target.value))}
                    className="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                  <div className="flex justify-between text-[10px] text-gray-500 font-mono mt-1">
                    <span>Melatonin friendly (5%)</span>
                    <span>Standard low light (60%)</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* D. Color Palettes and Seconds Toggles */}
          <div className="bg-gray-900/40 border border-gray-900 rounded-2xl p-5">
            <h3 className="text-sm font-bold text-gray-100 flex items-center gap-2 mb-1.5">
              <Layers className="w-4 h-4 text-indigo-400" />
              3. Transitions & Extras
            </h3>
            <p className="text-xs text-gray-400 mb-4 hover:text-gray-300">
              Shift time transitions and pixel offset behaviors.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                  Active Palette Selection
                </label>
                <select
                  id="palette-select"
                  value={settings.paletteOverride}
                  onChange={(e) => updateSetting('paletteOverride', e.target.value as PaletteId | 'auto')}
                  className="w-full bg-gray-950 text-xs text-gray-300 border border-gray-800 rounded-xl p-2.5 focus:outline-none"
                >
                  <option value="auto">Auto Transition (Based on active hour)</option>
                  <option value="morning">Morning Palette (Warm Amber)</option>
                  <option value="afternoon">Afternoon Palette (Cyan Breeze)</option>
                  <option value="evening">Evening Palette (Sunset Coral)</option>
                  <option value="night">Night Palette (Emerald Aurora)</option>
                </select>
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer p-2 rounded border border-transparent hover:bg-gray-950/50 transition-colors">
                  <input
                    type="checkbox"
                    id="show-bg-waves-checkbox"
                    checked={settings.showBackgroundWaves}
                    onChange={(e) => updateSetting('showBackgroundWaves', e.target.checked)}
                    className="rounded border-gray-700 bg-gray-900 accent-indigo-500 w-4 h-4"
                  />
                  <div>
                    <div className="text-xs font-semibold text-gray-200">Animated Background Waves</div>
                    <div className="text-[10px] text-gray-500">Enable faint background animations during active mode</div>
                  </div>
                </label>
              </div>

              {/* Burn-in protection timing chooser and Scale */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5">
                    Burn-In Drift Interval
                  </label>
                  <select
                    id="burn-in-interval-select"
                    value={settings.burnInInterval}
                    onChange={(e) => updateSetting('burnInInterval', Number(e.target.value))}
                    className="w-full bg-gray-950 text-xs text-gray-300 border border-gray-800 rounded-lg p-2 focus:outline-none"
                  >
                    <option value={10}>15 Seconds (Demo Drift)</option>
                    <option value={60}>1 Minute (Standard)</option>
                    <option value={180}>3 Minutes</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5">
                    Display Scale
                  </label>
                  <select
                    id="screensaver-scale-select"
                    value={settings.screensaverContentScale}
                    onChange={(e) => updateSetting('screensaverContentScale', Number(e.target.value))}
                    className="w-full bg-gray-950 text-xs text-gray-300 border border-gray-800 rounded-lg p-2 focus:outline-none"
                  >
                    <option value={0.5}>50% (Small)</option>
                    <option value={0.75}>75% (Medium)</option>
                    <option value={1.0}>100% (Original)</option>
                    <option value={1.25}>125% (Large)</option>
                  </select>
                </div>
              </div>
              
              <div>
                <div className="flex flex-col justify-start">
                  <label className="relative inline-flex items-center cursor-pointer mb-2">
                    <input
                      id="show-seconds-toggle"
                      type="checkbox"
                      checked={settings.showSeconds}
                      onChange={(e) => updateSetting('showSeconds', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-gray-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-gray-400 after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-500 peer-checked:after:bg-whiteScale hover:after:bg-white"></div>
                    <span className="ml-2 text-xs text-gray-400 font-medium">Show Seconds</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* C. System Activity Logs Terminal */}
          <div className="bg-gray-900/40 border border-gray-900 rounded-2xl p-5">
            <h3 className="text-sm font-bold text-gray-100 flex items-center gap-2 mb-2">
              <Keyboard className="w-4 h-4 text-teal-400" />
              Tablet Sensor Activity Logs
            </h3>
            
            <div className="bg-gray-950 rounded-xl p-3 h-32 overflow-y-auto font-mono text-[10px] text-gray-400 space-y-1.5 border border-gray-800 border-dashed">
              {activityLogs.map((log) => (
                <div key={log.id} className="flex gap-2">
                  <span className="text-sky-500 shrink-0">[{log.time}]</span>
                  <span className="text-gray-300">{log.msg}</span>
                </div>
              ))}
              {activityLogs.length === 0 && (
                <p className="text-gray-600 italic">No sensors initialized yet.</p>
              )}
            </div>
          </div>

        </section>
      </main>

      {/* 3. CORE FLOATING SCREENSAVER INSTANCE OVERLAY */}
      {isScreensaverActive && (
        <ActiveScreensaverStage
          settings={settings}
          weatherData={weatherData}
          onWakeUp={handleManualWake}
          lastMotionTime={lastMotionTime}
          haData={haData}
        />
      )}

      {/* FOOTER */}
      <footer className="border-t border-gray-900 bg-gray-950/40 py-6 text-center text-xs text-gray-500">
        <p>HAura • Elegant Smart Home Screensaver</p>
      </footer>

      {/* Export .env Modal */}
      {showEnvModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col">
            <div className="p-4 border-b border-gray-800 flex items-center justify-between bg-gray-950">
              <h2 className="text-sm font-bold text-gray-100 flex items-center gap-2">
                <Settings className="w-5 h-5 text-indigo-400" />
                Generated .env Configuration
              </h2>
              <button 
                onClick={() => setShowEnvModal(false)}
                className="p-1 px-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded"
              >
                Close
              </button>
            </div>
            
            <div className="p-4 flex-1 overflow-y-auto">
              <p className="text-xs text-gray-400 mb-4">
                Copy these parameters into your <code className="bg-gray-800 px-1 py-0.5 rounded text-gray-300">.env</code> 
                file to permanently deploy the application with these exact settings without modifying code. 
                Values are read on mount.
              </p>
              
              <div className="relative group">
                <pre className="text-[11px] font-mono leading-relaxed bg-black/50 p-4 border border-gray-800 rounded-xl text-emerald-400 overflow-x-auto whitespace-pre-wrap">
                  {generateEnvString()}
                </pre>
                <button 
                  onClick={copyEnvToClipboard}
                  className="absolute top-2 right-2 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-white text-[10px] font-bold uppercase rounded opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 shadow"
                >
                  <Keyboard className="w-3 h-3" />
                  Copy Text
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
