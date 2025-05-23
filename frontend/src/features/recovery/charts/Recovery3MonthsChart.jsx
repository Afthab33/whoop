import React, { useMemo } from 'react';
import { format, subMonths, addDays, isSameDay, startOfDay } from 'date-fns';
import whoopData from '../../../data/day_wise_whoop_data.json';
import TimePeriodSelector from '../../../components/charts/TimePeriodSelector';

// --- Utility Functions ---
const getRecoveryColor = (score) => {
  if (score >= 67) return '#70E000';
  if (score >= 34) return '#FFE86A';
  return '#FF6370';
};

const getZone = (score) => {
  if (score >= 67) return 'green';
  if (score >= 34) return 'yellow';
  return 'red';
};

const yAxisLabels = [
  { value: 100, label: '100%', color: '#70E000' },
  { value: 83, label: '83%', color: '#70E000' },
  { value: 67, label: '67%', color: '#70E000' },
  { value: 50, label: '50%', color: '#FFE86A' },
  { value: 33, label: '33%', color: '#FF6370' },
  { value: 17, label: '17%', color: '#FF6370' },
  { value: 0, label: '0%', color: '#FF6370' }
];

// --- Main Chart Component ---
const Recovery3MonthsChart = ({
  selectedDate = new Date(),
  timePeriod = '3m',
  onTimePeriodChange = () => {}
}) => {
  // --- Data Preparation ---
  const monthsToShow = timePeriod === '6m' ? 6 : 3;

  const chartData = useMemo(() => {
    const endDate = startOfDay(selectedDate);
    const startDate = subMonths(endDate, monthsToShow);
    const days = Math.round((endDate - startDate) / (1000 * 60 * 60 * 24));
    const data = [];

    for (let i = 0; i <= days; i++) {
      const date = addDays(startDate, i);
      const dateStr = format(date, 'yyyy-MM-dd');
      const whoop = whoopData[dateStr]?.physiological_summary;

      // Use real data if available, else fallback to demo
      let score = whoop?.['Recovery score'];
      if (typeof score !== 'number') {
        // Demo: weekly pattern, slight upward trend
        const dayOfWeek = format(date, 'E');
        let base = Math.floor(Math.random() * 50) + 30;
        if (dayOfWeek === 'Sat' || dayOfWeek === 'Sun') base -= 10;
        if (dayOfWeek === 'Wed' || dayOfWeek === 'Thu') base += 10;
        base += (i / days) * 10 - 5;
        score = Math.max(10, Math.min(98, Math.round(base)));
      }

      data.push({
        date,
        dateStr,
        score,
        color: getRecoveryColor(score),
        zone: getZone(score),
        isToday: isSameDay(date, new Date()),
        isSunday: format(date, 'EEEE') === 'Sunday',
        isFirstOfMonth: format(date, 'd') === '1'
      });
    }
    return data;
  }, [selectedDate, monthsToShow]);

  // --- X-Axis Label Logic ---
  const xLabels = useMemo(() => {
    // Show Sundays, 1st of month, and today
    return chartData
      .map((d, i) => {
        if (
          d.isSunday ||
          d.isFirstOfMonth ||
          d.isToday ||
          i === 0 ||
          i === chartData.length - 1
        ) {
          return {
            index: i,
            label: `${format(d.date, 'MMM d')}${d.isToday ? ' (Today)' : ''}`
          };
        }
        return null;
      })
      .filter(Boolean);
  }, [chartData]);

  // --- SVG Helpers ---
  const getX = (i) => (i / (chartData.length - 1)) * 100;
  const getY = (score) => 100 - score;

  // --- UI ---
  return (
    <section className="bg-[var(--card-bg)] rounded-xl shadow-lg border border-gray-800/20 p-6 h-full flex flex-col">
      {/* Header */}
      <header className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-lg font-bold text-[var(--text-primary)]">
            {monthsToShow} Month{monthsToShow > 1 ? 's' : ''} Recovery Score
          </h2>
          <p className="text-[var(--text-secondary)] text-sm mt-1">Aftab Hussain</p>
        </div>
        <TimePeriodSelector
          selectedPeriod={timePeriod}
          onPeriodChange={onTimePeriodChange}
        />
      </header>

      {/* Chart */}
      <div className="relative flex-1 min-h-[320px]">
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 bottom-8 flex flex-col justify-between z-10">
          {yAxisLabels.map((item) => (
            <span
              key={item.value}
              className="text-xs font-medium"
              style={{ color: item.color, opacity: 0.85 }}
            >
              {item.label}
            </span>
          ))}
        </div>

        {/* Chart grid and SVG */}
        <div className="ml-12 h-full relative">
          {/* Grid lines */}
          {yAxisLabels.map((item) => (
            <div
              key={item.value}
              className="absolute left-0 right-0 border-b border-gray-700/10"
              style={{
                bottom: `calc(${item.value}% - 1px)`,
                zIndex: 1
              }}
            />
          ))}

          {/* SVG Chart */}
          <svg
            className="absolute inset-0 w-full h-full"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            {/* Area gradient */}
            <defs>
              <linearGradient id="recoveryArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#70E000" stopOpacity="0.12" />
                <stop offset="60%" stopColor="#FFE86A" stopOpacity="0.08" />
                <stop offset="100%" stopColor="#FF6370" stopOpacity="0.06" />
              </linearGradient>
            </defs>
            {/* Area under curve */}
            <polygon
              points={
                chartData
                  .map((d, i) => `${getX(i)},${getY(d.score)}`)
                  .join(' ') +
                ` 100,100 0,100`
              }
              fill="url(#recoveryArea)"
              opacity="0.6"
            />
            {/* Line - made thinner and more elegant */}
            <polyline
              points={chartData.map((d, i) => `${getX(i)},${getY(d.score)}`).join(' ')}
              fill="none"
              stroke="#ffffff"
              strokeWidth="0.4"
              style={{ 
                filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.15))',
                opacity: 0.9
              }}
            />
            {/* Dots - made more aesthetic with glow effect */}
            {chartData.map((d, i) => {
              // Only show dots for Sundays, 1st of month, and today for clarity
              if (d.isSunday || d.isFirstOfMonth || d.isToday) {
                return (
                  <g key={i}>
                    {/* Outer glow */}
                    <circle
                      cx={getX(i)}
                      cy={getY(d.score)}
                      r={d.isToday ? 2.5 : 2}
                      fill={d.color}
                      opacity="0.3"
                    />
                    {/* Main dot */}
                    <circle
                      cx={getX(i)}
                      cy={getY(d.score)}
                      r={d.isToday ? 1.5 : 1.2}
                      fill={d.isToday ? "#ffffff" : d.color}
                      stroke={d.isToday ? d.color : "#ffffff"}
                      strokeWidth="0.4"
                      style={{ 
                        filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.2))'
                      }}
                    />
                    {/* Inner highlight for today */}
                    {d.isToday && (
                      <circle
                        cx={getX(i)}
                        cy={getY(d.score)}
                        r={0.6}
                        fill={d.color}
                        opacity="0.8"
                      />
                    )}
                  </g>
                );
              }
              return null;
            })}
          </svg>

          {/* X-axis labels */}
          <div className="absolute left-0 right-0 bottom-[-28px] flex justify-between text-xs text-gray-400 pointer-events-none select-none">
            {xLabels.map(({ index, label }) => (
              <div
                key={index}
                className="absolute text-center"
                style={{
                  left: `calc(${getX(index)}% - 18px)`,
                  width: 36
                }}
              >
                <span className={chartData[index].isToday ? 'text-blue-400 font-semibold' : ''}>
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Recovery3MonthsChart;