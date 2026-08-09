/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { Sun, Moon, Battery, ArrowRightLeft, Home, ZapOff } from 'lucide-react';
import { HomeAssistantData } from '../hooks/useHomeAssistant';

interface PowerFlowDiagramProps {
  haData: HomeAssistantData;
  inverterSize?: number;
  dimmed?: boolean;
}

interface RectangularFlowPathProps {
  x1: number;
  x2: number;
  yStart: number;
  yBus: number;
  active: boolean;
  reverse?: boolean;
  color: string;
  glowColor: string;
  kw: number;
  dimmed?: boolean;
}

const RectangularFlowPath: React.FC<RectangularFlowPathProps> = ({
  x1,
  x2,
  yStart,
  yBus,
  active,
  reverse = false,
  color,
  glowColor,
  kw,
  dimmed = false,
}) => {
  const absKw = Math.abs(kw);
  const duration = active ? Math.max(0.35, 2.5 / (absKw + 0.5)) : 0;

  // Direct power-proportional stroke width scaling (1.7px up to 8.0px)
  const activeStrokeWidth = active
    ? Math.min(8.0, Math.max(1.7, 1.0 + absKw * 1.6))
    : 1.0;
  const glowStrokeWidth = activeStrokeWidth + 3.0;

  // Orthogonal 90-degree rectangular path:
  const pathD = `M ${x1},${yStart} L ${x1},${yBus} L ${x2},${yBus} L ${x2},${yStart}`;
  const midX = (x1 + x2) / 2;

  // Grayed-out inactive track vs illuminated active track
  const trackStroke = dimmed
    ? 'rgba(127, 29, 29, 0.25)'
    : active
      ? 'rgba(63, 63, 70, 0.65)'
      : 'rgba(63, 63, 70, 0.25)';

  return (
    <g>
      {/* 1. Permanent Base Schematic Track */}
      <path
        d={pathD}
        fill="none"
        stroke={trackStroke}
        strokeWidth={active ? activeStrokeWidth.toFixed(1) : '1.0'}
        strokeDasharray={active ? 'none' : '2 3'}
        strokeLinecap="square"
        strokeLinejoin="miter"
      />

      {/* 2. Illuminated Active Flow Track */}
      {active && !dimmed && absKw > 0.05 && (
        <>
          {/* Subtle Outer Glow */}
          <path
            d={pathD}
            fill="none"
            stroke={glowColor}
            strokeWidth={glowStrokeWidth.toFixed(1)}
            strokeOpacity="0.2"
            strokeLinecap="square"
            strokeLinejoin="miter"
          />

          {/* Animated Particles Flow Track */}
          <path
            d={pathD}
            fill="none"
            stroke={color}
            strokeWidth={activeStrokeWidth.toFixed(1)}
            strokeDasharray="6 9"
            strokeLinecap="square"
            strokeLinejoin="miter"
            style={{
              animation: `${reverse ? 'powerFlowReverse' : 'powerFlowForward'} ${duration}s linear infinite`,
            }}
          />

          {/* Live kW Flow Badge at Bus Center */}
          <g transform={`translate(${midX}, ${yBus})`}>
            <rect
              x="-21"
              y="-7.5"
              width="42"
              height="15"
              rx="7.5"
              fill={dimmed ? '#450a0a' : '#09090b'}
              stroke={dimmed ? '#7f1d1d' : color}
              strokeWidth="1"
              opacity="0.96"
            />
            <text
              x="0"
              y="3"
              textAnchor="middle"
              fill={dimmed ? '#f87171' : color}
              fontSize="8"
              fontWeight="700"
              fontFamily="monospace"
            >
              {absKw.toFixed(1)}kW
            </text>
          </g>
        </>
      )}
    </g>
  );
};

/* --- ANIMATED ICON RENDERERS --- */

const renderAnimatedBattery = (soc: number, invBatPower: number, dimmed: boolean) => {
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
      className="relative flex items-center justify-center"
      animate={isLow && !isCharging ? { scale: [1, 1.15, 1], opacity: [0.6, 1, 0.6] } : {}}
      transition={isLow && !isCharging ? { duration: 1, repeat: Infinity, ease: 'easeInOut' } : {}}
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="2" y="6" width="17" height="12" rx="2.5" stroke={dimmed ? '#b91c1c' : '#2dd4bf'} strokeWidth="2" className={dimmed ? 'stroke-red-800' : 'stroke-teal-400'} />
        <path d="M21 10C21.5523 10 22 10.4477 22 11V13C22 13.5523 21.5523 14 21 14H20V10H21Z" fill={dimmed ? '#b91c1c' : '#2dd4bf'} className={dimmed ? 'fill-red-800' : 'fill-teal-400'} />
        {Array.from({ length: 4 }).map((_, idx) => {
          const isActive = idx < numBars;
          if (!isActive) return null;

          let animationProps = {};
          let transitionProps = {};

          if (!dimmed) {
            if (isCharging) {
              animationProps = { opacity: [0.3, 1, 0.3] };
              transitionProps = { duration: 1.5, repeat: Infinity, delay: idx * 0.3, ease: 'easeInOut' };
            } else if (isDischarging) {
              animationProps = { opacity: [1, 0.3, 1] };
              transitionProps = { duration: 1.5, repeat: Infinity, delay: (3 - idx) * 0.3, ease: 'easeInOut' };
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

const renderAnimatedSolar = (solarPower: number, inverterSize: number, dimmed: boolean) => {
  const isSolarActive = solarPower >= 0.15;
  const solarRatio = Math.min(1.0, solarPower / (inverterSize || 10.0));
  const spinDuration = isSolarActive ? Math.max(3, 16 * (1 - solarRatio)) : 0;

  return (
    <motion.div
      className="relative flex items-center justify-center"
      animate={{
        rotate: isSolarActive ? 360 : 0,
        scale: isSolarActive ? [1, 1 + solarRatio * 0.08, 1] : 1,
      }}
      transition={{
        rotate: isSolarActive
          ? { repeat: Infinity, duration: spinDuration, ease: 'linear' }
          : {},
        scale: isSolarActive
          ? { repeat: Infinity, duration: Math.max(2, 5 * (1 - solarRatio)), ease: 'easeInOut' }
          : {},
      }}
    >
      {isSolarActive ? (
        <Sun className={`w-6 h-6 ${dimmed ? 'text-red-700/80' : 'text-amber-400'}`} />
      ) : (
        <Moon className={`w-6 h-6 ${dimmed ? 'text-indigo-900/80' : 'text-zinc-400'}`} />
      )}
    </motion.div>
  );
};

const renderAnimatedGrid = (gridCt: number, inverterSize: number, dimmed: boolean) => {
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

  const animDuration = Math.max(0.3, 2.2 * (1 - ratio));
  const hasFlow = !isIdle && absGrid > 0.05;

  return (
    <motion.div
      className="relative flex items-center justify-center"
      animate={
        hasFlow
          ? { x: isExport ? [0, 2, 0] : [0, -2, 0], opacity: [0.7, 1, 0.7] }
          : {}
      }
      transition={
        hasFlow
          ? { repeat: Infinity, duration: animDuration, ease: 'easeInOut' }
          : {}
      }
    >
      {isIdle ? (
        <ZapOff className={`w-6 h-6 ${colorClass}`} />
      ) : (
        <ArrowRightLeft className={`w-6 h-6 ${colorClass}`} />
      )}
    </motion.div>
  );
};

const renderAnimatedHouse = (houseLoad: number, inverterSize: number, dimmed: boolean) => {
  const loadRatio = Math.min(1.0, houseLoad / (inverterSize || 10.0));
  let loadColorClass = dimmed ? 'text-red-700/80' : 'text-rose-400';
  const pulseDuration = Math.max(0.4, 2.5 * (1 - loadRatio));
  const isHighLoad = loadRatio > 0.7;

  return (
    <motion.div
      className="relative flex items-center justify-center"
      animate={{
        scale: [1, 1.12, 1],
        x: isHighLoad ? [-1, 1, -1, 1, 0] : 0,
        y: isHighLoad ? [1, -1, 1, -1, 0] : 0,
      }}
      transition={{
        scale: {
          repeat: Infinity,
          duration: pulseDuration,
          ease: 'easeInOut',
        },
        x: isHighLoad ? { repeat: Infinity, duration: 0.15, ease: 'linear' } : {},
        y: isHighLoad ? { repeat: Infinity, duration: 0.15, ease: 'linear' } : {},
      }}
    >
      <Home className={`w-6 h-6 ${loadColorClass}`} />
    </motion.div>
  );
};

export const PowerFlowDiagram: React.FC<PowerFlowDiagramProps> = ({
  haData,
  inverterSize = 10.0,
  dimmed = false,
}) => {
  const { solarPower = 0, invBatPower = 0, gridCt = 0, houseLoad = 0, batterySoc = 0 } = haData;

  // Active state calculations
  const isSolarActive = solarPower >= 0.15;
  const isBatCharging = invBatPower < -0.05;
  const isBatDischarging = invBatPower > 0.05;

  const absGrid = Math.abs(gridCt);
  const isGridExport = gridCt >= 0.15;
  const isGridImport = gridCt <= -0.15;
  const isGridActive = isGridExport || isGridImport;

  // Power flow distribution decomposition across all 7 possible routes
  const solarToHouse = Math.min(solarPower, houseLoad);
  const solarToBat = isBatCharging ? Math.min(solarPower - solarToHouse, Math.abs(invBatPower)) : 0;
  const solarToGrid = isGridExport ? Math.max(0, solarPower - solarToHouse - solarToBat) : 0;

  const batToHouse = isBatDischarging ? Math.min(invBatPower, Math.max(0, houseLoad - solarToHouse)) : 0;
  const batToGrid = isBatDischarging && isGridExport ? Math.max(0, invBatPower - batToHouse) : 0;

  const gridToHouse = isGridImport ? Math.min(absGrid, Math.max(0, houseLoad - solarToHouse - batToHouse)) : 0;
  const gridToBat = isGridImport && isBatCharging ? Math.max(0, absGrid - gridToHouse) : 0;

  // SVG Bus Canvas (viewBox 0 0 400 48)
  // Exactly 4 columns (25% each): Battery=50, Solar=150, Grid=250, House=350
  const yStart = 48; // Bottom of SVG canvas
  const n = {
    bat: { x: 50 },
    sol: { x: 150 },
    grid: { x: 250 },
    house: { x: 350 },
  };

  // Color Palette
  const colors = {
    amber: '#fbbf24',
    amberGlow: '#f59e0b',
    teal: '#2dd4bf',
    tealGlow: '#14b8a6',
    emerald: '#34d399',
    emeraldGlow: '#10b981',
    purple: '#c084fc',
    purpleGlow: '#a855f7',
    rose: '#f43f5e',
    roseGlow: '#e11d48',
  };

  return (
    <div className="relative w-full max-w-xl mx-auto flex flex-col items-center select-none py-1">
      {/* CSS Animation Keyframes */}
      <style>{`
        @keyframes powerFlowForward {
          from { stroke-dashoffset: 30; }
          to { stroke-dashoffset: 0; }
        }
        @keyframes powerFlowReverse {
          from { stroke-dashoffset: 0; }
          to { stroke-dashoffset: 30; }
        }
      `}</style>

      {/* 1. TOP SECTION: Architectural SVG Bus Lines */}
      <div className="w-full aspect-[40/4.8] relative mb-1">
        <svg
          viewBox="0 0 400 48"
          className="w-full h-full overflow-visible"
        >
          {/* Channel 1: Solar -> House Load (yBus = 7) */}
          <RectangularFlowPath
            x1={n.sol.x}
            x2={n.house.x}
            yStart={yStart}
            yBus={7}
            active={solarToHouse > 0.05}
            reverse={false}
            color={colors.amber}
            glowColor={colors.amberGlow}
            kw={solarToHouse}
            dimmed={dimmed}
          />

          {/* Channel 2: Solar -> Battery Charge (yBus = 17) */}
          <RectangularFlowPath
            x1={n.sol.x}
            x2={n.bat.x}
            yStart={yStart}
            yBus={17}
            active={solarToBat > 0.05}
            reverse={false}
            color={colors.amber}
            glowColor={colors.amberGlow}
            kw={solarToBat}
            dimmed={dimmed}
          />

          {/* Channel 3: Solar -> Grid Export (yBus = 27) */}
          <RectangularFlowPath
            x1={n.sol.x}
            x2={n.grid.x}
            yStart={yStart}
            yBus={27}
            active={solarToGrid > 0.05}
            reverse={false}
            color={colors.emerald}
            glowColor={colors.emeraldGlow}
            kw={solarToGrid}
            dimmed={dimmed}
          />

          {/* Channel 4: Battery -> House Discharge (yBus = 37) */}
          <RectangularFlowPath
            x1={n.bat.x}
            x2={n.house.x}
            yStart={yStart}
            yBus={37}
            active={batToHouse > 0.05}
            reverse={false}
            color={colors.teal}
            glowColor={colors.tealGlow}
            kw={batToHouse}
            dimmed={dimmed}
          />

          {/* Channel 5: Battery -> Grid Export (yBus = 27) */}
          <RectangularFlowPath
            x1={n.bat.x}
            x2={n.grid.x}
            yStart={yStart}
            yBus={27}
            active={batToGrid > 0.05}
            reverse={false}
            color={colors.teal}
            glowColor={colors.tealGlow}
            kw={batToGrid}
            dimmed={dimmed}
          />

          {/* Channel 6: Grid -> House Import (yBus = 17) */}
          <RectangularFlowPath
            x1={n.grid.x}
            x2={n.house.x}
            yStart={yStart}
            yBus={17}
            active={gridToHouse > 0.05}
            reverse={false}
            color={colors.purple}
            glowColor={colors.purpleGlow}
            kw={gridToHouse}
            dimmed={dimmed}
          />

          {/* Channel 7: Grid -> Battery Charge (yBus = 27) */}
          <RectangularFlowPath
            x1={n.grid.x}
            x2={n.bat.x}
            yStart={yStart}
            yBus={27}
            active={gridToBat > 0.05}
            reverse={false}
            color={colors.purple}
            glowColor={colors.purpleGlow}
            kw={gridToBat}
            dimmed={dimmed}
          />
        </svg>
      </div>

      {/* 2. BOTTOM SECTION: State Icons Row */}
      <div className="w-full grid grid-cols-4 gap-0 text-center pt-1.5 border-t border-zinc-800/40">
        {/* Node 1: Battery (Leftmost) */}
        <div className="flex flex-col items-center">
          <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center border backdrop-blur-md shadow-md ${
              dimmed
                ? 'bg-black/70 border-red-950/60 text-red-700'
                : 'bg-teal-950/40 border-teal-500/40 text-teal-400'
            }`}
          >
            {renderAnimatedBattery(batterySoc, invBatPower, dimmed)}
          </div>
          <span className={`text-xs sm:text-[13px] font-bold tracking-tight mt-1.5 ${dimmed ? 'text-red-500' : 'text-zinc-100'}`}>
            {Math.abs(invBatPower).toFixed(2)} <span className="text-[9px] text-zinc-400 font-medium">kW</span>
          </span>
          <span className="text-[8.5px] font-mono uppercase tracking-wider text-teal-400/90 font-semibold mt-0.5">
            Battery {batterySoc}%
          </span>
        </div>

        {/* Node 2: Solar PV (Mid Left) */}
        <div className="flex flex-col items-center">
          <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center border backdrop-blur-md shadow-md ${
              dimmed
                ? 'bg-black/70 border-red-950/60 text-red-700'
                : isSolarActive
                  ? 'bg-amber-950/40 border-amber-500/40 text-amber-400'
                  : 'bg-zinc-900/70 border-zinc-700/40 text-zinc-400'
            }`}
          >
            {renderAnimatedSolar(solarPower, inverterSize, dimmed)}
          </div>
          <span className={`text-xs sm:text-[13px] font-bold tracking-tight mt-1.5 ${dimmed ? 'text-red-500' : 'text-zinc-100'}`}>
            {solarPower.toFixed(2)} <span className="text-[9px] text-zinc-400 font-medium">kW</span>
          </span>
          <span className={`text-[8.5px] font-mono uppercase tracking-wider font-semibold mt-0.5 ${
            isSolarActive ? 'text-amber-400/90' : 'text-zinc-500'
          }`}>
            {isSolarActive ? 'Solar PV' : 'Solar Idle'}
          </span>
        </div>

        {/* Node 3: Grid Exchange (Mid Right) */}
        <div className="flex flex-col items-center">
          <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center border backdrop-blur-md shadow-md ${
              dimmed
                ? 'bg-black/70 border-red-950/60 text-red-700'
                : isGridExport
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-400'
                  : isGridImport
                    ? 'bg-purple-950/40 border-purple-500/40 text-purple-400'
                    : 'bg-zinc-900/70 border-zinc-700/40 text-zinc-400'
            }`}
          >
            {renderAnimatedGrid(gridCt, inverterSize, dimmed)}
          </div>
          <span className={`text-xs sm:text-[13px] font-bold tracking-tight mt-1.5 ${dimmed ? 'text-red-500' : 'text-zinc-100'}`}>
            {absGrid.toFixed(2)} <span className="text-[9px] text-zinc-400 font-medium">kW</span>
          </span>
          <span className={`text-[8.5px] font-mono uppercase tracking-wider font-semibold mt-0.5 ${
            isGridExport ? 'text-emerald-400' : isGridImport ? 'text-purple-400' : 'text-zinc-500'
          }`}>
            {!isGridActive ? 'Grid Idle' : isGridExport ? 'Export' : 'Import'}
          </span>
        </div>

        {/* Node 4: House Load (Rightmost) */}
        <div className="flex flex-col items-center">
          <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center border backdrop-blur-md shadow-md ${
              dimmed
                ? 'bg-black/70 border-red-950/60 text-red-700'
                : 'bg-rose-950/40 border-rose-500/40 text-rose-400'
            }`}
          >
            {renderAnimatedHouse(houseLoad, inverterSize, dimmed)}
          </div>
          <span className={`text-xs sm:text-[13px] font-bold tracking-tight mt-1.5 ${dimmed ? 'text-red-500' : 'text-zinc-100'}`}>
            {houseLoad.toFixed(2)} <span className="text-[9px] text-zinc-400 font-medium">kW</span>
          </span>
          <span className="text-[8.5px] font-mono uppercase tracking-wider text-rose-400/90 font-semibold mt-0.5">
            House Load
          </span>
        </div>
      </div>
    </div>
  );
};

export default PowerFlowDiagram;
