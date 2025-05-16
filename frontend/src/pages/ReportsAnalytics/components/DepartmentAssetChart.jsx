import React, { memo, useMemo, useCallback, useState } from 'react';
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
 * Department Asset Distribution chart
 * Shows assets distributed across departments
 * Supports toggling between count and value views
 */
const DepartmentAssetChart = ({ onLoaded, dataLimit = 1000, data = departmentAssetData }) => {
  // State for toggling between count and value
  const [showValue, setShowValue] = useState(false);
  
  // Notify parent when component is loaded
  React.useEffect(() => {
    if (onLoaded) onLoaded('departmentChart');
  }, [onLoaded]);

  // Process and limit data if needed
  const processedData = useMemo(() => {
    if (!data || !Array.isArray(data)) {
      return [];
    }
    
    let chartData = [...data];
    
    // Sort data by count or value depending on current view
    chartData.sort((a, b) => 
      showValue 
        ? b.value - a.value 
        : b.count - a.count
    );
    
    // Limit number of departments to display
    if (dataLimit && chartData.length > 15) {
      chartData = chartData.slice(0, 14);
      
      // Add "Other" category
      const otherDepartments = data.slice(14);
      if (otherDepartments.length > 0) {
        const otherCount = otherDepartments.reduce((sum, item) => sum + item.count, 0);
        const otherValue = otherDepartments.reduce((sum, item) => sum + item.value, 0);
        
        chartData.push({
          department: 'Other Departments',
          count: otherCount,
          value: otherValue
        });
      }
    }
    
    return chartData;
  }, [data, showValue, dataLimit]);

  // Calculate totals for display
  const totals = useMemo(() => {
    if (!data || !Array.isArray(data) || data.length === 0) {
      return { count: 0, value: 0 };
    }
    
    const totalCount = data.reduce((sum, item) => sum + item.count, 0);
    const totalValue = data.reduce((sum, item) => sum + item.value, 0);
    return { count: totalCount, value: totalValue };
  }, [data]);

  // Generate background and border colors for bars
  const chartColors = useMemo(() => {
    const backgroundColors = [];
    const borderColors = [];
    
    // Create slightly different shades for each bar for visual variety
    processedData.forEach((item, index) => {
      if (index === processedData.length - 1 && item.department === 'Other Departments') {
        // Use gray for the "Other" category
        backgroundColors.push('rgba(156, 163, 175, 0.7)');
        borderColors.push('rgba(156, 163, 175, 1)');
      } else {
        // Adjust opacity slightly for each department to create visual variety
        const opacity = 0.7 - (index * 0.02);
        backgroundColors.push(`rgba(139, 92, 246, ${Math.max(0.4, opacity)})`);
        borderColors.push('rgba(139, 92, 246, 1)');
      }
    });
    
    return { backgroundColors, borderColors };
  }, [processedData]);

  // Prepare data for Chart.js
  const chartData = useMemo(() => {
    if (processedData.length === 0) {
      return {
        labels: [],
        datasets: [{
          label: showValue ? 'Asset Value ($)' : 'Asset Count',
          data: [],
          backgroundColor: [],
          borderColor: [],
          borderWidth: 1,
          borderRadius: 4
        }]
      };
    }
    
    const { backgroundColors, borderColors } = chartColors;
    
    return {
      labels: processedData.map(item => item.department),
      datasets: [
        {
          label: showValue ? 'Asset Value ($)' : 'Asset Count',
          data: processedData.map(item => showValue ? item.value : item.count),
          backgroundColor: backgroundColors,
          borderColor: borderColors,
          borderWidth: 1,
          borderRadius: 4,
        }
      ]
    };
  }, [processedData, showValue, chartColors]);

  // Chart options
  const options = useMemo(() => ({
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 20
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
            const dataIndex = context.dataIndex;
            if (!processedData[dataIndex]) return '';
            const item = processedData[dataIndex];
            
            if (showValue) {
              return `Value: $${item.value.toLocaleString()}`;
            } else {
              return `Count: ${item.count.toLocaleString()} assets`;
            }
          },
          afterLabel: (context) => {
            const dataIndex = context.dataIndex;
            if (!processedData[dataIndex]) return '';
            const item = processedData[dataIndex];
            
            // Show the alternative metric as additional info
            if (showValue) {
              return `Count: ${item.count.toLocaleString()} assets`;
            } else {
              return `Value: $${item.value.toLocaleString()}`;
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
          text: showValue ? 'Asset Value ($)' : 'Number of Assets',
          font: {
            weight: 'medium',
            size: 12
          },
          padding: {top: 0, bottom: 10}
        },
        grid: {
          color: 'rgba(226, 232, 240, 0.6)'
        },
        ticks: {
          callback: function(value) {
            if (showValue && value >= 1000) {
              return '$' + (value / 1000) + 'k';
            }
            return showValue ? '$' + value : value;
          },
          font: {
            size: 11
          }
        }
      },
      y: {
        grid: {
          display: false
        },
        ticks: {
          font: {
            size: 11
          }
        }
      }
    }
  }), [showValue, processedData]);

  // Toggle between count and value views - memoized to prevent unnecessary rerenders
  const handleToggleView = useCallback(() => {
    setShowValue(prev => !prev);
  }, []);

  return (
    <ChartCard 
      title="Department Asset Distribution" 
      description={`Distribution of ${totals.count.toLocaleString()} assets across ${processedData.length} departments`}
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
              aria-label="Show asset count"
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
              aria-label="Show asset value"
            >
              Value
            </button>
          </div>
        </div>
      }
    >
      <div style={{ height: '400px' }}>
        <Bar data={chartData} options={options} />
      </div>
    </ChartCard>
  );
};

export default memo(DepartmentAssetChart); 