import React, { useState, useEffect } from 'react';
import { Clock, Calendar, Sun, Moon, Sparkles } from 'lucide-react';

export type LiveClockVariant = 'navbar' | 'cashier' | 'compact' | 'badge';

interface LiveClockProps {
  variant?: LiveClockVariant;
  className?: string;
  showDate?: boolean;
  showSeconds?: boolean;
  showTimezone?: boolean;
  shiftLabel?: string;
}

export const LiveClock: React.FC<LiveClockProps> = ({
  variant = 'navbar',
  className = '',
  showDate = true,
  showSeconds = true,
  showTimezone = true,
  shiftLabel
}) => {
  const [now, setNow] = useState<Date>(() => new Date());
  const [tick, setTick] = useState<boolean>(false);

  useEffect(() => {
    // Update every second with accurate alignment
    const updateTime = () => {
      setNow(new Date());
      setTick(prev => !prev);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Format parts in Indonesian Locale
  const dayName = now.toLocaleDateString('id-ID', { weekday: 'long' });
  const dayShort = now.toLocaleDateString('id-ID', { weekday: 'short' });
  const dateFormatted = now.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
  const fullDateFormatted = now.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const secondsNum = now.getSeconds();

  // Detect Indonesia Timezone (WIB, WITA, WIT) or fallback
  const timezoneOffset = -now.getTimezoneOffset() / 60;
  const timezoneName = 
    timezoneOffset === 7 ? 'WIB' :
    timezoneOffset === 8 ? 'WITA' :
    timezoneOffset === 9 ? 'WIT' :
    'WIB';

  // Determine period (Pagi, Siang, Sore, Malam)
  const currentHour = now.getHours();
  const timePeriod = 
    currentHour >= 4 && currentHour < 11 ? 'Pagi' :
    currentHour >= 11 && currentHour < 15 ? 'Siang' :
    currentHour >= 15 && currentHour < 18 ? 'Sore' :
    'Malam';

  // 1. Compact Variant (Great for mobile header or small bars)
  if (variant === 'compact') {
    return (
      <div 
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 text-slate-800 dark:text-slate-200 font-mono text-xs ${className}`}
        title={`Waktu Sistem Real-Time: ${dayName}, ${fullDateFormatted} ${hours}:${minutes}:${seconds} ${timezoneName}`}
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <span className="font-bold tabular-nums">{hours}</span>
        <span className={`transition-opacity duration-200 ${tick ? 'opacity-100' : 'opacity-30'} text-emerald-600 dark:text-emerald-400 font-bold`}>:</span>
        <span className="font-bold tabular-nums">{minutes}</span>
        {showSeconds && (
          <>
            <span className={`transition-opacity duration-200 ${tick ? 'opacity-100' : 'opacity-30'} text-emerald-600 dark:text-emerald-400 font-bold`}>:</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold tabular-nums w-[18px] text-left">{seconds}</span>
          </>
        )}
        {showTimezone && <span className="text-[10px] text-slate-400 font-sans ml-0.5">{timezoneName}</span>}
      </div>
    );
  }

  // 2. Badge Variant (Minimalistic)
  if (variant === 'badge') {
    return (
      <div 
        className={`inline-flex items-center gap-1.5 text-xs font-mono font-bold text-slate-700 dark:text-slate-300 ${className}`}
        title={`${dayName}, ${fullDateFormatted}`}
      >
        <Clock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 animate-spin" style={{ animationDuration: '60s' }} />
        <span>{hours}</span>
        <span className={tick ? 'opacity-100' : 'opacity-30'}>:</span>
        <span>{minutes}</span>
        <span className={tick ? 'opacity-100' : 'opacity-30'}>:</span>
        <span className="text-emerald-600 dark:text-emerald-400">{seconds}</span>
      </div>
    );
  }

  // 3. Cashier Prominent Variant (Designed for POS station top bar)
  if (variant === 'cashier') {
    return (
      <div 
        className={`relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950 text-white p-3 sm:p-4 border border-emerald-900/60 shadow-md ${className}`}
        title={`Jam Operasional Kasir GreenMart: ${fullDateFormatted}`}
      >
        {/* Subtle radial glow background effect */}
        <div className="absolute top-0 right-0 w-20 h-20 rounded-full bg-emerald-500/10 blur-lg pointer-events-none"></div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
          
          {/* Date & Shift Info */}
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 shadow-inner">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider">
                  {dayName}
                </span>
                <span className="inline-block w-1 h-1 rounded-full bg-slate-500"></span>
                <span className="text-xs text-slate-300 font-medium">
                  {dateFormatted}
                </span>
              </div>
              <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                <span className="flex items-center gap-1 text-slate-300">
                  {currentHour >= 6 && currentHour < 18 ? (
                    <Sun className="w-3 h-3 text-amber-400" />
                  ) : (
                    <Moon className="w-3 h-3 text-sky-400" />
                  )}
                  <span>Waktu {timePeriod}</span>
                </span>
                {shiftLabel && (
                  <>
                    <span className="text-slate-600">•</span>
                    <span className="px-1.5 py-0.2 rounded-md bg-emerald-900/80 text-emerald-300 border border-emerald-700/60 font-semibold text-[10px]">
                      {shiftLabel}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Running Clock Digital Display */}
          <div className="flex items-center gap-2.5 bg-slate-950/70 border border-slate-800/90 px-3.5 py-2 rounded-xl backdrop-blur-xs self-start sm:self-auto">
            {/* Pulsing Live indicator */}
            <div className="flex flex-col items-center justify-center pr-1 border-r border-slate-800">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[9px] font-bold text-emerald-400 font-mono mt-0.5 tracking-tighter">LIVE</span>
            </div>

            {/* Time Digits */}
            <div className="flex items-baseline font-mono tracking-wider">
              <span className="text-xl sm:text-2xl font-black text-white tabular-nums">{hours}</span>
              <span className={`text-xl sm:text-2xl font-black transition-opacity duration-300 mx-0.5 ${tick ? 'opacity-100 text-emerald-400' : 'opacity-25 text-emerald-600'}`}>
                :
              </span>
              <span className="text-xl sm:text-2xl font-black text-white tabular-nums">{minutes}</span>
              <span className={`text-xl sm:text-2xl font-black transition-opacity duration-300 mx-0.5 ${tick ? 'opacity-100 text-emerald-400' : 'opacity-25 text-emerald-600'}`}>
                :
              </span>
              <span className="text-xl sm:text-2xl font-black text-emerald-400 tabular-nums w-[2ch] inline-block text-left">
                {seconds}
              </span>
            </div>

            {/* Timezone & Seconds Ring Progress */}
            <div className="flex flex-col items-center justify-center pl-1 border-l border-slate-800">
              <span className="text-[10px] font-extrabold text-slate-400 font-sans tracking-wide">
                {timezoneName}
              </span>
              <div 
                className="w-4 h-4 rounded-full border border-slate-700 flex items-center justify-center mt-0.5" 
                title={`Detik ke-${secondsNum}`}
              >
                <div 
                  className="w-2 h-2 rounded-full bg-emerald-400 transition-all duration-300"
                  style={{
                    opacity: 0.3 + (secondsNum / 60) * 0.7,
                    transform: `scale(${0.7 + (secondsNum % 2 === 0 ? 0.3 : 0)})`
                  }}
                />
              </div>
            </div>

          </div>

        </div>
      </div>
    );
  }

  // 4. Default: Navbar Variant (Sleek, integrated pill for header)
  return (
    <div 
      className={`hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100/90 dark:bg-slate-800/90 hover:bg-slate-200/80 dark:hover:bg-slate-700/80 border border-slate-200/80 dark:border-slate-700/80 text-slate-800 dark:text-slate-100 transition shadow-2xs ${className}`}
      title={`Jam Real-Time: ${dayName}, ${fullDateFormatted} ${hours}:${minutes}:${seconds} ${timezoneName}`}
    >
      {/* Live Blinking Dot & Clock Icon */}
      <div className="relative flex items-center justify-center">
        <Clock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
        <span className="absolute -top-1 -right-1 flex h-1.5 w-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
        </span>
      </div>

      {/* Date (short) */}
      {showDate && (
        <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 hidden xl:inline">
          {dayShort}, {dateFormatted}
        </span>
      )}

      {/* Separator */}
      {showDate && (
        <span className="text-slate-300 dark:text-slate-600 hidden xl:inline">•</span>
      )}

      {/* Time Display with Moving Seconds */}
      <div className="flex items-center font-mono font-bold text-xs sm:text-sm tracking-tight text-slate-900 dark:text-white">
        <span className="tabular-nums">{hours}</span>
        <span className={`mx-0.5 font-bold transition-opacity duration-300 ${tick ? 'opacity-100 text-emerald-600 dark:text-emerald-400' : 'opacity-25 text-emerald-600'}`}>
          :
        </span>
        <span className="tabular-nums">{minutes}</span>
        {showSeconds && (
          <>
            <span className={`mx-0.5 font-bold transition-opacity duration-300 ${tick ? 'opacity-100 text-emerald-600 dark:text-emerald-400' : 'opacity-25 text-emerald-600'}`}>
              :
            </span>
            <span className="text-emerald-600 dark:text-emerald-400 w-[18px] text-left font-black tabular-nums">
              {seconds}
            </span>
          </>
        )}
      </div>

      {/* Timezone Badge */}
      {showTimezone && (
        <span className="text-[10px] font-bold px-1 py-0.2 rounded bg-slate-200/80 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
          {timezoneName}
        </span>
      )}
    </div>
  );
};
