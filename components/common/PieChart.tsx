import React from 'react';

interface PieChartProps {
  data: {
    label: string;
    value: number;
  }[];
  size: number;
  colorMap?: Record<string, string>;
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

const PieChart: React.FC<PieChartProps> = ({ data, size, colorMap }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  if (total === 0) return <div className="text-center text-muted-foreground">No data to display.</div>;

  const radius = size / 2.5;
  const cx = size / 2;
  const cy = size / 2;
  let startAngle = -90; // Start from the top

  const getCoordinatesForPercent = (percent: number) => {
    const x = cx + radius * Math.cos(2 * Math.PI * percent);
    const y = cy + radius * Math.sin(2 * Math.PI * percent);
    return [x, y];
  };

  const slices = data.map((item, index) => {
    const percent = item.value / total;
    const [startX, startY] = getCoordinatesForPercent(startAngle / 360);
    startAngle += percent * 360;
    const [endX, endY] = getCoordinatesForPercent(startAngle / 360);
    
    const largeArcFlag = percent > 0.5 ? 1 : 0;

    const pathData = [
      `M ${cx},${cy}`, // Move to center
      `L ${startX},${startY}`, // Line to start of arc
      `A ${radius},${radius} 0 ${largeArcFlag} 1 ${endX},${endY}`, // Arc
      'Z' // Close path
    ].join(' ');

    const color = colorMap?.[item.label] || COLORS[index % COLORS.length];
    return <path key={index} d={pathData} fill={color} />;
  });

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {slices}
      </svg>
      <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        {data.map((item, index) => (
          <div key={index} className="flex items-center">
            <div
              className="w-3 h-3 rounded-sm mr-2"
              style={{ backgroundColor: colorMap?.[item.label] || COLORS[index % COLORS.length] }}
            />
            <span className="text-foreground">{item.label}:</span>
            <span className="font-semibold ml-1.5">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PieChart;