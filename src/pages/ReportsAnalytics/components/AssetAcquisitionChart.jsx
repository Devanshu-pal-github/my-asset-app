import React, { useState, useCallback, memo, useMemo } from 'react';
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
  Filler
} from 'chart.js';
import ChartCard from './ChartCard';
import { assetAcquisitionData } from '../mockData';

// Register ChartJS components
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
 * Asset Acquisition Trends chart
 * Shows monthly asset acquisition over the past year
 */
const AssetAcquisitionChart = () => {
  const [dataView, setDataView] = useState('count'); // 'count' or 'value'

  // Memoize toggle handlers to prevent unnecessary re-renders
  const handleToggleCount = useCallback(() => setDataView('count'), []);
  const handleToggleValue = useCallback(() => setDataView('value'), []);

  // Prepare data for Chart.js - memoized based on dataView
  const chartData = useMemo(() => ({
    labels: assetAcquisitionData.map(item => item.month),
    datasets: [
      {
        label: dataView === 'count' ? 'Number of Assets' : 'Asset Value ($)',
        data: assetAcquisitionData.map(item => dataView === 'count' ? item.count : item.value),
        fill: true,
        backgroundColor: 'rgba(37, 99, 235, 0.1)',
        borderColor: 'rgba(37, 99, 235, 1)',
        tension: 0.4,
        pointBackgroundColor: 'rgba(37, 99, 235, 1)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6
      }
    ]
  }), [dataView]);

  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            if (dataView === 'count') {
              return `Assets: ${context.raw}`;
            } else {
              return `Value: $${context.raw.toLocaleString()}`;
            }
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: dataView === 'count' ? 'Number of Assets' : 'Asset Value ($)'
        }
      }
    }
  }), [dataView]);

  return (
    <ChartCard 
      title="Asset Acquisition Trends" 
      description="Monthly asset acquisition over the past year"
    >
      <div className="mb-3 flex justify-end">
        <div className="inline-flex rounded-md shadow-sm">
          <button
            type="button"
            className={`px-3 py-1 text-sm font-medium rounded-l-md ${
              dataView === 'count' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
            onClick={handleToggleCount}
          >
            Count
          </button>
          <button
            type="button"
            className={`px-3 py-1 text-sm font-medium rounded-r-md ${
              dataView === 'value' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
            onClick={handleToggleValue}
          >
            Value
          </button>
        </div>
      </div>
      <div style={{ height: '300px' }}>
        <Line data={chartData} options={options} />
      </div>
    </ChartCard>
  );
};

export default memo(AssetAcquisitionChart); 