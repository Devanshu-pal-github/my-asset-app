import React, { useState, useCallback, memo } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import ChartCard from './ChartCard';
import { departmentAssetData } from '../mockData';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

/**
 * Department Asset Distribution horizontal bar chart
 * Shows asset count and value by department
 */
const DepartmentAssetChart = () => {
  const [dataView, setDataView] = useState('count'); // 'count' or 'value'

  // Use memoized data to prevent unnecessary recalculations
  const chartData = React.useMemo(() => ({
    labels: departmentAssetData.map(item => item.department),
    datasets: [
      {
        label: dataView === 'count' ? 'Number of Assets' : 'Asset Value ($)',
        data: departmentAssetData.map(item => dataView === 'count' ? item.count : item.value),
        backgroundColor: 'rgba(147, 51, 234, 0.7)', // Purple
        borderColor: 'rgba(147, 51, 234, 1)',
        borderWidth: 1,
        borderRadius: 4
      }
    ]
  }), [dataView]);

  // Use memoized options to prevent unnecessary recalculations
  const options = React.useMemo(() => ({
    indexAxis: 'y', // Horizontal bar chart
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
      x: {
        beginAtZero: true,
        title: {
          display: true,
          text: dataView === 'count' ? 'Number of Assets' : 'Asset Value ($)'
        }
      }
    }
  }), [dataView]);

  // Memoize toggle handlers to prevent unnecessary re-renders
  const handleToggleCount = useCallback(() => setDataView('count'), []);
  const handleToggleValue = useCallback(() => setDataView('value'), []);

  return (
    <ChartCard 
      title="Department Asset Distribution" 
      description="Asset count and value by department"
    >
      <div className="mb-3 flex justify-end">
        <div className="inline-flex rounded-md shadow-sm">
          <button
            type="button"
            className={`px-3 py-1 text-sm font-medium rounded-l-md ${
              dataView === 'count' 
                ? 'bg-purple-600 text-white' 
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
                ? 'bg-purple-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
            onClick={handleToggleValue}
          >
            Value
          </button>
        </div>
      </div>
      {/* Fixed height container to prevent infinite stretching */}
      <div style={{ height: '400px' }}>
        <Bar data={chartData} options={options} />
      </div>
    </ChartCard>
  );
};

// Memoize the component to prevent unnecessary re-renders
export default memo(DepartmentAssetChart); 