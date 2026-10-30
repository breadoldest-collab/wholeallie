import React, { useState, useEffect } from 'react';
import { MapPin, Clock, Wind, Droplets, ChevronDown, RefreshCw, X, Sparkles } from 'lucide-react';

function getWeatherMeta(code, isDay = 1) {
  if (code === 0) {
    return {
      label: isDay ? 'Sunny' : 'Clear Night',
      pillBg: '#fff2b8',
      pillColor: '#8a5b00',
    };
  }
  if (code === 1 || code === 2) {
    return {
      label: isDay ? 'Partly Cloudy' : 'Partly Cloudy',
      pillBg: '#e9fff5',
      pillColor: '#0f7a57',
    };
  }
  if (code === 3) {
    return {
      label: 'Overcast',
      pillBg: '#f1ebff',
      pillColor: '#6434df',
    };
  }
  if (code === 45 || code === 48) {
    return {
      label: 'Foggy',
      pillBg: '#f1f5f9',
      pillColor: '#475569',
    };
  }
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) {
    return {
      label: code >= 65 || code === 82 ? 'Heavy Rain' : 'Rainy',
      pillBg: '#e0f2fe',
      pillColor: '#0369a1',
    };
  }
  if (code >= 71 && code <= 77) {
    return {
      label: 'Snowy',
      pillBg: '#f0fdf4',
      pillColor: '#15803d',
    };
  }
  if (code >= 95) {
    return {
      label: 'Thunderstorm',
      pillBg: '#fee2e2',
      pillColor: '#b91c1c',
    };
  }
  return {
    label: isDay ? 'Clear' : 'Clear Night',
    pillBg: '#fff2b8',
    pillColor: '#8a5b00',
  };
}

export default function WeatherTimeWidget() {
  const [time, setTime] = useState(new Date());
  const [locationName, setLocationName] = useState('Detecting...');
  const [weather, setWeather] = useState(null);
  const [tempUnit, setTempUnit] = useState('C'); // 'C' | 'F'
  const [isLoading, setIsLoading] = useState(true);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // 1. Real-time live clock ticking every second
  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 2. Fetch weather for given coordinates
  const fetchWeatherForCoords = async (lat, lon, cityName, countryCode) => {
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m&timezone=auto`;
      const res = await fetch(url);
      const data = await res.json();
      if (data && data.current) {
        setWeather(data.current);
        const displayName = cityName ? `${cityName}${countryCode ? `, ${countryCode}` : ''}` : 'Local Region';
        setLocationName(displayName);
      }
    } catch (err) {
      console.warn('Weather fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Fallback chain for location (browser -> IP API -> Timezone heuristic)
  const initLocationAndWeather = async () => {
    setIsLoading(true);

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            const revRes = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`);
            const revData = await revRes.json();
            const city = revData.city || revData.locality || 'Local City';
            const country = revData.countryCode || '';
            fetchWeatherForCoords(latitude, longitude, city, country);
            return;
          } catch {
            fetchWeatherForCoords(latitude, longitude, 'My Location', '');
            return;
          }
        },
        async () => {
          await fallbackToIpGeo();
        },
        { timeout: 3000 }
      );
    } else {
      await fallbackToIpGeo();
    }
  };

  const fallbackToIpGeo = async () => {
    try {
      const res = await fetch('https://ipwho.is/');
      const data = await res.json();
      if (data && data.success !== false && data.latitude && data.longitude) {
        fetchWeatherForCoords(data.latitude, data.longitude, data.city, data.country_code);
        return;
      }
    } catch (e) {
      console.warn('ipwho.is error:', e);
    }

    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/New_York';
      const cleanCity = tz.split('/').pop().replace(/_/g, ' ');
      const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cleanCity)}&count=1&language=en&format=json`;
      const gRes = await fetch(geoUrl);
      const gData = await gRes.json();
      if (gData.results && gData.results.length > 0) {
        const item = gData.results[0];
        fetchWeatherForCoords(item.latitude, item.longitude, item.name, item.country_code);
        return;
      }
    } catch (err) {
      console.warn('Timezone heuristic failed:', err);
    }

    fetchWeatherForCoords(40.71, -74.00, 'New York', 'US');
  };

  useEffect(() => {
    initLocationAndWeather();
  }, []);

  const meta = weather
    ? getWeatherMeta(weather.weather_code, weather.is_day)
    : { label: 'Clear', pillBg: '#fff2b8', pillColor: '#8a5b00' };

  // Temperature calculations
  const rawCelsius = weather ? Math.round(weather.temperature_2m) : 24;
  const rawFahrenheit = Math.round((rawCelsius * 9) / 5 + 32);
  const displayTemp = tempUnit === 'C' ? `${rawCelsius}°C` : `${rawFahrenheit}°F`;

  const feelsCelsius = weather ? Math.round(weather.apparent_temperature) : rawCelsius;
  const feelsFahrenheit = Math.round((feelsCelsius * 9) / 5 + 32);
  const displayFeels = tempUnit === 'C' ? `${feelsCelsius}°` : `${feelsFahrenheit}°`;

  // Time & Date format
  const hours = time.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });

  const formattedDayDate = time.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      {/* ── Main Neo-Brutalist Floating Pill Widget ─────────────────── */}
      <div
        onClick={() => setShowDetailModal((prev) => !prev)}
        style={{
          background: '#ffffff',
          border: '2.5px solid #252b3a',
          borderRadius: 22,
          boxShadow: '4px 4px 0 0 #252b3a',
          padding: '7px 15px',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 14,
          fontFamily: 'var(--dp-typography-reading), sans-serif',
          transition: 'transform 0.15s ease, box-shadow 0.15s ease',
          cursor: 'pointer',
          userSelect: 'none',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translate(-2px, -2px)';
          e.currentTarget.style.boxShadow = '6px 6px 0 0 #252b3a';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translate(0, 0)';
          e.currentTarget.style.boxShadow = '4px 4px 0 0 #252b3a';
        }}
        title="Click to view live weather &amp; location details"
      >
        {/* ── SECTION 1: ANIMATED WEATHER (User-Provided WebM) ───────── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              border: '2.5px solid #252b3a',
              overflow: 'hidden',
              background: '#f8fafc',
              boxShadow: '2px 2px 0 0 #252b3a',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
            }}
          >
            <video
              src="/weather-animation.webm"
              autoPlay
              loop
              muted
              playsInline
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block',
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  setTempUnit((u) => (u === 'C' ? 'F' : 'C'));
                }}
                title="Click to toggle °C / °F"
                style={{
                  fontSize: 16,
                  fontWeight: 900,
                  color: '#252b3a',
                  fontFamily: 'var(--dp-typography-display), sans-serif',
                  letterSpacing: '-0.02em',
                }}
              >
                {isLoading ? '--°' : displayTemp}
              </span>

              <span
                style={{
                  fontSize: 9.5,
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  background: meta.pillBg,
                  color: meta.pillColor,
                  padding: '2px 7px',
                  borderRadius: 999,
                  border: '1.5px solid #252b3a',
                  whiteSpace: 'nowrap',
                }}
              >
                {isLoading ? 'Loading' : meta.label}
              </span>
            </div>

            <span style={{ fontSize: 10.5, color: '#64748b', fontWeight: 600, marginTop: 2 }}>
              Feels {displayFeels}
            </span>
          </div>
        </div>

        {/* Divider */}
        <div style={{ width: 2, height: 26, background: '#252b3a', opacity: 0.18 }} />

        {/* ── SECTION 2: LOCATION ───────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              background: '#e9fff5',
              border: '2px solid #252b3a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#0f7a57',
              flexShrink: 0,
            }}
          >
            <MapPin size={15} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15 }}>
            <span
              style={{
                fontSize: 12.5,
                fontWeight: 800,
                color: '#252b3a',
                letterSpacing: '-0.01em',
                maxWidth: 130,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
              title={locationName}
            >
              {locationName}
            </span>
            <span style={{ fontSize: 10, color: '#64748b', fontWeight: 600, marginTop: 2 }}>
              Live Region
            </span>
          </div>
        </div>

        {/* Divider */}
        <div style={{ width: 2, height: 26, background: '#252b3a', opacity: 0.18 }} />

        {/* ── SECTION 3: LIVE TIME & TICKING SECONDS ─────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              background: '#ffd05b',
              border: '2px solid #252b3a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#252b3a',
              flexShrink: 0,
            }}
          >
            <Clock size={15} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: '#34d399',
                  boxShadow: '0 0 0 2px rgba(52, 211, 153, 0.25)',
                  display: 'inline-block',
                }}
              />
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 900,
                  color: '#252b3a',
                  fontFamily: 'monospace',
                  letterSpacing: '-0.02em',
                }}
              >
                {hours}
              </span>
            </div>

            <span style={{ fontSize: 10.5, color: '#64748b', fontWeight: 600, marginTop: 2 }}>
              {formattedDayDate}
            </span>
          </div>

          <ChevronDown size={14} style={{ color: '#64748b', marginLeft: 2 }} />
        </div>
      </div>

      {/* ── DETAIL MODAL POPOVER ────────────────────────────────────── */}
      {showDetailModal && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'absolute',
            top: 'calc(100% + 10px)',
            right: 0,
            width: 330,
            background: '#fffdf5',
            border: '3px solid #252b3a',
            borderRadius: 22,
            boxShadow: '8px 8px 0 0 #252b3a',
            padding: 18,
            zIndex: 1000,
            animation: 'popIn 0.15s ease',
          }}
        >
          <style>{`
            @keyframes popIn {
              from { opacity: 0; transform: translateY(-8px) scale(0.98); }
              to { opacity: 1; transform: translateY(0) scale(1); }
            }
          `}</style>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <Sparkles size={16} style={{ color: '#6434df' }} />
              <span style={{ fontSize: 13, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#252b3a' }}>
                Local Weather &amp; Time
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button
                type="button"
                onClick={() => initLocationAndWeather()}
                title="Refresh Weather"
                style={{
                  background: '#ffffff',
                  border: '2px solid #252b3a',
                  borderRadius: 6,
                  padding: 4,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <RefreshCw size={13} style={{ color: '#252b3a' }} />
              </button>

              <button
                type="button"
                onClick={() => setShowDetailModal(false)}
                title="Close"
                style={{
                  background: '#ffffff',
                  border: '2px solid #252b3a',
                  borderRadius: 6,
                  padding: 4,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={13} style={{ color: '#252b3a' }} />
              </button>
            </div>
          </div>

          {/* Full Animation Player Box */}
          <div
            style={{
              width: '100%',
              height: 140,
              borderRadius: 14,
              border: '2.5px solid #252b3a',
              overflow: 'hidden',
              background: '#000000',
              boxShadow: '3px 3px 0 0 #252b3a',
              marginBottom: 14,
              position: 'relative',
            }}
          >
            <video
              src="/weather-animation.webm"
              autoPlay
              loop
              muted
              playsInline
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block',
              }}
            />
            <div
              style={{
                position: 'absolute',
                bottom: 8,
                left: 10,
                background: 'rgba(37, 43, 58, 0.85)',
                color: '#ffffff',
                padding: '3px 8px',
                borderRadius: 999,
                fontSize: 10,
                fontWeight: 800,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                backdropFilter: 'blur(4px)',
              }}
            >
              {meta.label} &bull; {displayTemp}
            </div>
          </div>

          {/* Metric Badges */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
            <div
              style={{
                background: '#ffffff',
                border: '2px solid #252b3a',
                borderRadius: 12,
                padding: '8px 10px',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <Wind size={16} style={{ color: '#6434df' }} />
              <div>
                <div style={{ fontSize: 9.5, color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Wind Speed</div>
                <div style={{ fontSize: 12.5, fontWeight: 900, color: '#252b3a' }}>
                  {weather ? `${weather.wind_speed_10m} km/h` : '--'}
                </div>
              </div>
            </div>

            <div
              style={{
                background: '#ffffff',
                border: '2px solid #252b3a',
                borderRadius: 12,
                padding: '8px 10px',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <Droplets size={16} style={{ color: '#0284c7' }} />
              <div>
                <div style={{ fontSize: 9.5, color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Humidity</div>
                <div style={{ fontSize: 12.5, fontWeight: 900, color: '#252b3a' }}>
                  {weather ? `${weather.relative_humidity_2m}%` : '--'}
                </div>
              </div>
            </div>
          </div>

          {/* Location & Time Footer in Modal */}
          <div
            style={{
              background: '#f1ebff',
              border: '2px solid #252b3a',
              borderRadius: 12,
              padding: '10px 12px',
              fontSize: 11,
              fontWeight: 700,
              color: '#252b3a',
              display: 'flex',
              flexDirection: 'column',
              gap: 3,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <MapPin size={12} style={{ color: '#6434df' }} />
              <span>{locationName}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#64748b', fontSize: 10.5 }}>
              <Clock size={12} />
              <span>{time.toLocaleTimeString()} &bull; {formattedDayDate}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
