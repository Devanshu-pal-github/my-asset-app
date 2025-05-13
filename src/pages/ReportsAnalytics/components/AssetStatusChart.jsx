import React, { memo, useMemo } from 'react';
import { Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';
import ChartCard from './ChartCard';
import { assetStatusData } from '../mockData';

// Register ChartJS components
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend
);

/**
 * Asset Status Distribution chart
 * Shows current status of all assets in the system using a pie chart
 */
const AssetStatusChart = () => {
  // Calculate total for percentage calculations
  const totalAssets = useMemo(() => 
    assetStatusData.reduce((total, item) => total + item.count, 0),
    []
  );

  // Prepare data for Chart.js - memoized to prevent recalculations
  const chartData = useMemo(() => ({
    labels: assetStatusData.map(item => item.status),
    datasets: [
      {
        data: assetStatusData.map(item => item.count),
        backgroundColor: [
          'rgba(52, 211, 153, 0.7)', // Green for Available
          'rgba(59, 130, 246, 0.7)', // Blue for Assigned
          'rgba(251, 191, 36, 0.7)', // Yellow for Under Maintenance
          'rgba(156, 163, 175, 0.7)', // Gray for Retired
          'rgba(239, 68, 68, 0.7)'  // Red for Lost/Stolen
        ],
        borderColor: [
          'rgba(52, 211, 153, 1)',
          'rgba(59, 130, 246, 1)',
          'rgba(251, 191, 36, 1)',
          'rgba(156, 163, 175, 1)', 
          'rgba(239, 68, 68, 1)'
        ],
        borderWidth: 1
      }
    ]
  }), []);

  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const value = context.raw;
            const percentage = Math.round((value / totalAssets) * 100);
            return `${context.label}: ${value} (${percentage}%)`;
          }
        }
      }
    }
  }), [totalAssets]);

  return (
    <ChartCard 
      title="Asset Status Distribution" 
      description="Current status of all assets in the system"
    >
      <div style={{ height: '300px' }}>
        <Pie data={chartData} options={options} />
      </div>
    </ChartCard>
  );
};

export default memo(AssetStatusChart); 