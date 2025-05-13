import React, { memo, useMemo } from 'react';
import { Chart } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import ChartCard from './ChartCard';
import { maintenanceData } from '../mockData';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

/**
 * Maintenance Cost and Count Chart
 * Shows maintenance costs as bars and maintenance count as a line
 */
const MaintenanceCostChart = () => {
  // Calculate total cost and count
  const { totalCost, totalCount } = useMemo(() => ({
    totalCost: maintenanceData.reduce((sum, item) => sum + item.cost, 0),
    totalCount: maintenanceData.reduce((sum, item) => sum + item.count, 0)
  }), []);

  // Prepare data for Chart.js
  const chartData = useMemo(() => ({
    labels: maintenanceData.map(item => item.month),
    datasets: [
      {
        type: 'bar',
        label: 'Maintenance Cost ($)',
        data: maintenanceData.map(item => item.cost),
        backgroundColor: 'rgba(250, 204, 21, 0.7)', // Yellow
        borderColor: 'rgba(250, 204, 21, 1)',
        borderWidth: 1,
        borderRadius: 4,
        yAxisID: 'y'
      },
      {
        type: 'line',
        label: 'Maintenance Count',
        data: maintenanceData.map(item => item.count),
        borderColor: 'rgba(239, 68, 68, 1)', // Red
        backgroundColor: 'rgba(239, 68, 68, 0.5)',
        borderWidth: 2,
        pointBackgroundColor: 'rgba(239, 68, 68, 1)',
        pointBorderColor: '#fff',
        pointBorderWidth: 1,
        pointRadius: 4,
        tension: 0.4,
        yAxisID: 'y1'
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
            if (context.dataset.type === 'bar') {
              return `Cost: $${context.raw.toLocaleString()}`;
            } else {
              return `Count: ${context.raw}`;
            }
          }
        }
      }
    },
    scales: {
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        title: {
          display: true,
          text: 'Cost ($)'
        },
        beginAtZero: true
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        title: {
          display: true,
          text: 'Count'
        },
        beginAtZero: true,
        // Grid lines are drawn for this axis
        grid: {
          drawOnChartArea: false
        }
      }
    }
  }), []);

  return (
    <ChartCard 
      title="Maintenance Analysis" 
      description={`Total: ${totalCount} maintenance activities, $${totalCost.toLocaleString()} cost`}
    >
      <div style={{ height: '300px' }}>
        <Chart type="bar" data={chartData} options={options} />
      </div>
    </ChartCard>
  );
};

export default memo(MaintenanceCostChart); 