import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { CriteriaKey, CRITERIA_LABELS, RadarDataPoint } from '../types';

interface Props {
  averageScores: Record<CriteriaKey, number>;
}

export const StatsRadar: React.FC<Props> = ({ averageScores }) => {
  const data: RadarDataPoint[] = (Object.keys(CRITERIA_LABELS) as CriteriaKey[]).map(key => ({
    subject: CRITERIA_LABELS[key],
    A: averageScores[key],
    fullMark: 10,
  }));

  // Calculate overall health color based on average
  const total = (Object.values(averageScores) as number[]).reduce((a, b) => a + b, 0);
  const avg = total / 5;
  
  let strokeColor = "#6366f1"; // Indigo
  let fillColor = "#6366f1";

  if (avg >= 8) {
    strokeColor = "#22c55e"; // Green
    fillColor = "#22c55e";
  } else if (avg <= 5) {
    strokeColor = "#ef4444"; // Red
    fillColor = "#ef4444";
  }

  return (
    <div className="w-full h-[350px] relative">
      <ResponsiveContainer width="100%" height="100%">
        {/* Reduced outerRadius from 80% to 65% to fix label truncation for long Chinese text */}
        <RadarChart cx="50%" cy="50%" outerRadius="65%" data={data}>
          <PolarGrid stroke="#334155" />
          <PolarAngleAxis 
            dataKey="subject" 
            tick={{ fill: '#94a3b8', fontSize: 13, fontWeight: 700 }} 
          />
          <PolarRadiusAxis angle={30} domain={[0, 10]} tick={false} axisLine={false} />
          <Radar
            name="Skills"
            dataKey="A"
            stroke={strokeColor}
            strokeWidth={3}
            fill={fillColor}
            fillOpacity={0.4}
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f1f5f9' }}
            itemStyle={{ color: '#f1f5f9' }}
          />
        </RadarChart>
      </ResponsiveContainer>
      
      {/* Score Center Display */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
        <div className="text-2xl font-black text-white/80 drop-shadow-md">
          {avg.toFixed(1)}
        </div>
      </div>
    </div>
  );
};