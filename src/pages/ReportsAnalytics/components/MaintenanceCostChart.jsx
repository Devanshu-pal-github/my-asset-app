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
 * MaintenanceCostChart component
 * Shows maintenance costs and counts over time with a combined bar and line chart
 * - Bars represent the cost of maintenance (primary Y-axis)
 * - Line represents the number of maintenance activities (secondary Y-axis)
 */
const MaintenanceCostChart = ({ onLoaded, dataLimit = 1000, data = maintenanceData }) => {
  // Notify parent when component is loaded
  React.useEffect(() => {
    if (onLoaded) onLoaded('maintenanceChart');
  }, [onLoaded]);

  // Process data and handle null/undefined cases
  const processedData = useMemo(() => {
    if (!data || !Array.isArray(data)) {
      return [];
    }
    return data;
  }, [data]);

  // Format month labels for better readability
  const formattedLabels = useMemo(() => {
    if (processedData.length === 0) {
      return [];
    }
    return processedData.map(item => {
      // If it's already in a specific format, we could parse and reform
      // For simplicity, we'll use the month as is from the mock data
      return item.month;
    });
  }, [processedData]);

  // Calculate totals for display
  const totals = useMemo(() => {
    if (processedData.length === 0) {
      return { cost: 0, count: 0 };
    }
    const totalCost = processedData.reduce((sum, item) => sum + item.cost, 0);
    const totalCount = processedData.reduce((sum, item) => sum + item.count, 0);
    return { cost: totalCost, count: totalCount };
  }, [processedData]);

  // Prepare data for Chart.js
  const chartData = useMemo(() => {
    if (processedData.length === 0) {
      return {
        labels: [],
        datasets: [
          {
            type: 'bar',
            label: 'Maintenance Cost',
            data: [],
            backgroundColor: 'rgba(251, 191, 36, 0.7)',
            borderColor: 'rgb(251, 191, 36)',
            borderWidth: 1,
            yAxisID: 'y',
          },
          {
            type: 'line',
            label: 'Maintenance Count',
            data: [],
            borderColor: 'rgb(59, 130, 246)',
            borderWidth: 2,
            yAxisID: 'y1',
          }
        ]
      };
    }

    return {
      labels: formattedLabels,
      datasets: [
        {
          type: 'bar',
          label: 'Maintenance Cost',
          data: processedData.map(item => item.cost),
          backgroundColor: 'rgba(251, 191, 36, 0.7)', // Amber (matching warning/maintenance theme)
          borderColor: 'rgb(251, 191, 36)',
          borderWidth: 1,
          borderRadius: 4,
          yAxisID: 'y',
        },
        {
          type: 'line',
          label: 'Maintenance Count',
          data: processedData.map(item => item.count),
          borderColor: 'rgb(59, 130, 246)', // Blue (consistent with app theme)
          backgroundColor: 'rgba(59, 130, 246, 0.5)',
          borderWidth: 2,
          tension: 0.4,
          pointRadius: 4,
          pointBackgroundColor: 'rgb(59, 130, 246)',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          yAxisID: 'y1',
          fill: false,
        }
      ]
    };
  }, [processedData, formattedLabels]);

  // Chart options
  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 20,
          boxWidth: 10,
          boxHeight: 10,
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
            const datasetLabel = context.dataset.label;
            const value = context.raw;
            if (value === undefined || value === null) return '';
            return datasetLabel === 'Maintenance Cost'
              ? `Cost: $${value.toLocaleString()}`
              : `Count: ${value} activities`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: {
            size: 11,
          },
        },
      },
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        title: {
          display: true,
          text: 'Cost ($)',
          font: {
            size: 12,
            weight: 'medium',
          },
          padding: {top: 0, bottom: 10},
        },
        ticks: {
          callback: (value) => `$${value.toLocaleString()}`,
          font: {
            size: 11,
          },
        },
        grid: {
          color: 'rgba(226, 232, 240, 0.6)',
        },
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        grid: {
          drawOnChartArea: false,
        },
        title: {
          display: true,
          text: 'Maintenance Activities',
          font: {
            size: 12,
            weight: 'medium',
          },
          padding: {top: 0, bottom: 10},
        },
        min: 0,
        ticks: {
          font: {
            size: 11,
          },
        },
      },
    }
  }), []);

  return (
    <ChartCard 
      title="Maintenance Cost & Activity" 
      description={`Total: ${totals.count.toLocaleString()} maintenance activities costing $${totals.cost.toLocaleString()}`}
    >
      <div style={{ height: '300px' }}>
        <Chart type="bar" data={chartData} options={options} />
      </div>
    </ChartCard>
  );
};

export default memo(MaintenanceCostChart); 