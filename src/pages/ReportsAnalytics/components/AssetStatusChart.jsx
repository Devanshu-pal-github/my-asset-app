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
const AssetStatusChart = ({ data = assetStatusData, onLoaded, dataLimit }) => {
  // Notify parent when component is loaded
  React.useEffect(() => {
    if (onLoaded) onLoaded('statusChart');
  }, [onLoaded]);

  // Process data and handle undefined/null cases
  const processedData = useMemo(() => {
    if (!data || !Array.isArray(data) || data.length === 0) {
      return [];
    }
    return data;
  }, [data]);

  // Calculate total for percentage calculations
  const totalAssets = useMemo(() => {
    if (processedData.length === 0) {
      return 0;
    }
    return processedData.reduce((total, item) => total + item.count, 0);
  }, [processedData]);

  // Consistent color mapping for asset statuses
  const colorMapping = useMemo(() => ({
    'In Use': { bg: 'rgba(59, 130, 246, 0.7)', border: 'rgba(59, 130, 246, 1)' }, // Blue
    'Available': { bg: 'rgba(52, 211, 153, 0.7)', border: 'rgba(52, 211, 153, 1)' }, // Green
    'In Maintenance': { bg: 'rgba(251, 191, 36, 0.7)', border: 'rgba(251, 191, 36, 1)' }, // Yellow/Orange
    'Reserved': { bg: 'rgba(139, 92, 246, 0.7)', border: 'rgba(139, 92, 246, 1)' }, // Purple
    'End of Life': { bg: 'rgba(156, 163, 175, 0.7)', border: 'rgba(156, 163, 175, 1)' } // Gray
  }), []);

  // Prepare data for Chart.js - memoized to prevent recalculations
  const chartData = useMemo(() => {
    if (processedData.length === 0) {
      return {
        labels: [],
        datasets: [
          {
            data: [],
            backgroundColor: [],
            borderColor: [],
            borderWidth: 1
          }
        ]
      };
    }
    
    const labels = processedData.map(item => item.status);
    const backgroundColors = [];
    const borderColors = [];
    
    // Map colors based on status names for consistency
    labels.forEach(statusName => {
      const colorInfo = colorMapping[statusName] || { 
        bg: 'rgba(107, 114, 128, 0.7)', 
        border: 'rgba(107, 114, 128, 1)' 
      }; // Default gray
      backgroundColors.push(colorInfo.bg);
      borderColors.push(colorInfo.border);
    });
    
    return {
      labels,
      datasets: [
        {
          data: processedData.map(item => item.count),
          backgroundColor: backgroundColors,
          borderColor: borderColors,
          borderWidth: 1
        }
      ]
    };
  }, [processedData, colorMapping]);

  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          padding: 20,
          usePointStyle: true,
          pointStyle: 'circle'
        }
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            if (totalAssets === 0) return 'No data available';
            const value = context.raw;
            if (value === undefined || value === null) return '';
            const percentage = Math.round((value / totalAssets) * 100);
            return `${context.label}: ${value.toLocaleString()} assets (${percentage}%)`;
          }
        }
      }
    }
  }), [totalAssets]);

  return (
    <ChartCard 
      title="Asset Status Distribution" 
      description={`Current status of ${totalAssets.toLocaleString()} assets in the system`}
    >
      <div style={{ height: '300px' }}>
        <Pie data={chartData} options={options} />
      </div>
    </ChartCard>
  );
};

export default memo(AssetStatusChart); 