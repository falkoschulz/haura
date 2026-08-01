/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sun,
  Cloud,
  CloudSun,
  CloudRain,
  CloudDrizzle,
  CloudSnow,
  CloudLightning,
  CloudFog,
  Sparkles,
  AlertTriangle,
  Moon,
  Activity,
  Maximize2,
  Unlock,
  ShieldCheck,
  EyeOff,
  SunMoon,
  Battery,
  BatteryWarning,
  Zap,
  ZapOff,
  Home,
  ArrowRightLeft
} from 'lucide-react';
import { ScreensaverSettings, WeatherData, PaletteId } from '../types';
import { FONT_STYLES, COLOR_PALETTES } from '../constants';
import { HomeAssistantData } from '../hooks/useHomeAssistant';
import PowerFlowDiagram from './PowerFlowDiagram.tsx';

interface ActiveScreensaverStageProps {
  settings: ScreensaverSettings;
  weatherData: WeatherData | null;
  onWakeUp: () => void;
  lastMotionTime: number;
  haData?: HomeAssistantData;
}

const renderBatteryIcon = (soc: number, invBatPower: number, dimmed: boolean) => {
  let socColorClass = 'fill-teal-400';
  if (soc < 20) socColorClass = 'fill-rose-500';
  else if (soc < 50) socColorClass = 'fill-amber-400';
  
  if (dimmed) {
    socColorClass = 'fill-red-800/80';
  }

  const isLow = soc < 10;
  const numBars = soc >= 80 ? 4 : soc >= 55 ? 3 : soc >= 30 ? 2 : soc >= 10 ? 1 : 0;

  const isCharging = invBatPower < -0.05;
  const isDischarging = invBatPower > 0.05;

  return (
    <motion.div 
      className="relative flex items-center justify-center mb-1.5"
      animate={isLow && !isCharging ? { scale: [1, 1.15, 1], opacity: [0.6, 1, 0.6] } : {}}
      transition={isLow && !isCharging ? { duration: 1, repeat: Infinity, ease: "easeInOut" } : {}}
    >
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-7 h-7">
        <rect x="2" y="6" width="17" height="12" rx="2.5" stroke={dimmed ? "#b91c1c" : "#2dd4bf"} strokeWidth="2" className={dimmed ? 'stroke-red-800' : 'stroke-teal-400'} />
        <path d="M21 10C21.5523 10 22 10.4477 22 11V13C22 13.5523 21.5523 14 21 14H20V10H21Z" fill={dimmed ? "#b91c1c" : "#2dd4bf"} className={dimmed ? 'fill-red-800' : 'fill-teal-400'} />
        {Array.from({ length: 4 }).map((_, idx) => {
          const isActive = idx < numBars;
          if (!isActive) return null;

          let animationProps = {};
          let transitionProps = {};

          if (!dimmed) {
             if (isCharging) {
               animationProps = { opacity: [0.3, 1, 0.3] };
               transitionProps = { duration: 1.5, repeat: Infinity, delay: idx * 0.3, ease: "easeInOut" };
             } else if (isDischarging) {
               animationProps = { opacity: [1, 0.3, 1] };
               transitionProps = { duration: 1.5, repeat: Infinity, delay: (3 - idx) * 0.3, ease: "easeInOut" };
             }
          }

          return (
            <motion.rect
              key={idx}
              x={4.5 + idx * 3.2}
              y="8.5"
              width="2.2"
              height="7"
              rx="0.5"
              className={socColorClass}
              initial={{ opacity: 1 }}
              animate={animationProps}
              transition={transitionProps}
            />
          );
        })}
        {isLow && !isCharging && (
          <motion.rect
            x="4.5"
            y="8.5"
            width="2.2"
            height="7"
            rx="0.5"
            className="fill-rose-500"
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 1, repeat: Infinity }}
          />
        )}
      </svg>
    </motion.div>
  );
};

const renderSolarIcon = (solarToday: number, maxSolar: number, dimmed: boolean) => {
  const solarRatio = Math.min(1.0, solarToday / maxSolar);
  let sunColorClass = 'text-amber-400';
  if (dimmed) {
    sunColorClass = 'text-red-700/80';
  }

  const hasSolar = solarRatio > 0.01;
  const spinDuration = hasSolar 
    ? Math.max(3, 20 * (1 - solarRatio)) 
    : 0;

  return (
    <motion.div
      className="relative flex items-center justify-center w-7 h-7 mb-1.5"
      animate={{ 
        rotate: hasSolar ? 360 : 0,
        scale: hasSolar ? [1, 1 + (solarRatio * 0.08), 1] : 1
      }}
      transition={{
        rotate: hasSolar ? {
          repeat: Infinity,
          duration: spinDuration,
          ease: "linear"
        } : {},
        scale: hasSolar ? {
          repeat: Infinity,
          duration: Math.max(2, 6 * (1 - solarRatio)),
          ease: "easeInOut"
        } : {}
      }}
    >
      {hasSolar ? (
        <Sun className={`w-7 h-7 ${sunColorClass}`} />
      ) : (
        <Moon className={`w-7 h-7 ${dimmed ? 'text-indigo-900/80' : 'text-indigo-400/70'}`} />
      )}
    </motion.div>
  );
};

const renderGridIcon = (gridCt: number, inverterSize: number, dimmed: boolean) => {
  const absGrid = Math.abs(gridCt);
  const isIdle = absGrid < 0.15;
  const isExport = gridCt >= 0.15;
  const ratio = Math.min(1.0, absGrid / (inverterSize || 10.0));
  
  let colorClass = isIdle
    ? 'text-zinc-500'
    : isExport
      ? 'text-emerald-400'
      : 'text-purple-400';
  if (dimmed) {
    colorClass = 'text-red-700/80';
  }

  const animDuration = Math.max(0.3, 2.5 * (1 - ratio));
  const hasFlow = !isIdle && absGrid > 0.05;

  return (
    <motion.div
      className="relative flex items-center justify-center w-7 h-7 mb-1.5"
      animate={hasFlow ? {
        x: isExport ? [0, 2, 0] : [0, -2, 0],
        opacity: [0.7, 1, 0.7]
      } : {}}
      transition={hasFlow ? {
        repeat: Infinity,
        duration: animDuration,
        ease: "easeInOut"
      } : {}}
    >
      {isIdle ? (
        <ZapOff className={`w-7 h-7 ${colorClass}`} />
      ) : (
        <ArrowRightLeft className={`w-7 h-7 ${colorClass}`} />
      )}
    </motion.div>
  );
};

const renderHouseLoadIcon = (houseLoad: number, inverterSize: number, dimmed: boolean) => {
  const loadRatio = Math.min(1.0, houseLoad / (inverterSize || 10.0));
  let loadColorClass = 'text-rose-400';
  if (dimmed) {
    loadColorClass = 'text-red-700/80';
  }

  const pulseDuration = Math.max(0.4, 2.5 * (1 - loadRatio));
  const isHighLoad = loadRatio > 0.7;

  return (
    <motion.div
      className="relative flex items-center justify-center w-7 h-7 mb-1.5"
      animate={{
        scale: [1, 1.15, 1],
        x: isHighLoad ? [-1, 1, -1, 1, 0] : 0,
        y: isHighLoad ? [1, -1, 1, -1, 0] : 0,
      }}
      transition={{
        scale: {
          repeat: Infinity,
          duration: pulseDuration,
          ease: "easeInOut"
        },
        x: isHighLoad ? {
          repeat: Infinity,
          duration: 0.15,
          ease: "linear"
        } : {},
        y: isHighLoad ? {
          repeat: Infinity,
          duration: 0.15,
          ease: "linear"
        } : {}
      }}
    >
      <Zap className={`w-7 h-7 ${loadColorClass}`} />
    </motion.div>
  );
};

export default function ActiveScreensaverStage({
  settings,
  weatherData,
  onWakeUp,
  lastMotionTime,
  haData
}: ActiveScreensaverStageProps) {
  const [time, setTime] = useState<Date>(new Date());
  
  // Positional offset to prevent OLED burn-in
  const [burnInOffset, setBurnInOffset] = useState({ x: 0, y: 0 });
  const [lastShiftTime, setLastShiftTime] = useState<string>('');

  // Clock ticks
  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Hide scrollbar on body during active screensaver overlay
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;
    
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    
    return () => {
      document.body.style.overflow = originalOverflow;
      document.documentElement.style.overflow = originalHtmlOverflow;
    };
  }, []);

  // Determine current active palette ID
  const getActivePaletteId = (): PaletteId => {
    if (settings.paletteOverride !== 'auto') {
      return settings.paletteOverride;
    }
    // Auto palette based on local hour
    const hour = time.getHours();
    if (hour >= 6 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 21) return 'evening';
    return 'night';
  };

  const activePaletteId = getActivePaletteId();
  const currentPalette = COLOR_PALETTES.find(p => p.id === activePaletteId) || COLOR_PALETTES[3];

  // Detect Night Mode Dim status
  const isNightModeDimmed = (): boolean => {
    if (settings.nightMode === 'on') return true;
    if (settings.nightMode === 'off') return false;
    
    // Auto dimming between 21:00 (9 PM) and 06:00 (6 AM)
    const hour = time.getHours();
    return hour >= 21 || hour < 6;
  };

  const dimmed = isNightModeDimmed();

  // Burn-In Shifter Loop
  useEffect(() => {
    // Shifts elements slightly in a safe grid to protect pixels
    const shiftPosition = () => {
      // Pick random translates between -8% and 8%
      const randX = Math.round((Math.random() * 16) - 8);
      const randY = Math.round((Math.random() * 16) - 8);
      setBurnInOffset({ x: randX, y: randY });
      setLastShiftTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };

    // Trigger shift immediately and set interval
    shiftPosition();
    const intervalTime = settings.burnInInterval * 1000;
    const interval = setInterval(shiftPosition, intervalTime);

    return () => clearInterval(interval);
  }, [settings.burnInInterval]);

  // Convert time to formatted strings
  const formatTime = () => {
    let hoursStr = String(time.getHours());
    const minsStr = String(time.getMinutes()).padStart(2, '0');
    const secsStr = String(time.getSeconds()).padStart(2, '0');

    // Return individual numbers for beautiful typography blocks
    return {
      hours: hoursStr.padStart(2, '0'),
      minutes: minsStr,
      seconds: secsStr
    };
  };

  const formatted = formatTime();

  // Pick Font style mapping
  const activeFont = FONT_STYLES.find(f => f.id === settings.fontStyle) || FONT_STYLES[0];

  const renderWeatherIcon = (iconName: string, sizeClass = "w-8 h-8") => {
    switch (iconName) {
      case 'Sun': return <Sun className={`${sizeClass} text-amber-400`} />;
      case 'CloudSun': return <CloudSun className={`${sizeClass} text-yellow-300`} />;
      case 'Cloud': return <Cloud className={`${sizeClass} text-gray-300`} />;
      case 'CloudRain': return <CloudRain className={`${sizeClass} text-sky-400`} />;
      case 'CloudDrizzle': return <CloudDrizzle className={`${sizeClass} text-cyan-300`} />;
      case 'CloudSnow': return <CloudSnow className={`${sizeClass} text-indigo-100`} />;
      case 'CloudLightning': return <CloudLightning className={`${sizeClass} text-amber-300`} />;
      case 'CloudFog': return <CloudFog className={`${sizeClass} text-slate-400`} />;
      case 'Sparkles': return <Sparkles className={`${sizeClass} text-violet-400 animate-pulse`} />;
      case 'CloudAlert': return <AlertTriangle className={`${sizeClass} text-rose-400`} />;
      case 'MoonStar': return <Moon className={`${sizeClass} text-indigo-300`} />;
      default: return <Sun className={`${sizeClass} text-amber-400`} />;
    }
  };

  const dayOfWeek = time.toLocaleDateString([], { weekday: 'long' });
  const dayOfMonth = time.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div
      id="screensaver-canvas"
      onClick={onWakeUp}
      className={`fixed inset-0 z-50 overflow-hidden flex flex-col justify-between transition-colors duration-1000 select-none ${
        dimmed 
          ? 'bg-black text-red-500/80 cursor-none' // High-contrast night protection
          : 'bg-[#050506] text-zinc-100 cursor-none'
      }`}
      style={{
        // Global dim level multiplier in screensaver
        filter: dimmed 
          ? `brightness(${settings.nightModeDimLevel / 1.5}%) contrast(1.1)` 
          : 'none'
      }}
    >
      {/* Faint Background Wave Animations */}
      {!dimmed && settings.showBackgroundWaves && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 opacity-60">
          {/* Back wave */}
          <motion.div
            animate={{ x: ["0%", "-50%"] }}
            transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
            className="absolute bottom-0 w-[200%] h-[50%]"
          >
            <svg 
              className="w-full h-full" 
              viewBox="0 0 2400 120" 
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="wave-grad-1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1e1b4b" stopOpacity="0" />
                  <stop offset="100%" stopColor="#1e1b4b" stopOpacity="0.4" />
                </linearGradient>
              </defs>
              <path 
                d="M0,60 Q300,120 600,60 T1200,60 T1800,60 T2400,60 V120 H0 Z" 
                fill="url(#wave-grad-1)"
              />
            </svg>
          </motion.div>
          {/* Front wave */}
          <motion.div
            animate={{ x: ["-50%", "0%"] }}
            transition={{ duration: 35, repeat: Infinity, ease: "linear" }}
            className="absolute bottom-0 w-[200%] h-[40%]"
          >
            <svg 
              className="w-full h-full" 
              viewBox="0 0 2400 120" 
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="wave-grad-2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#312e81" stopOpacity="0" />
                  <stop offset="100%" stopColor="#312e81" stopOpacity="0.2" />
                </linearGradient>
              </defs>
              <path 
                d="M0,60 Q300,0 600,60 T1200,60 T1800,60 T2400,60 V120 H0 Z" 
                fill="url(#wave-grad-2)"
              />
            </svg>
          </motion.div>
        </div>
      )}

      {/* Atmospheric Background Glow from Elegant Dark design */}
      {!dimmed && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-900/10 rounded-full blur-[120px] pointer-events-none z-0"></div>
      )}



      {/* Primary Center Screen Stage (Animated with Framer Motion for Position shifts and transition) */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center z-10">
        <motion.div
          animate={{
            x: `${burnInOffset.x}vw`,
            y: `${burnInOffset.y}vh`,
            scale: settings.screensaverContentScale || 0.5,
          }}
          transition={{
            type: "spring",
            stiffness: 40,
            damping: 10,
            mass: 0.8
          }}
          className="flex flex-col items-center justify-center filter drop-shadow-[0_15px_30px_rgba(0,0,0,0.8)]"
        >
          {/* Clock face content block */}
          <div className={`${activeFont.cssClass} transition-all duration-300`}>
            
            {/* Hour & Minutes with elegant style gradient text */}
            <h1 
              id="screensaver-time-text"
              className={`leading-none select-none flex items-center justify-center transition-all ${
                dimmed 
                  ? 'text-red-700 text-8xl md:text-[11rem] font-bold' 
                  : 'font-light text-9xl md:text-[12.5rem]'
              }`}
            >
              <span className={dimmed ? '' : 'elegant-text-gradient'}>
                {formatted.hours}
              </span>
              <motion.span
                animate={{ opacity: [0.2, 1, 0.2] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className={`inline-block -translate-y-2 lg:-translate-y-4 px-1 md:px-2 ${dimmed ? 'text-red-800' : 'elegant-text-gradient'}`}
              >
                :
              </motion.span>
              <span className={dimmed ? '' : 'elegant-text-gradient'}>
                {formatted.minutes}
              </span>
              
              {/* Optional seconds ticking inline */}
              {settings.showSeconds && (
                <span className={`text-4xl md:text-5xl font-light font-mono ml-4 select-none ${dimmed ? 'text-red-800' : 'text-indigo-400/80'}`}>
                  {formatted.seconds}
                </span>
              )}
            </h1>
          </div>

          {/* Date lines */}
          <div className={`mt-4 ${dimmed ? 'text-red-700/80' : 'text-zinc-400'} font-sans font-light tracking-widest text-lg md:text-2xl uppercase`}>
            {dayOfWeek}, {dayOfMonth}
          </div>

          {/* Responsive Side-by-Side Bento Widgets (Atmospheric + Local Energy) */}
          <div className="flex flex-col md:flex-row items-stretch justify-center gap-6 mt-6 w-full max-w-4xl px-4 select-none">
            
            {/* Atmospheric Segment */}
            {weatherData ? (
              <div className={`flex-1 flex items-center justify-center gap-5 bg-zinc-900/25 backdrop-blur-md border border-zinc-900/60 p-4 rounded-2xl ${dimmed ? 'border-red-950/40 text-red-700/80 bg-black/40' : ''}`}>
                <div className="flex flex-col items-center justify-center gap-2 shrink-0">
                  <div className="flex items-center gap-3">
                    {dimmed ? (
                      <Moon className="w-8 h-8 text-red-650 animate-pulse-subtle" />
                    ) : (
                      renderWeatherIcon(weatherData.icon, "w-9 h-9 text-indigo-400")
                    )}
                    <span id="screensaver-weather-temp" className={`text-2xl font-light tracking-tight ${dimmed ? 'text-red-500' : 'text-zinc-100'}`}>
                      {weatherData.temp}&deg;{settings.temperatureUnit}
                    </span>
                  </div>
                  
                  {haData && (
                    <div className={`flex items-center gap-4 mt-1 border-t ${dimmed ? 'border-red-900/30' : 'border-zinc-800/40'} pt-2 w-full justify-center`}>
                      <div className="flex items-center gap-1.5" title="Indoor Temperature">
                        <Home className={`w-3.5 h-3.5 ${dimmed ? 'text-red-700' : 'text-slate-400'}`} />
                        {haData.indoorTemp === null ? (
                          <BatteryWarning className="w-3.5 h-3.5 text-red-500" title="Sensor Offline/Battery Dead" />
                        ) : (
                          <span className={`text-xs font-medium tracking-tight ${dimmed ? 'text-red-600' : 'text-zinc-300'}`}>
                            {haData.indoorTemp.toFixed(1)}&deg;
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5" title="Outdoor Temperature">
                        <CloudSun className={`w-3.5 h-3.5 ${dimmed ? 'text-red-700' : 'text-slate-400'}`} />
                        {haData.outdoorTemp === null ? (
                          <BatteryWarning className="w-3.5 h-3.5 text-red-500" title="Sensor Offline/Battery Dead" />
                        ) : (
                          <span className={`text-xs font-medium tracking-tight ${dimmed ? 'text-red-600' : 'text-zinc-300'}`}>
                            {haData.outdoorTemp.toFixed(1)}&deg;
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <div className="h-9 w-[1px] bg-zinc-800/60 shrink-0"></div>
                <div className="text-left overflow-hidden">
                  <p id="screensaver-weather-cond" className={`text-xs font-light uppercase tracking-widest truncate ${dimmed ? 'text-red-650' : 'text-zinc-300'}`}>
                    {weatherData.condition}
                  </p>
                  <p id="screensaver-weather-loc" className={`text-[10px] font-mono tracking-wider truncate mb-1 ${dimmed ? 'text-red-800' : 'text-indigo-400/80'}`}>
                    {weatherData.locationName}
                  </p>
                  <div className={`flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] ${dimmed ? 'text-red-900' : 'text-zinc-500'}`}>
                    <span>HUMIDITY <span className={`font-semibold ${dimmed ? 'text-red-700' : 'text-zinc-400'}`}>{weatherData.humidity}%</span></span>
                    <span>WIND <span className={`font-semibold ${dimmed ? 'text-red-700' : 'text-zinc-400'}`}>{weatherData.windSpeed} km/h</span></span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center p-4 bg-zinc-900/25 backdrop-blur-md border border-zinc-900/60 rounded-2xl text-xs text-zinc-650 font-mono animate-pulse uppercase tracking-widest">
                Syncing weather sensors...
              </div>
            )}

             {/* FoxESS Modbus Smart Power Segment */}
            {haData ? (
              <div className={`flex-1 flex flex-col justify-center bg-zinc-900/25 backdrop-blur-md border border-zinc-900/60 p-3 rounded-2xl relative ${dimmed ? 'border-red-950/40 text-red-700/80 bg-black/40' : ''}`}>
                {settings.telemetryDisplayMode !== 'stats' ? (
                  <PowerFlowDiagram haData={haData} inverterSize={settings.inverterSize || 10.0} dimmed={dimmed} />
                ) : (
                  <div className="grid grid-cols-4 gap-1 divide-x divide-zinc-800/30 text-center">
                    {/* Battery Level SoC */}
                    <div className="flex flex-col items-center">
                      {renderBatteryIcon(haData.batterySoc, haData.invBatPower, dimmed)}
                      <span className={`text-sm font-light tracking-tight ${dimmed ? 'text-red-500' : 'text-zinc-200'}`}>
                        {haData.batterySoc}%
                      </span>
                      <span className="text-[8px] font-mono uppercase tracking-widest mt-0.5 text-zinc-500">
                        SoC Level
                      </span>
                    </div>

                    {/* Today's Solar PV Harvest */}
                    <div className="flex flex-col items-center">
                      {renderSolarIcon(haData.solarToday, settings.inverterSize || 10.0, dimmed)}
                      <span className={`text-sm font-light tracking-tight ${dimmed ? 'text-red-500' : 'text-zinc-200'}`}>
                        {haData.solarToday.toFixed(1)} <span className="text-[9px] text-zinc-550">kWh</span>
                      </span>
                      <span className="text-[8px] font-mono uppercase tracking-widest mt-0.5 text-zinc-500">
                        Solar Day
                      </span>
                    </div>

                    {/* Grid Power Exchange */}
                    <div className="flex flex-col items-center">
                      {renderGridIcon(haData.gridCt, settings.inverterSize || 10.0, dimmed)}
                      <span className={`text-sm font-light tracking-tight ${dimmed ? 'text-red-500' : 'text-zinc-200'}`}>
                        {Math.abs(haData.gridCt).toFixed(2)} <span className="text-[9px] text-zinc-550">kW</span>
                      </span>
                      <span className="text-[8px] font-mono uppercase tracking-widest mt-0.5 text-zinc-500">
                        {Math.abs(haData.gridCt) < 0.15 ? 'Idle' : (haData.gridCt > 0 ? 'Export' : 'Import')}
                      </span>
                    </div>

                    {/* Current Load power usage */}
                    <div className="flex flex-col items-center">
                      {renderHouseLoadIcon(haData.houseLoad, settings.inverterSize || 10.0, dimmed)}
                      <span className={`text-sm font-light tracking-tight ${dimmed ? 'text-red-500' : 'text-zinc-200'}`}>
                        {haData.houseLoad.toFixed(2)} <span className="text-[9px] text-zinc-550">kW</span>
                      </span>
                      <span className="text-[8px] font-mono uppercase tracking-widest mt-0.5 text-zinc-500">
                        House Load
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center p-4 bg-zinc-900/25 backdrop-blur-md border border-zinc-900/60 rounded-2xl text-xs text-zinc-650 font-mono animate-pulse uppercase tracking-widest">
                Awaiting telemetry hub...
              </div>
            )}



          </div>
        </motion.div>
      </div>


    </div>
  );
}
