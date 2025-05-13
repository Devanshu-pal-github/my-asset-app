import React, { useState, useCallback, memo, useMemo, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import ChartCard from './ChartCard';
import { assetAcquisitionData } from '../mockData';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

/**
 * Asset Acquisition Trend Line Chart
 * Shows asset acquisition count and value over time
 * Optimized for large datasets with:
 * - Time-based data sampling
 * - Data windowing
 * - Performance optimizations
 */
const AssetAcquisitionChart = ({ onLoaded, dataLimit = 1000, data = assetAcquisitionData, timeWindow = '1y' }) => {
  const [showValue, setShowValue] = useState(false);
  const [selectedTimeWindow, setSelectedTimeWindow] = useState(timeWindow);

  // Notify parent component when loaded
  useEffect(() => {
    if (onLoaded) onLoaded('acquisitionChart');
  }, [onLoaded]);

  // Time window options
  const timeWindows = useMemo(() => [
    { label: '3M', value: '3m', months: 3 },
    { label: '6M', value: '6m', months: 6 },
    { label: '1Y', value: '1y', months: 12 },
    { label: '2Y', value: '2y', months: 24 },
    { label: 'All', value: 'all', months: null }
  ], []);

  // Process and prepare chart data with sampling for large datasets
  const processedData = useMemo(() => {
    // For large datasets, we need to apply sampling to maintain performance
    // Start by filtering based on selected time window
    let filteredData = [...data];
    
    // Apply time window filter
    if (selectedTimeWindow !== 'all') {
      const selectedWindow = timeWindows.find(w => w.value === selectedTimeWindow);
      if (selectedWindow && selectedWindow.months) {
        const cutoffDate = new Date();
        cutoffDate.setMonth(cutoffDate.getMonth() - selectedWindow.months);
        
        filteredData = filteredData.filter(item => {
          const dateParts = item.month.split('-');
          const itemDate = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1);
          return itemDate >= cutoffDate;
        });
      }
    }
    
    // If we still have too much data, apply sampling
    let sampledData = filteredData;
    if (filteredData.length > dataLimit) {
      // For time series, we want to ensure we keep the pattern
      // Use a step-based approach for systematic sampling
      const step = Math.max(1, Math.floor(filteredData.length / dataLimit));
      sampledData = [];
      
      // Always keep the first and last points for proper visualization
      if (filteredData.length > 0) sampledData.push(filteredData[0]);
      
      // Sample the middle points
      for (let i = step; i < filteredData.length - step; i += step) {
        sampledData.push(filteredData[i]);
      }
      
      // Add the last point
      if (filteredData.length > 1) {
        sampledData.push(filteredData[filteredData.length - 1]);
      }
    }
    
    // For line charts, ensure data is sorted chronologically
    sampledData.sort((a, b) => {
      const aDate = new Date(a.month.split('-')[0], a.month.split('-')[1] - 1);
      const bDate = new Date(b.month.split('-')[0], b.month.split('-')[1] - 1);
      return aDate - bDate;
    });
    
    // Format dates for better display
    const labels = sampledData.map(item => {
      const [year, month] = item.month.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1);
      return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    });
    
    // Prepare the datasets
    return {
      labels,
      datasets: [
        {
          label: showValue ? 'Asset Value' : 'Asset Count',
          data: sampledData.map(item => showValue ? item.value : item.count),
          borderColor: 'rgba(59, 130, 246, 1)',
          backgroundColor: 'rgba(59, 130, 246, 0.2)',
          borderWidth: 2,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: 'rgba(59, 130, 246, 1)',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: sampledData.length > 30 ? 0 : 4,
          pointHoverRadius: 6,
        },
      ],
    };
  }, [showValue, selectedTimeWindow, timeWindows, dataLimit, data]);

  // Chart options - memoized to prevent recreation on each render
  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 800,
    },
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        display: true,
        position: 'top',
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const value = context.raw;
            return showValue 
              ? `Value: $${value.toLocaleString()}` 
              : `Count: ${value}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          maxRotation: 45,
          minRotation: 45,
          font: {
            size: 10,
          },
          autoSkip: true,
          maxTicksLimit: 12, // Limit the number of ticks shown on x-axis
        },
      },
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: showValue ? 'Asset Value ($)' : 'Number of Assets'
        },
        ticks: {
          callback: function(value) {
            return showValue ? `$${value}` : value;
          }
        },
      },
    },
  }), [showValue]);

  // Calculate totals for the description
  const totals = useMemo(() => {
    const totalCount = data.reduce((sum, item) => sum + item.count, 0);
    const totalValue = data.reduce((sum, item) => sum + item.value, 0);
    return { count: totalCount, value: totalValue };
  }, [data]);

  // Handle toggle between count and value
  const handleToggleView = useCallback(() => setShowValue(prev => !prev), []);
  
  // Handle time window change
  const handleTimeWindowChange = useCallback((window) => {
    setSelectedTimeWindow(window);
  }, []);

  return (
    <ChartCard
      title="Asset Acquisition Trends"
      description={`Acquisitions over time. Total: ${totals.count.toLocaleString()} assets ($${totals.value.toLocaleString()})`}
      extraContent={
        <div className="flex justify-end">
          <div className="inline-flex rounded-md shadow-sm">
            <button
              type="button"
              className={`px-3 py-1 text-xs font-medium rounded-l-md ${
                !showValue 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
              onClick={handleToggleView}
            >
              Count
            </button>
            <button
              type="button"
              className={`px-3 py-1 text-xs font-medium rounded-r-md ${
                showValue 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
              onClick={handleToggleView}
            >
              Value
            </button>
          </div>
        </div>
      }
    >
      <div className="mb-4 flex flex-wrap justify-between items-center gap-2">
        {/* Time window selector */}
        <div className="flex space-x-1">
          {timeWindows.map(window => (
            <button
              key={window.value}
              className={`px-2 py-1 text-xs rounded-md font-medium ${
                selectedTimeWindow === window.value
                  ? 'bg-gray-700 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
              onClick={() => handleTimeWindowChange(window.value)}
            >
              {window.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart container with fixed height */}
      <div style={{ height: '280px', position: 'relative' }}>
        {processedData.labels.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center text-gray-500">
            No data available for the selected time period
          </div>
        ) : (
          <Line data={processedData} options={options} />
        )}
      </div>
      
      {data.length > dataLimit && (
        <div className="mt-3 text-xs text-gray-500 italic">
          Note: Data has been sampled for optimal visualization performance
        </div>
      )}
    </ChartCard>
  );
};

export default memo(AssetAcquisitionChart); 