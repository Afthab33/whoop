import React from 'react';
import { Info } from 'lucide-react';

const StrainRecoveryChart = () => {
  const data = {
    dates: ['Sat 12', 'Sun 13', 'Mon 14', 'Tue 15', 'Wed 16', 'Thu 17', 'Fri 18'],
    strain: [4.1, 11.0, 7.7, 7.9, 9.1, 8.3, 7.2],
    recovery: [87, 85, 67, 77, 87, 79, 82],
  };

  const maxStrain = 21;
  const maxRecovery = 100;

  return (
    <div className="whoops-card w-full max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="section-header text-text-primary">STRAIN & RECOVERY</h2>
        <Info className="text-text-muted" size={20} />
      </div>

      <div className="flex text-text-primary relative mb-4">
        <div className="flex flex-col justify-between h-[180px] text-strain-blue pr-2 text-xs font-medium">
          <div>21</div>
          <div>14</div>
          <div>7</div>
          <div>0</div>
        </div>

        <div className="flex-1 relative h-[180px]">
          <div className="absolute w-full h-full">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="absolute w-full border-t border-white/10"
                style={{ top: `${(i / 3) * 100}%` }}
              ></div>
            ))}
          </div>

          <div className="absolute inset-0 flex">
            {data.dates.map((_, i) => (
              <div
                key={i}
                className={`flex-1 ${i === 6 ? 'bg-white/10 rounded-md' : ''}`}
              ></div>
            ))}
          </div>

          <svg className="absolute inset-0 w-full h-full">
            <polyline
              fill="none"
              stroke="var(--strain-blue)"
              strokeWidth="2"
              strokeOpacity="0.8"
              points={data.strain.map((val, i) => {
                const x = (i / (data.dates.length - 1)) * 100;
                const y = 100 - (val / maxStrain) * 100;
                return `${x}%,${y}%`;
              }).join(' ')}
            />
          </svg>

          <svg className="absolute inset-0 w-full h-full">
            <polyline
              fill="none"
              stroke="var(--recovery-green)"
              strokeWidth="2"
              strokeOpacity="0.8"
              points={data.recovery.map((val, i) => {
                const x = (i / (data.dates.length - 1)) * 100;
                const y = 100 - (val / maxRecovery) * 100;
                return `${x}%,${y}%`;
              }).join(' ')}
            />
          </svg>

          {data.dates.map((_, i) => {
            const strainY = 100 - (data.strain[i] / maxStrain) * 100;
            const recoveryY = 100 - (data.recovery[i] / maxRecovery) * 100;
            const x = (i / (data.dates.length - 1)) * 100;
            return (
              <React.Fragment key={i}>
                <div className="absolute" style={{ left: `${x}%`, top: `${recoveryY}%`, transform: 'translate(-50%, -100%)' }}>
                  <div className="flex flex-col items-center">
                    <div className="text-xs font-bold text-recovery-green">{data.recovery[i]}%</div>
                    <div className="w-2.5 h-2.5 bg-recovery-green rounded-full mt-0.5 border border-black"></div>
                  </div>
                </div>

                <div className="absolute" style={{ left: `${x}%`, top: `${strainY}%`, transform: 'translate(-50%, -100%)' }}>
                  <div className="flex flex-col items-center">
                    <div className="text-xs font-bold text-strain-blue">{data.strain[i]}</div>
                    <div className="w-2.5 h-2.5 bg-strain-blue rounded-full mt-0.5 border border-black"></div>
                  </div>
                </div>
              </React.Fragment>
            );
          })}

          <div className="absolute w-full top-full pt-2 flex justify-between text-xs text-text-muted">
            {data.dates.map((date, i) => (
              <div key={i} className="text-center" style={{ width: `${100 / data.dates.length}%` }}>{date}</div>
            ))}
          </div>
        </div>

        <div className="flex flex-col justify-between h-[180px] pl-2 text-xs font-medium">
          <div className="text-recovery-green">100%</div>
          <div className="text-stress-yellow">66%</div>
          <div className="text-alert-red">33%</div>
          <div className="text-text-muted">0%</div>
        </div>
      </div>
    </div>
  );
};

export default StrainRecoveryChart;
