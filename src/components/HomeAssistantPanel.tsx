import React, { useState } from 'react';
import { ScreensaverSettings } from '../types';
import { HomeAssistantData } from '../hooks/useHomeAssistant';
import {
  Database,
  Unplug,
  Wifi,
  WifiOff,
  Battery,
  Sun,
  Activity,
  Eye,
  EyeOff,
  RefreshCw,
  Info,
  Sliders,
  CheckCircle2,
  AlertCircle,
  ArrowRightLeft
} from 'lucide-react';

interface HomeAssistantPanelProps {
  settings: ScreensaverSettings;
  haData: HomeAssistantData;
  onUpdateSetting: <K extends keyof ScreensaverSettings>(key: K, value: ScreensaverSettings[K]) => void;
  onTestConnection: () => Promise<void>;
}

export default function HomeAssistantPanel({
  settings,
  haData,
  onUpdateSetting,
  onTestConnection
}: HomeAssistantPanelProps) {
  const [showToken, setShowToken] = useState(false);
  const [testing, setTesting] = useState(false);

  const handleTest = async () => {
    setTesting(true);
    await onTestConnection();
    setTesting(false);
  };

  return (
    <div className="bg-gray-900/40 border border-gray-900 rounded-2xl p-5 space-y-5">
      {/* Header */}
      <div>
        <h3 className="text-sm font-bold text-gray-100 flex items-center gap-2 mb-1">
          <Database className="w-4 h-4 text-indigo-400" />
          4. Home Assistant & FoxESS Modbus
        </h3>
        <p className="text-xs text-gray-400">
          Sync real-time house battery SoC, daily solar harvest, and power load directly onto your screensaver.
        </p>
      </div>

      {/* Main Enable Toggle Button */}
      <div className="flex items-center justify-between bg-gray-950 p-4 rounded-xl border border-gray-800">
        <div className="flex-1">
          <span className="text-xs font-semibold block text-gray-200">Enable Live Integration</span>
          <span className="text-[10px] text-gray-500 block mt-0.5">
            Retrieve real-time telemetry from your local Home Assistant entities.
          </span>
        </div>

        <label className="relative inline-flex items-center cursor-pointer">
          <input
            id="enable-ha-toggle"
            type="checkbox"
            checked={settings.enableHomeAssistant}
            onChange={(e) => onUpdateSetting('enableHomeAssistant', e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-gray-400 after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600 peer-checked:after:bg-white hover:after:bg-white"></div>
        </label>
      </div>

      {/* Condition A: Integration is enabled - Show HA Config fields */}
      {settings.enableHomeAssistant ? (
        <div className="space-y-4 bg-gray-950/60 p-4 rounded-xl border border-gray-900">
          {/* Connection URL and Token */}
          <div className="space-y-3">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                Home Assistant API URL
              </label>
              <input
                id="ha-url-input"
                type="text"
                placeholder="http://192.168.1.100:8123"
                value={settings.haUrl}
                onChange={(e) => onUpdateSetting('haUrl', e.target.value)}
                className="w-full bg-gray-950 text-xs text-gray-300 border border-gray-800 rounded-lg p-2.5 outline-none focus:border-indigo-500/60 font-mono transition-all"
              />
              <p className="text-[10px] text-gray-500 mt-1">
                Enter your local IP (e.g. <code>http://192.168.1.150:8123</code>) or external domain.
              </p>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                Long-Lived Access Token
              </label>
              <div className="relative">
                <input
                  id="ha-token-input"
                  type={showToken ? "text" : "password"}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  value={settings.haToken}
                  onChange={(e) => onUpdateSetting('haToken', e.target.value)}
                  className="w-full bg-gray-950 text-xs text-gray-300 border border-gray-800 rounded-lg p-2.5 pr-10 outline-none focus:border-indigo-500/60 font-mono transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowToken(!showToken)}
                  className="absolute right-3 top-3 text-gray-500 hover:text-gray-300"
                >
                  {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[10px] text-gray-500 mt-1">
                Generated under your Home Assistant user profile settings at the bottom.
              </p>
            </div>
          </div>

          <div className="w-full h-px bg-gray-900 my-4"></div>

          {/* FoxESS Modbus Sensor Entities */}
          <div className="space-y-3">
            <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              Sensor Entities Mapping
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] sm:text-[11px] text-gray-400 mb-1">
                  Battery State of Charge (%)
                </label>
                <input
                  id="entity-soc-input"
                  type="text"
                  placeholder="sensor.foxess_bat_soc"
                  value={settings.entityBatterySoc}
                  onChange={(e) => onUpdateSetting('entityBatterySoc', e.target.value)}
                  className="w-full bg-gray-900 text-xs text-gray-300 border border-gray-800 rounded-lg p-2.5 font-mono outline-none focus:border-indigo-500/60"
                />
              </div>

              <div>
                <label className="block text-[10px] sm:text-[11px] text-gray-400 mb-1">
                  Battery Power (kW)
                </label>
                <input
                  id="entity-bat-power-input"
                  type="text"
                  placeholder="sensor.fox_ess...invbatpower_1"
                  value={settings.entityInvBatPower}
                  onChange={(e) => onUpdateSetting('entityInvBatPower', e.target.value)}
                  className="w-full bg-gray-900 text-xs text-gray-300 border border-gray-800 rounded-lg p-2.5 font-mono outline-none focus:border-indigo-500/60"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] sm:text-[11px] text-gray-400 mb-1">
                  Solar Harvest (kWh)
                </label>
                <input
                  id="entity-solar-input"
                  type="text"
                  placeholder="sensor.foxess_solar_today"
                  value={settings.entitySolarToday}
                  onChange={(e) => onUpdateSetting('entitySolarToday', e.target.value)}
                  className="w-full bg-gray-900 text-xs text-gray-300 border border-gray-800 rounded-lg p-2.5 font-mono outline-none focus:border-indigo-500/60"
                />
              </div>

              <div>
                <label className="block text-[10px] sm:text-[11px] text-gray-400 mb-1">
                  Current House Load (kW)
                </label>
                <input
                  id="entity-load-input"
                  type="text"
                  placeholder="sensor.foxess_house_load"
                  value={settings.entityHouseLoad}
                  onChange={(e) => onUpdateSetting('entityHouseLoad', e.target.value)}
                  className="w-full bg-gray-900 text-xs text-gray-300 border border-gray-800 rounded-lg p-2.5 font-mono outline-none focus:border-indigo-500/60"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
              <div>
                <label className="block text-[10px] sm:text-[11px] text-gray-400 mb-1">
                  Grid Power (kW)
                </label>
                <input
                  id="entity-grid-ct-input"
                  type="text"
                  placeholder="sensor.fox_ess...grid_ct"
                  value={settings.entityGridCt}
                  onChange={(e) => onUpdateSetting('entityGridCt', e.target.value)}
                  className="w-full bg-gray-900 text-xs text-gray-300 border border-gray-800 rounded-lg p-2.5 font-mono outline-none focus:border-indigo-500/60"
                />
              </div>
              
              <div className="hidden sm:block"></div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
              <div>
                <label className="block text-[10px] sm:text-[11px] text-gray-400 mb-1">
                  Indoor Temp (°C/°F)
                </label>
                <input
                  id="entity-indoor-input"
                  type="text"
                  placeholder="sensor.indoor_t_h_sensor_temperature"
                  value={settings.entityIndoorTemp}
                  onChange={(e) => onUpdateSetting('entityIndoorTemp', e.target.value)}
                  className="w-full bg-gray-900 text-xs text-gray-300 border border-gray-800 rounded-lg p-2.5 font-mono outline-none focus:border-indigo-500/60"
                />
              </div>

              <div>
                <label className="block text-[10px] sm:text-[11px] text-gray-400 mb-1">
                  Outdoor Temp (°C/°F)
                </label>
                <input
                  id="entity-outdoor-input"
                  type="text"
                  placeholder="sensor.outdoor_t_h_sensor_temperature"
                  value={settings.entityOutdoorTemp}
                  onChange={(e) => onUpdateSetting('entityOutdoorTemp', e.target.value)}
                  className="w-full bg-gray-900 text-xs text-gray-300 border border-gray-800 rounded-lg p-2.5 font-mono outline-none focus:border-indigo-500/60"
                />
              </div>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between gap-3">
            {/* Status / Last Synchronized Output */}
            <div className="flex-1 overflow-hidden">
              {haData.error ? (
                <span className="text-[10px] text-rose-400 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Connection failed!</span>
                </span>
              ) : haData.isLive ? (
                <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Connected • Live update: {haData.lastUpdated}</span>
                </span>
              ) : (
                <span className="text-[10px] text-gray-500">Not verified yet</span>
              )}
            </div>

            <button
              id="test-ha-btn"
              type="button"
              disabled={testing || !settings.haUrl || !settings.haToken}
              onClick={handleTest}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-xs font-semibold text-white rounded-lg flex items-center gap-1.5 cursor-pointer select-none active:scale-95 transition-all"
            >
              <RefreshCw className={`w-3 h-3 ${testing ? 'animate-spin' : ''}`} />
              {testing ? 'Testing...' : 'Test Connection'}
            </button>
          </div>

          {/* Connection Error Diagnostic Block */}
          {haData.error && (
            <div className="bg-rose-950/20 text-xs text-rose-300 rounded-lg border border-rose-800/40 p-3 mt-2 space-y-1">
              <span className="font-semibold block text-xs">Diagnostic error:</span>
              <p className="text-[11px] text-gray-400 leading-snug">
                {haData.error}
              </p>
              <div className="text-[10px] text-gray-500 border-t border-rose-900/40 mt-1.5 pt-1.5 flex flex-col gap-1.5">
                <div className="flex items-start gap-1">
                  <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-gray-400" />
                  <span>
                    Tip: A browser security block (Mixed Content / CORS) can occur if this Web App is loaded over secure <code>https</code> and requests non-secure <code>http</code> local IPs. Try loading this page over http or use a proxy domain with SSL enabled.
                  </span>
                </div>
                <div className="flex items-start gap-1">
                  <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-gray-400" />
                  <span className="leading-relaxed">
                    You must also explicitly allow CORS in your Home Assistant <code>configuration.yaml</code> and restart Home Assistant:
                  </span>
                </div>
                <pre className="bg-rose-950/40 p-2 rounded border border-rose-900/50 text-[#bbb] font-mono text-[9px] mt-0.5 whitespace-pre-wrap">
{`http:\n  cors_allowed_origins:\n    - "${window.location.origin}"`}
                </pre>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Condition B: Integration is offline/disabled - Show full simulation controls and preview */
        <div className="space-y-4 bg-gray-950/60 p-4 rounded-xl border border-gray-900">
          <div className="flex items-center justify-between text-xs font-bold text-gray-400 pb-1 border-b border-gray-900">
            <span className="flex items-center gap-1">
              <Sliders className="w-3.5 h-3.5 text-indigo-400" />
              FoxESS Inverter Simulator
            </span>
            <span className="text-[10px] text-amber-500 font-semibold bg-amber-505/10 py-0.5 px-1.5 rounded uppercase font-mono">
              Simulation Mode
            </span>
          </div>

          {/* Sliders for battery, solar, and load */}
          <div className="space-y-3.5">
            {/* Battery SoC Slider */}
            <div>
              <div className="flex justify-between items-center text-xs font-medium text-gray-300 mb-1.5">
                <span className="flex items-center gap-1">
                  <Battery className="w-3.5 h-3.5 text-teal-400" />
                  Battery Level (SoC)
                </span>
                <span className="font-mono text-teal-400 font-semibold">{settings.simBatterySoc}%</span>
              </div>
              <input
                id="sim-soc-range"
                type="range"
                min="0"
                max="100"
                value={settings.simBatterySoc}
                onChange={(e) => onUpdateSetting('simBatterySoc', Number(e.target.value))}
                className="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-teal-400"
              />
            </div>

            {/* Battery Power Flow (Charge/Discharge) Slider */}
            <div>
              <div className="flex justify-between items-center text-xs font-medium text-gray-300 mb-1.5">
                <span className="flex items-center gap-1">
                  <Battery className="w-3.5 h-3.5 text-teal-400" />
                  Battery Power (Discharge + / Charge -)
                </span>
                <span className="font-mono text-teal-400 font-semibold">
                  {settings.simInvBatPower > 0.05 ? `Discharging +${settings.simInvBatPower.toFixed(1)} kW` : settings.simInvBatPower < -0.05 ? `Charging ${settings.simInvBatPower.toFixed(1)} kW` : 'Idle 0.0 kW'}
                </span>
              </div>
              <input
                id="sim-batpower-range"
                type="range"
                min="-6.0"
                max="6.0"
                step="0.1"
                value={settings.simInvBatPower}
                onChange={(e) => onUpdateSetting('simInvBatPower', Number(e.target.value))}
                className="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-teal-400"
              />
            </div>

            {/* Grid Power CT (Export/Import) Slider */}
            <div>
              <div className="flex justify-between items-center text-xs font-medium text-gray-300 mb-1.5">
                <span className="flex items-center gap-1">
                  <ArrowRightLeft className="w-3.5 h-3.5 text-emerald-400" />
                  Grid Exchange (Export + / Import -)
                </span>
                <span className="font-mono font-semibold text-emerald-400">
                  {Math.abs(settings.simGridCt) < 0.15 ? 'Idle 0.0 kW' : settings.simGridCt > 0 ? `Export +${settings.simGridCt.toFixed(1)} kW` : `Import ${settings.simGridCt.toFixed(1)} kW`}
                </span>
              </div>
              <input
                id="sim-gridct-range"
                type="range"
                min="-8.0"
                max="8.0"
                step="0.1"
                value={settings.simGridCt}
                onChange={(e) => onUpdateSetting('simGridCt', Number(e.target.value))}
                className="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
              />
            </div>

            {/* Daily Solar Harvest Slider */}
            <div>
              <div className="flex justify-between items-center text-xs font-medium text-gray-300 mb-1.5">
                <span className="flex items-center gap-1">
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  Solar Harvest today
                </span>
                <span className="font-mono text-amber-400 font-semibold">{settings.simSolarToday.toFixed(1)} kWh</span>
              </div>
              <input
                id="sim-solar-range"
                type="range"
                min="0"
                max="45"
                step="0.1"
                value={settings.simSolarToday}
                onChange={(e) => onUpdateSetting('simSolarToday', Number(e.target.value))}
                className="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
              />
            </div>

            {/* House Power load Slider */}
            <div>
              <div className="flex justify-between items-center text-xs font-medium text-gray-300 mb-1.5">
                <span className="flex items-center gap-1">
                  <Activity className="w-3.5 h-3.5 text-rose-400" />
                  House Load Usage
                </span>
                <span className="font-mono text-rose-400 font-semibold">{settings.simHouseLoad.toFixed(2)} kW</span>
              </div>
              <input
                id="sim-load-range"
                type="range"
                min="0.1"
                max="8.5"
                step="0.05"
                value={settings.simHouseLoad}
                onChange={(e) => onUpdateSetting('simHouseLoad', Number(e.target.value))}
                className="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-rose-400"
              />
            </div>

            {/* Indoor Temperature Slider */}
            <div>
              <div className="flex justify-between items-center text-xs font-medium text-gray-300 mb-1.5">
                <span className="flex items-center gap-1">
                  <Activity className="w-3.5 h-3.5 text-blue-400" />
                  Indoor Temp
                </span>
                <span className="font-mono text-blue-400 font-semibold">
                  {settings.simIndoorTempOffline ? 'Offline' : `${settings.simIndoorTemp.toFixed(1)}°`}
                </span>
              </div>
              <input
                id="sim-indoor-range"
                type="range"
                min="-10"
                max="50"
                step="0.5"
                value={settings.simIndoorTemp}
                disabled={settings.simIndoorTempOffline}
                onChange={(e) => onUpdateSetting('simIndoorTemp', Number(e.target.value))}
                className="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-blue-400 disabled:opacity-50"
              />
              <div className="mt-2 flex items-center justify-end gap-2">
                <input
                  type="checkbox"
                  id="sim-indoor-offline"
                  checked={settings.simIndoorTempOffline}
                  onChange={(e) => onUpdateSetting('simIndoorTempOffline', e.target.checked)}
                  className="rounded border-gray-700 bg-gray-800 accent-blue-500 w-3 h-3 cursor-pointer"
                />
                <label htmlFor="sim-indoor-offline" className="text-[10px] text-gray-400 cursor-pointer">Simulate Offline</label>
              </div>
            </div>

            {/* Outdoor Temperature Slider */}
            <div>
              <div className="flex justify-between items-center text-xs font-medium text-gray-300 mb-1.5">
                <span className="flex items-center gap-1">
                  <Activity className="w-3.5 h-3.5 text-green-400" />
                  Outdoor Temp
                </span>
                <span className="font-mono text-green-400 font-semibold">
                  {settings.simOutdoorTempOffline ? 'Offline' : `${settings.simOutdoorTemp.toFixed(1)}°`}
                </span>
              </div>
              <input
                id="sim-outdoor-range"
                type="range"
                min="-20"
                max="60"
                step="0.5"
                value={settings.simOutdoorTemp}
                disabled={settings.simOutdoorTempOffline}
                onChange={(e) => onUpdateSetting('simOutdoorTemp', Number(e.target.value))}
                className="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-green-400 disabled:opacity-50"
              />
              <div className="mt-2 flex items-center justify-end gap-2">
                <input
                  type="checkbox"
                  id="sim-outdoor-offline"
                  checked={settings.simOutdoorTempOffline}
                  onChange={(e) => onUpdateSetting('simOutdoorTempOffline', e.target.checked)}
                  className="rounded border-gray-700 bg-gray-800 accent-green-500 w-3 h-3 cursor-pointer"
                />
                <label htmlFor="sim-outdoor-offline" className="text-[10px] text-gray-400 cursor-pointer">Simulate Offline</label>
              </div>
            </div>
          </div>

          <div className="text-[10px] text-gray-500 flex items-start gap-1 pb-1">
            <Info className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
            <span>
              Adjust these sliders to immediately simulate how the battery level, daily generation, and power usage icons appear on your screensaver page!
            </span>
          </div>
        </div>
      )}

      {/* Telemetry Scale & Limit Calibration */}
      <div className="space-y-4 bg-gray-950/60 p-4 rounded-xl border border-gray-900">
        <div className="flex items-center justify-between text-xs font-bold text-gray-400 pb-1 border-b border-gray-900">
          <span className="flex items-center gap-1">
            <Sliders className="w-3.5 h-3.5 text-indigo-400" />
            Animation & Scale Calibration
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
              Telemetry Visualizer Mode
            </label>
            <select
              value={settings.telemetryDisplayMode || 'flow'}
              onChange={(e) => onUpdateSetting('telemetryDisplayMode', e.target.value as 'flow' | 'stats')}
              className="w-full bg-gray-950 text-xs text-gray-300 border border-gray-800 rounded-lg p-2 outline-none focus:border-indigo-500/60 font-mono transition-all"
            >
              <option value="flow">Animated Power Flow Diagram</option>
              <option value="stats">Compact Telemetry Stat Cards</option>
            </select>
            <p className="text-[9px] text-gray-500 mt-1">
              Select between multi-directional animated power flow curves or compact stat pills on your screensaver.
            </p>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
              Inverter Size (kW)
            </label>
            <input
              type="number"
              min="1"
              max="100"
              step="0.5"
              value={settings.inverterSize}
              onChange={(e) => onUpdateSetting('inverterSize', Math.max(1, Number(e.target.value)))}
              className="w-full bg-gray-950 text-xs text-gray-300 border border-gray-800 rounded-lg p-2 outline-none focus:border-indigo-500/60 font-mono transition-all"
            />
            <p className="text-[9px] text-gray-500 mt-1">
              Used to scale the animation speed for solar, house load, and grid exchange (default: 10).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
