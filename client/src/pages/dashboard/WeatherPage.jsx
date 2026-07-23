import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CloudSun, Droplets, Thermometer } from 'lucide-react';
import axios from 'axios';
import { useFarmers } from '../../context/FarmerContext';

const PUNE_LAT = 18.5204;
const PUNE_LON = 73.8567;

export default function WeatherPage() {
  const [weather, setWeather] = useState(null);
  const [error, setError] = useState('');
  const { activeFarmers } = useFarmers();
  const [locationName, setLocationName] = useState('Pune');

  useEffect(() => {
    const run = async () => {
      try {
        let lat = PUNE_LAT;
        let lon = PUNE_LON;

        if (activeFarmers.length > 0) {
          const email = activeFarmers[0].email;
          try {
            const API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
            const fRes = await axios.get(`${API}/farmer/${email}`);
            if (fRes.data && fRes.data.lastLat && fRes.data.lastLon) {
              lat = fRes.data.lastLat;
              lon = fRes.data.lastLon;
              setLocationName('Live App Location');
            }
          } catch (e) {
            console.log('Could not fetch dynamic farmer location, defaulting to Pune');
          }
        }

        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code`;
        const res = await fetch(url);
        const json = await res.json();
        setWeather(json.current || null);
      } catch {
        setError('Failed to fetch weather intelligence');
      }
    };
    run();
  }, []);

  const riskHigh = useMemo(() => {
    if (!weather) return false;
    return Number(weather.relative_humidity_2m) > 70;
  }, [weather]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Weather Intel</h1>
        <p className="mt-1 text-sm text-gray-600">Operation Zone: {locationName}</p>
      </div>

      {error && <div className="rounded-3xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      {riskHigh && (
        <div className="flex items-center gap-3 rounded-3xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800 shadow-sm">
          <AlertTriangle size={18} />
          <span className="text-sm font-semibold">HIGH FUNGAL SPREAD RISK - Relative Humidity above 70%</span>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl bg-white p-5 shadow-sm transition hover:shadow-md">
          <div className="mb-2 flex items-center gap-2 text-gray-600">
            <Thermometer size={16} />
            <span className="text-sm">Temperature</span>
          </div>
          <p className="text-3xl font-bold text-[#15803d]">{weather ? `${weather.temperature_2m}°C` : '--'}</p>
        </div>

        <div className="rounded-3xl bg-white p-5 shadow-sm transition hover:shadow-md">
          <div className="mb-2 flex items-center gap-2 text-gray-600">
            <Droplets size={16} />
            <span className="text-sm">Humidity</span>
          </div>
          <p className="text-3xl font-bold text-[#15803d]">{weather ? `${weather.relative_humidity_2m}%` : '--'}</p>
        </div>

        <div className="rounded-3xl bg-white p-5 shadow-sm transition hover:shadow-md">
          <div className="mb-2 flex items-center gap-2 text-gray-600">
            <CloudSun size={16} />
            <span className="text-sm">Weather Code</span>
          </div>
          <p className="text-3xl font-bold text-[#15803d]">{weather ? weather.weather_code : '--'}</p>
        </div>
      </div>
    </div>
  );
}
