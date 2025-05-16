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
 * Asset Age Distribution chart
 * Shows the distribution of assets by age using a doughnut chart
 * Displays percentage and count for each age range
 */
const AssetAgeChart = ({ onLoaded, dataLimit = 1000, data = assetAgeData }) => {
  // Notify parent when component is loaded
  React.useEffect(() => {
    if (onLoaded) onLoaded('ageChart');
  }, [onLoaded]);

  // Process data and handle undefined/null cases
  const processedData = useMemo(() => {
    if (!data || !Array.isArray(data) || data.length === 0) {
      return [];
    }
    return data;
  }, [data]);

  // Calculate total assets for percentages
  const totalAssets = useMemo(() => {
    if (processedData.length === 0) {
      return 0;
    }
    return processedData.reduce((sum, item) => sum + item.count, 0);
  }, [processedData]);

  // Calculate percentages for each age range
  const percentages = useMemo(() => {
    if (processedData.length === 0 || totalAssets === 0) {
      return [];
    }
    return processedData.map(item => ({
      ...item,
      percentage: ((item.count / totalAssets) * 100).toFixed(1)
    }));
  }, [processedData, totalAssets]);

  // Consistent color mapping for age ranges
  const colorMapping = {
    '< 1 year': { bg: 'rgba(52, 211, 153, 0.7)', border: 'rgba(52, 211, 153, 1)' }, // Green for newest
    '1-2 years': { bg: 'rgba(59, 130, 246, 0.7)', border: 'rgba(59, 130, 246, 1)' }, // Blue
    '2-3 years': { bg: 'rgba(139, 92, 246, 0.7)', border: 'rgba(139, 92, 246, 1)' }, // Purple
    '3-4 years': { bg: 'rgba(251, 191, 36, 0.7)', border: 'rgba(251, 191, 36, 1)' }, // Amber
    '4+ years': { bg: 'rgba(156, 163, 175, 0.7)', border: 'rgba(156, 163, 175, 1)' } // Gray for oldest
  };

  // Chart data
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
    
    const labels = processedData.map(item => item.range);
    const backgroundColors = [];
    const borderColors = [];
    
    // Ensure consistent colors for age ranges across application
    labels.forEach(range => {
      const colorInfo = colorMapping[range] || { 
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
  }, [processedData]);

  // Chart options
  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    cutout: '65%',
    plugins: {
      legend: {
        position: 'right',
        labels: {
          boxWidth: 15,
          padding: 15,
          generateLabels: (chart) => {
            if (!chart.data.datasets[0]?.data?.length) {
              return [];
            }
            
            const datasets = chart.data.datasets;
            return chart.data.labels.map((label, i) => {
              const value = datasets[0].data[i];
              const percentage = totalAssets ? ((value / totalAssets) * 100).toFixed(1) : '0.0';
              return {
                text: `${label} (${percentage}%)`,
                fillStyle: datasets[0].backgroundColor[i],
                strokeStyle: datasets[0].borderColor[i],
                lineWidth: 1,
                hidden: false,
                index: i
              };
            });
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        titleColor: '#1F2937',
        bodyColor: '#4B5563',
        borderColor: '#E5E7EB',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 6,
        callbacks: {
          label: (context) => {
            if (totalAssets === 0) return ['No assets available'];
            const value = context.raw;
            if (value === undefined || value === null) return ['No data available'];
            const percentage = ((value / totalAssets) * 100).toFixed(1);
            return [
              `Count: ${value.toLocaleString()} assets`,
              `Percentage: ${percentage}%`
            ];
          }
        }
      }
    }
  }), [totalAssets]);

  // Calculate approximate average age using midpoints of ranges
  const averageAge = useMemo(() => {
    if (processedData.length === 0 || totalAssets === 0) {
      return '0.0';
    }
    
    // Convert age ranges to approximate midpoints for calculation
    const ageRanges = {
      '< 1 year': 0.5,
      '1-2 years': 1.5,
      '2-3 years': 2.5,
      '3-4 years': 3.5,
      '4+ years': 5, // Approximate midpoint for 4+ years
    };
    
    let weightedSum = 0;
    processedData.forEach(item => {
      const midpoint = ageRanges[item.range] || 0;
      weightedSum += midpoint * item.count;
    });
    
    return (weightedSum / totalAssets).toFixed(1);
  }, [processedData, totalAssets]);

  return (
    <ChartCard 
      title="Asset Age Distribution" 
      description={`Distribution of assets by age with an average age of ${averageAge} years`}
    >
      <div style={{ height: '300px', position: 'relative' }}>
        <Doughnut data={chartData} options={options} />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
          <div className="text-3xl font-bold">{totalAssets.toLocaleString()}</div>
          <div className="text-sm text-gray-500">Total Assets</div>
        </div>
      </div>
      
      {/* Age distribution summary */}
      {percentages.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 mt-4 text-center text-xs">
          {percentages.map((item) => (
            <div 
              key={item.range} 
              className="flex flex-col items-center p-1 rounded-md"
              style={{ 
                backgroundColor: colorMapping[item.range]?.bg || 'rgba(107, 114, 128, 0.1)',
                color: '#1F2937'
              }}
            >
              <span className="font-semibold">{item.range}</span>
              <span>{item.percentage}%</span>
            </div>
          ))}
        </div>
      )}
    </ChartCard>
  );
};

export default memo(AssetAgeChart); 