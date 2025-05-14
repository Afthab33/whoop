import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer
} from 'recharts';
import { Moon, ChevronRight } from 'lucide-react';

const stressData = [
  { time: '11:01 PM', value: 0.5 },
  { time: '11:05 PM', value: 1.5 },
  { time: '11:10 PM', value: 1.1 },
  { time: '11:15 PM', value: 1.0 },
  { time: '11:25 PM', value: 0.7 },
  { time: '11:35 PM', value: 0.5 },
  { time: '11:45 PM', value: 0.45 },
  { time: '12:00 AM', value: 0.4 },
  { time: '12:15 AM', value: 0.42 },
  { time: '12:30 AM', value: 0.39 },
  { time: '12:45 AM', value: 0.45 },
  { time: '1:00 AM', value: 0.4 },
  { time: '1:15 AM', value: 0.37 },
  { time: '1:30 AM', value: 0.4 },
  { time: '1:45 AM', value: 0.43 },
  { time: '2:00 AM', value: 0.4 },
  { time: '2:15 AM', value: 0.38 },
  { time: '2:30 AM', value: 0.42 },
  { time: '2:45 AM', value: 0.7 },
  { time: '3:00 AM', value: 0.4 },
  { time: '3:15 AM', value: 0.35 },
  { time: '3:30 AM', value: 0.38 },
  { time: '3:45 AM', value: 0.4 },
  { time: '4:00 AM', value: 0.38 },
  { time: '4:15 AM', value: 0.36 },
  { time: '4:30 AM', value: 0.34 },
  { time: '4:45 AM', value: 0.33 },
  { time: '5:00 AM', value: 0.32 },
  { time: '5:15 AM', value: 0.33 },
  { time: '5:30 AM', value: 0.34 },
  { time: '5:45 AM', value: 0.35 },
  { time: '6:00 AM', value: 0.33 },
  { time: '6:15 AM', value: 0.34 },
  { time: '6:30 AM', value: 0.35 },
  { time: '6:45 AM', value: 0.36 },
  { time: '7:00 AM', value: 1.2 },
  { time: '7:15 AM', value: 0.4 },
  { time: '7:30 AM', value: 0.36 },
  { time: '7:45 AM', value: 0.33 },
  { time: '8:00 AM', value: 0.34 },
  { time: '8:15 AM', value: 0.35 },
  { time: '8:30 AM', value: 0.36 },
  { time: '8:45 AM', value: 0.33 },
  { time: '9:00 AM', value: 0.8 },
  { time: '9:15 AM', value: 1.0 },
  { time: '9:30 AM', value: 0.9 },
  { time: '9:40 AM', value: 1.0 },
  { time: '9:50 AM', value: 1.1 },
  { time: '10:00 AM', value: 1.3 },
  { time: '10:10 AM', value: 1.4 },
  { time: '10:20 AM', value: 1.2 },
  { time: '10:30 AM', value: 1.0 },
  { time: '10:40 AM', value: 0.8 },
  { time: '10:50 AM', value: 0.5 },
  { time: '10:59 AM', value: 0.2 },
];

const StressMonitorChart = () => {
  return (
    <div className="w-full h-full bg-[#2F353A] rounded-2xl overflow-hidden p-5">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-white text-lg font-bold tracking-wider uppercase">Stress Monitor</h2>
        <ChevronRight size={22} className="text-gray-400" />
      </div>
      <div className="mb-3">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-400">Last updated 10:59 AM</span>
          <div className="flex items-center gap-2">
            <span className="text-lg text-[#5D8DEE] font-medium">LOW</span>
            <span className="text-4xl font-bold text-white">0.2</span>
          </div>
        </div>
        <div className="flex justify-start mt-3 mb-2">
          <div className="bg-[#353a3e] rounded-full p-2">
            <Moon size={20} className="text-white" />
          </div>
        </div>
      </div>
      <div className="h-48 relative">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={stressData}
            margin={{ top: 15, right: 10, left: -20, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#3F4A50" />
            <XAxis
              dataKey="time"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#9CA3AF', fontSize: 10 }}
              interval="preserveStartEnd"
              ticks={["11:01 PM", "3:00 AM", "7:00 AM", "10:59 AM"]}
            />
            <YAxis
              domain={[0, 3]}
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#9CA3AF', fontSize: 10 }}
              ticks={[0, 1, 2, 3]}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#4ECDC4"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default StressMonitorChart;
