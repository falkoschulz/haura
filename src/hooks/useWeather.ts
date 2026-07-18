import { useState, useEffect } from 'react';
import { WeatherSourceId, WeatherData, ScreensaverSettings } from '../types';
import { WEATHER_SOURCES, generateMockWeatherData } from '../constants';

export function useWeather(settings: ScreensaverSettings, addActivityLog?: (msg: string) => void) {
  const [data, setData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [localCoords, setLocalCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [detectedLocationName, setDetectedLocationName] = useState<string>('');

  // Auto-detect browser geolocation if selected
  useEffect(() => {
    if (settings.useAutoLocation) {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            const coords = { lat: pos.coords.latitude, lon: pos.coords.longitude };
            setLocalCoords(coords);
            setErrorMsg(null);
            
            try {
              // Try to get location name via reverse geocoding
              const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${coords.lat}&lon=${coords.lon}&format=json`);
              if (res.ok) {
                const json = await res.json();
                const city = json.address.city || json.address.town || json.address.village || json.address.county || 'Current Location';
                setDetectedLocationName(city);
              }
            } catch (e) {
              setDetectedLocationName('Current Location');
            }
          },
          (err) => {
            console.warn("Geolocation access denied or failed.", err);
            setErrorMsg("Location access denied or unavailable. Using configured coordinates.");
            setLocalCoords(null);
          },
          { timeout: 8000 }
        );
      } else {
        setErrorMsg("Geolocation not supported. Using configured coordinates.");
        setLocalCoords(null);
      }
    } else {
      setLocalCoords(null);
      setDetectedLocationName(settings.manualLocationName || 'Configured Location');
    }
  }, [settings.useAutoLocation, settings.manualLocationName]);

  const fetchOpenMeteoWeather = async (lat: number, lon: number, locationName: string) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,rain,showers,snowfall,weather_code,wind_speed_10m&hourly=temperature_2m,weather_code&forecast_days=1&timezone=auto`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Weather request failed.");
      const json = await res.json();
      
      const current = json.current;
      const hourly = json.hourly;
      
      const weatherCode = current.weather_code;
      let condition = 'Mild';
      let icon = 'Sun';
      
      if (weatherCode === 0) { condition = 'Clear Sky'; icon = 'Sun'; }
      else if ([1, 2].includes(weatherCode)) { condition = 'Partly Cloudy'; icon = 'CloudSun'; }
      else if (weatherCode === 3) { condition = 'Overcast Sky'; icon = 'Cloud'; }
      else if ([45, 48].includes(weatherCode)) { condition = 'Damp Fog'; icon = 'CloudFog'; }
      else if ([51, 53, 55].includes(weatherCode)) { condition = 'Slight Drizzle'; icon = 'CloudDrizzle'; }
      else if ([61, 63, 65].includes(weatherCode)) { condition = 'Rainy Conditions'; icon = 'CloudRain'; }
      else if ([71, 73, 75, 77].includes(weatherCode)) { condition = 'Snowy Drifts'; icon = 'CloudSnow'; }
      else if ([80, 81, 82].includes(weatherCode)) { condition = 'Heavy Showers'; icon = 'CloudRain'; }
      else if ([95, 96, 99].includes(weatherCode)) { condition = 'Severe Thunderstorms'; icon = 'CloudLightning'; }

      const formatTempWithUnits = (cValue: number) => settings.temperatureUnit === 'C' ? Math.round(cValue) : Math.round((cValue * 9) / 5 + 32);

      const projectedForecast = [];
      const nowIdx = new Date().getHours();
      for (let i = 0; i < 5; i++) {
        const idx = (nowIdx + i * 2) % 24; 
        const hTime = `${String(idx).padStart(2, '0')}:00`;
        const hTemp = formatTempWithUnits(hourly.temperature_2m[idx] || 15);
        const hCode = hourly.weather_code[idx] || 0;
        
        let hIcon = 'Sun';
        if ([1, 2].includes(hCode)) hIcon = 'CloudSun';
        else if (hCode === 3) hIcon = 'Cloud';
        else if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(hCode)) hIcon = 'CloudRain';
        else if ([71, 73, 75].includes(hCode)) hIcon = 'CloudSnow';
        else if ([95, 96, 99].includes(hCode)) hIcon = 'CloudLightning';

        projectedForecast.push({ time: hTime, temp: hTemp, icon: hIcon, condition: 'Normal' });
      }

      setData({
        temp: formatTempWithUnits(current.temperature_2m),
        condition,
        locationName, // Added Location Name
        icon,
        humidity: Math.round(current.relative_humidity_2m || 45),
        windSpeed: Math.round(current.wind_speed_10m || 10),
        high: formatTempWithUnits(current.temperature_2m + 3),
        low: formatTempWithUnits(current.temperature_2m - 4),
        lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        forecast: projectedForecast
      });
      if (addActivityLog && !loading) addActivityLog(`Weather synced for ${locationName}`);
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to connect to Open-Meteo. Please try simulated mode or check network.");
      setData(generateMockWeatherData('open-meteo', settings.temperatureUnit));
    } finally {
      setLoading(false);
    }
  };

  const forceRefresh = () => {
    const isSimulated = WEATHER_SOURCES.find(s => s.id === settings.weatherSource)?.isSimulated;
    if (isSimulated) {
      setLoading(true);
      setTimeout(() => {
        setData(generateMockWeatherData(settings.weatherSource, settings.temperatureUnit));
        setLoading(false);
      }, 400);
    } else {
      const activeLat = localCoords ? localCoords.lat : parseFloat(settings.latitude) || -33.8688;
      const activeLon = localCoords ? localCoords.lon : parseFloat(settings.longitude) || 151.2093;
      const locName = localCoords ? detectedLocationName : (settings.manualLocationName || 'Configured Location');
      fetchOpenMeteoWeather(activeLat, activeLon, locName);
    }
  };

  useEffect(() => {
    // Only auto fetch after localCoords stabilizes or is skipped
    forceRefresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.weatherSource, settings.temperatureUnit, settings.useAutoLocation, settings.latitude, settings.longitude, settings.manualLocationName, localCoords]);

  return { data, loading, errorMsg, forceRefresh };
}
