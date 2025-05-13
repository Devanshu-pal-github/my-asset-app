import React, { memo, useMemo } from 'react';
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
import { assetCategoryData } from '../mockData';

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
 * Assets by Category chart
 * Shows distribution of assets across different categories
 */
const AssetCategoryChart = () => {
  // Prepare data for Chart.js - memoized to prevent recalculations
  const chartData = useMemo(() => ({
    labels: assetCategoryData.map(item => item.category),
    datasets: [
      {
        label: 'Asset Count',
        data: assetCategoryData.map(item => item.count),
        backgroundColor: 'rgba(59, 130, 246, 0.7)', // Blue
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1,
        borderRadius: 4,
      }
    ]
  }), []);

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
            const dataIndex = context.dataIndex;
            const value = assetCategoryData[dataIndex].value;
            return [
              `Count: ${context.raw}`,
              `Value: $${value.toLocaleString()}`
            ];
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Number of Assets'
        }
      }
    }
  }), []);

  return (
    <ChartCard 
      title="Assets by Category" 
      description="Distribution of assets across different categories"
    >
      <div style={{ height: '300px' }}>
        <Bar data={chartData} options={options} />
      </div>
    </ChartCard>
  );
};

export default memo(AssetCategoryChart); 