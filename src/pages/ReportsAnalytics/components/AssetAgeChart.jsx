import React, { memo, useMemo } from 'react';
import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';
import ChartCard from './ChartCard';
import { assetAgeData } from '../mockData';

// Register ChartJS components
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend
);

/**
 * Asset Age Distribution doughnut chart
 * Shows age breakdown of all assets in the system
 */
const AssetAgeChart = () => {
  // Calculate total assets
  const totalAssets = useMemo(() => 
    assetAgeData.reduce((sum, item) => sum + item.count, 0),
    []
  );

  // Calculate percentages for each age group
  const dataWithPercentages = useMemo(() => 
    assetAgeData.map(item => ({
      ...item,
      percentage: Math.round((item.count / totalAssets) * 100)
    })),
    [totalAssets]
  );

  // Prepare data for Chart.js
  const chartData = useMemo(() => ({
    labels: dataWithPercentages.map(item => item.range),
    datasets: [
      {
        data: dataWithPercentages.map(item => item.count),
        backgroundColor: [
          'rgba(34, 197, 94, 0.7)',  // Green for < 1 year
          'rgba(59, 130, 246, 0.7)', // Blue for 1-2 years
          'rgba(234, 179, 8, 0.7)',  // Yellow for 2-3 years
          'rgba(249, 115, 22, 0.7)', // Orange for 3-4 years
          'rgba(239, 68, 68, 0.7)'   // Red for 4+ years
        ],
        borderColor: [
          'rgba(34, 197, 94, 1)',
          'rgba(59, 130, 246, 1)',
          'rgba(234, 179, 8, 1)',
          'rgba(249, 115, 22, 1)',
          'rgba(239, 68, 68, 1)'
        ],
        borderWidth: 1,
        hoverOffset: 5
      }
    ]
  }), [dataWithPercentages]);

  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    cutout: '65%',
    plugins: {
      legend: {
        position: 'right',
        labels: {
          boxWidth: 15,
          padding: 15
        }
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.label || '';
            const value = context.raw || 0;
            const percentage = dataWithPercentages[context.dataIndex].percentage;
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      }
    }
  }), [dataWithPercentages]);

  return (
    <ChartCard 
      title="Asset Age Distribution" 
      description="Age breakdown of all assets in the system"
    >
      <div style={{ height: '300px' }} className="relative flex items-center">
        <Doughnut data={chartData} options={options} />
        <div className="absolute inset-0 flex items-center justify-center flex-col">
          <span className="text-3xl font-bold text-gray-700">{totalAssets}</span>
          <span className="text-sm text-gray-500">Total Assets</span>
        </div>
      </div>
    </ChartCard>
  );
};

export default memo(AssetAgeChart); 