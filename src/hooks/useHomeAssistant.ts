import { useState, useEffect, useCallback, useRef } from 'react';
import { ScreensaverSettings } from '../types';

export interface HomeAssistantData {
  batterySoc: number; // %
  invBatPower: number; // kW
  gridCt: number; // kW
  solarToday: number; // kWh
  houseLoad: number;  // kW
  indoorTemp: number | null; // C/F
  outdoorTemp: number | null; // C/F
  isLive: boolean;
  isLoading: boolean;
  error?: string;
  lastUpdated?: string;
}

export function useHomeAssistant(settings: ScreensaverSettings, addActivityLog: (msg: string) => void) {
  const [data, setData] = useState<HomeAssistantData>({
    batterySoc: settings.simBatterySoc,
    invBatPower: settings.simInvBatPower,
    gridCt: settings.simGridCt,
    solarToday: settings.simSolarToday,
    houseLoad: settings.simHouseLoad,
    indoorTemp: settings.simIndoorTempOffline ? null : settings.simIndoorTemp,
    outdoorTemp: settings.simOutdoorTempOffline ? null : settings.simOutdoorTemp,
    isLive: false,
    isLoading: false,
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchLiveStates = useCallback(async () => {
    if (!settings.enableHomeAssistant) {
      // Not enabled, use simulation values
      setData({
        batterySoc: settings.simBatterySoc,
        invBatPower: settings.simInvBatPower,
        gridCt: settings.simGridCt,
        solarToday: settings.simSolarToday,
        houseLoad: settings.simHouseLoad,
        indoorTemp: settings.simIndoorTempOffline ? null : settings.simIndoorTemp,
        outdoorTemp: settings.simOutdoorTempOffline ? null : settings.simOutdoorTemp,
        isLive: false,
        isLoading: false,
      });
      return;
    }

    if (!settings.haUrl || !settings.haToken) {
      setData(prev => ({
        ...prev,
        isLive: false,
        isLoading: false,
        error: "Home Assistant URL or Access Token is missing.",
      }));
      return;
    }

    // Cancel pending fetch if any
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setData(prev => ({ ...prev, isLoading: true, error: undefined }));

    const cleanUrl = settings.haUrl.replace(/\/$/, ""); // trim trailing slash
    const headers = {
      Authorization: `Bearer ${settings.haToken}`,
      'Content-Type': 'application/json',
    };

    try {
      // Helper to fetch individual entity state
      const fetchEntity = async (entityId: string): Promise<{ state: string; attributes: any }> => {
        const response = await fetch(`${cleanUrl}/api/states/${entityId}`, {
          method: 'GET',
          headers,
          signal: controller.signal,
        });

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error(`Unauthorized (401). Check your Long-Lived Access Token.`);
          }
          if (response.status === 404) {
            throw new Error(`Entity "${entityId}" not found (404) on your Home Assistant.`);
          }
          throw new Error(`HTTP Error ${response.status} from HA API.`);
        }

        return await response.json();
      };

      // Query battery, solar, and load concurrently or sequentially (safer)
      const socPromise = fetchEntity(settings.entityBatterySoc);
      const invBatPromise = fetchEntity(settings.entityInvBatPower).catch(() => ({ state: "0" })); // Optional
      const gridCtPromise = fetchEntity(settings.entityGridCt).catch(() => ({ state: "0" })); // Optional
      const solarPromise = fetchEntity(settings.entitySolarToday);
      const loadPromise = fetchEntity(settings.entityHouseLoad);
      const indoorPromise = fetchEntity(settings.entityIndoorTemp);
      const outdoorPromise = fetchEntity(settings.entityOutdoorTemp);

      const [socRes, invBatRes, gridCtRes, solarRes, loadRes, indoorRes, outdoorRes] = await Promise.all([
        socPromise, invBatPromise, gridCtPromise, solarPromise, loadPromise, indoorPromise, outdoorPromise
      ]);

      const batterySocNum = parseFloat(socRes.state);
      const invBatPowerNum = parseFloat(invBatRes.state);
      const gridCtNum = parseFloat(gridCtRes.state);
      const solarTodayNum = parseFloat(solarRes.state);
      const houseLoadNum = parseFloat(loadRes.state);
      const indoorTempNum = parseFloat(indoorRes.state);
      const outdoorTempNum = parseFloat(outdoorRes.state);

      setData({
        batterySoc: isNaN(batterySocNum) ? 0 : batterySocNum,
        invBatPower: isNaN(invBatPowerNum) ? 0 : invBatPowerNum,
        gridCt: isNaN(gridCtNum) ? 0 : gridCtNum,
        solarToday: isNaN(solarTodayNum) ? 0 : solarTodayNum,
        houseLoad: isNaN(houseLoadNum) ? 0 : houseLoadNum,
        indoorTemp: isNaN(indoorTempNum) ? null : indoorTempNum,
        outdoorTemp: isNaN(outdoorTempNum) ? null : outdoorTempNum,
        isLive: true,
        isLoading: false,
        lastUpdated: new Date().toLocaleTimeString(),
      });

      addActivityLog(`Home Assistant connection verified. FoxESS data pulled successfully!`);
    } catch (err: any) {
      if (err.name === 'AbortError') return;

      console.error("Home Assistant API Fetch Error: ", err);
      let errMsg = err.message || "Unknown error connecting to Home Assistant.";
      if (err instanceof TypeError && err.message.toLowerCase().includes("failed to fetch")) {
        errMsg = `Network connection failed or CORS blocked. Verify your HA URL (${cleanUrl}) is correct, accessible from this screen, and supports HTTP remote queries.`;
      }

      setData({
        batterySoc: settings.simBatterySoc, // Fallback to sim on error
        invBatPower: settings.simInvBatPower,
        gridCt: settings.simGridCt,
        solarToday: settings.simSolarToday,
        houseLoad: settings.simHouseLoad,
        indoorTemp: settings.simIndoorTempOffline ? null : settings.simIndoorTemp,
        outdoorTemp: settings.simOutdoorTempOffline ? null : settings.simOutdoorTemp,
        isLive: false,
        isLoading: false,
        error: errMsg,
      });

      addActivityLog(`Home Assistant Error: ${errMsg}`);
    }
  }, [
    settings.enableHomeAssistant,
    settings.haUrl,
    settings.haToken,
    settings.entityBatterySoc,
    settings.entitySolarToday,
    settings.entityHouseLoad,
    settings.entityIndoorTemp,
    settings.entityOutdoorTemp,
    settings.simBatterySoc,
    settings.simSolarToday,
    settings.simHouseLoad,
    settings.simIndoorTemp,
    settings.simOutdoorTemp,
    settings.simIndoorTempOffline,
    settings.simOutdoorTempOffline,
    addActivityLog
  ]);

  // Periodic polling every 30 seconds when live, or update instantly when settings adjust
  useEffect(() => {
    fetchLiveStates();

    if (settings.enableHomeAssistant) {
      const interval = setInterval(() => {
        fetchLiveStates();
      }, 30000); // 30 seconds refresh rate
      return () => {
        clearInterval(interval);
        if (abortControllerRef.current) abortControllerRef.current.abort();
      };
    }
  }, [fetchLiveStates, settings.enableHomeAssistant]);

  return {
    data,
    refetch: fetchLiveStates,
  };
}
