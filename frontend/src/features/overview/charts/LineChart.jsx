import React from 'react';
import { 
  ResponsiveContainer, 
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts';
import whoopData from '../../../data/day_wise_whoop_data.json';

const LineChart = ({ selectedPeriod = '1w' }) => {
  // Process real WHOOP data
  const processWhoopData = (period) => {
    const dates = Object.keys(whoopData).sort().reverse();
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    let daysToShow;
    switch (period) {
      case '1w': daysToShow = 7; break;
      case '2w': daysToShow = 14; break;
      case '1m': daysToShow = 30; break;
      case '3m': daysToShow = 90; break;
      case '6m': daysToShow = 180; break;
      default: daysToShow = 7;
    }
    
    const processedData = [];
    let count = 0;
    
    for (const dateStr of dates) {
      if (count >= daysToShow) break;
      
      const dayData = whoopData[dateStr];
      const physSummary = dayData?.physiological_summary;
      
      if (physSummary && 
          physSummary['Day Strain'] !== null && 
          physSummary['Recovery score %'] !== null) {
        
        const date = new Date(dateStr);
        const dayName = dayNames[date.getDay()];
        const monthName = monthNames[date.getMonth()];
        const dayOfMonth = date.getDate();
        
        processedData.unshift({
          day: dayName,
          date: `${monthName} ${dayOfMonth}`,
          strain: Number(physSummary['Day Strain']),
          recovery: Number(physSummary['Recovery score %'])
        });
        
        count++;
      }
    }
    
    return processedData;
  };

  const chartData = processWhoopData(selectedPeriod);

  // Helper functions
  const getRecoveryColor = (value) => {
    if (value >= 67) return "#22c55e";
    if (value >= 34) return "#eab308";
    return "#ef4444";
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload;
      return (
        <div className="bg-black/90 border border-white/20 rounded-lg p-3 text-white text-sm shadow-lg">
          <div className="font-bold mb-2">
            {`${dataPoint.day}, ${dataPoint.date}`}
          </div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span>Strain: {dataPoint.strain.toFixed(1)}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full`} style={{ backgroundColor: getRecoveryColor(dataPoint.recovery) }}></div>
            <span>Recovery: {dataPoint.recovery}%</span>
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom strain dots
  const StrainDot = (props) => {
    const { cx, cy } = props;
    if (selectedPeriod === '3m' || selectedPeriod === '6m') return null;
    
    return (
      <circle
        cx={cx}
        cy={cy}
        r={4}
        fill="#3b82f6"
        stroke="white"
        strokeWidth={2}
      />
    );
  };

  // Custom recovery dots
  const RecoveryDot = (props) => {
    const { cx, cy, payload } = props;
    if (!payload || selectedPeriod === '3m' || selectedPeriod === '6m') return null;
    
    return (
      <g>
        <circle
          cx={cx}
          cy={cy}
          r={4}
          fill={getRecoveryColor(payload.recovery)}
          stroke="white"
          strokeWidth={2}
        />
        <text
          x={cx}
          y={cy - 12}
          textAnchor="middle"
          className="text-xs font-semibold"
          fill={getRecoveryColor(payload.recovery)}
        >
          {payload.recovery}%
        </text>
      </g>
    );
  };

  // Custom Y-axis ticks
  const StrainAxisTick = (props) => {
    const { x, y, payload } = props;
    const strainValues = [0, 6, 10, 12, 14, 16, 21];
    if (!strainValues.includes(payload.value)) return null;
    
    return (
      <text
        x={x - 5}
        y={y + 4}
        textAnchor="end"
        className="text-xs font-semibold"
        fill="#3b82f6"
      >
        {payload.value.toFixed(1)}
      </text>
    );
  };

  const RecoveryAxisTick = (props) => {
    const { x, y, payload } = props;
    const recoveryValues = [0, 17, 33, 50, 67, 83, 100];
    if (!recoveryValues.includes(payload.value)) return null;
    
    return (
      <text
        x={x + 5}
        y={y + 4}
        textAnchor="start"
        className="text-xs font-semibold"
        fill={getRecoveryColor(payload.value)}
      >
        {payload.value}%
      </text>
    );
  };

  // Custom X-axis tick
  const CustomXAxisTick = (props) => {
    const { x, y, payload, index } = props;
    if (!chartData || !chartData[index]) return null;
    
    const dataPoint = chartData[index];
    
    return (
      <g transform={`translate(${x},${y})`}>
        <text 
          x={0} 
          y={0} 
          dy={16} 
          textAnchor="middle" 
          className="text-xs font-semibold"
          fill="var(--text-primary)"
        >
          {dataPoint.day}
        </text>
        <text 
          x={0} 
          y={0} 
          dy={32} 
          textAnchor="middle" 
          className="text-xs"
          fill="var(--text-muted)"
        >
          {dataPoint.date}
        </text>
      </g>
    );
  };

  // No data state
  if (!chartData || chartData.length === 0) {
    return (
      <div className="whoops-card" style={{ background: 'var(--card-bg)' }}>
        <div className="p-6 text-center">
          <h3 className="text-xl font-bold text-white mb-2">No Data Available</h3>
          <p className="text-gray-400">No strain and recovery data found for the selected period</p>
        </div>
      </div>
    );
  }

  return (
    <div className="whoops-card" style={{
      background: 'var(--card-bg)',
      boxShadow: '0 12px 40px rgba(0, 0, 0, 0.4), 0 4px 12px rgba(0, 0, 0, 0.2)',
      border: '1px solid rgba(255, 255, 255, 0.05)'
    }}>
      <div className="p-6">
        {/* Title */}
        <div className="mb-6">
          <h3 className="metric-title text-[var(--text-primary)] mb-1">Strain & Recovery Analysis</h3>
          <p className="baseline-value">
            {selectedPeriod === '1w' ? 'Weekly' : 
             selectedPeriod === '2w' ? 'Bi-weekly' :
             selectedPeriod === '1m' ? 'Monthly' :
             selectedPeriod === '3m' ? '3-month' :
             selectedPeriod === '6m' ? '6-month' : 'Weekly'} performance • {chartData.length} days
          </p>
        </div>

        {/* Legends */}
        <div className="flex justify-between mb-6">
          {/* Strain Legend */}
          <div>
            <div className="mb-3">
              <div className="flex items-center gap-2 text-[var(--text-primary)] font-semibold mb-1">
                <div className="w-3 h-0.5 bg-blue-500"></div>
                Day Strain
              </div>
              <div className="text-xs text-[var(--text-muted)] ml-5">Training intensity score</div>
            </div>
            <div className="flex gap-1">
              {[
                { color: '#93c5fd', range: '0-9.9' },
                { color: '#3b82f6', range: '10-13.9' },
                { color: '#2563eb', range: '14-17.9' },
                { color: '#1e40af', range: '18+' }
              ].map((item, i) => (
                <div key={i} className="text-center">
                  <div 
                    className="w-8 h-4 mb-1" 
                    style={{ backgroundColor: item.color }}
                  ></div>
                  <div className="text-xs font-medium" style={{ color: item.color }}>
                    {item.range}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recovery Legend */}
          <div>
            <div className="mb-3">
              <div className="flex items-center gap-2 text-[var(--text-primary)] font-semibold mb-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                Recovery
              </div>
              <div className="text-xs text-[var(--text-muted)] ml-4">Readiness percentage</div>
            </div>
            <div className="flex gap-1">
              {[
                { color: '#ef4444', range: '0-33%' },
                { color: '#eab308', range: '34-66%' },
                { color: '#22c55e', range: '67-100%' }
              ].map((item, i) => (
                <div key={i} className="text-center">
                  <div 
                    className="w-8 h-4 mb-1" 
                    style={{ backgroundColor: item.color }}
                  ></div>
                  <div className="text-xs font-medium" style={{ color: item.color }}>
                    {item.range}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Chart - Direct placement without inner card */}
        <div className="h-96 mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={chartData}
              margin={{ top: 40, right: 70, left: 70, bottom: 60 }}
            >
              <defs>
                <linearGradient id="strainGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.05" />
                </linearGradient>
              </defs>

              {/* Grid */}
              <CartesianGrid 
                strokeDasharray="none"
                vertical={false}
                stroke="rgba(255, 255, 255, 0.1)"
                strokeWidth={1}
              />

              {/* X Axis */}
              <XAxis 
                dataKey="day"
                tick={<CustomXAxisTick />}
                axisLine={false}
                tickLine={false}
                height={60}
              />

              {/* Left Y Axis - Strain */}
              <YAxis 
                yAxisId="strain"
                domain={[0, 21]}
                ticks={[0, 6, 10, 12, 14, 16, 21]}
                tick={<StrainAxisTick />}
                axisLine={false}
                tickLine={false}
                width={60}
              />

              {/* Right Y Axis - Recovery */}
              <YAxis 
                yAxisId="recovery"
                orientation="right"
                domain={[0, 100]}
                ticks={[0, 17, 33, 50, 67, 83, 100]}
                tick={<RecoveryAxisTick />}
                axisLine={false}
                tickLine={false}
                width={60}
              />

              <Tooltip content={<CustomTooltip />} />

              {/* Strain area under the line */}
              <Area
                yAxisId="strain"
                type="monotone"
                dataKey="strain"
                stroke="none"
                fill="url(#strainGradient)"
              />

              {/* Strain line */}
              <Line 
                yAxisId="strain"
                type="monotone" 
                dataKey="strain" 
                stroke="#3b82f6" 
                strokeWidth={3}
                dot={<StrainDot />}
                activeDot={{ r: 6, fill: '#3b82f6', stroke: 'white', strokeWidth: 2 }}
              />

              {/* Recovery connecting line */}
              <Line 
                yAxisId="recovery"
                type="monotone" 
                dataKey="recovery" 
                stroke="rgba(156, 163, 175, 0.6)"
                strokeWidth={2}
                dot={false}
                activeDot={false}
              />

              {/* Recovery dots with labels */}
              <Line 
                yAxisId="recovery"
                type="monotone" 
                dataKey="recovery" 
                stroke="transparent"
                strokeWidth={0}
                dot={<RecoveryDot />}
                activeDot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default LineChart;