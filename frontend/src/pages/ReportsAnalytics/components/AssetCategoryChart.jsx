import React, { memo, useMemo, useState } from 'react';
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
 * Supports toggling between count and value views
 */
const AssetCategoryChart = ({ data = assetCategoryData, onLoaded, dataLimit }) => {
  // Add state to toggle between count and value views
  const [showValue, setShowValue] = useState(false);
  
  // Notify parent when component is loaded
  React.useEffect(() => {
    if (onLoaded) onLoaded('categoryChart');
  }, [onLoaded]);

  // Process data - limit number of items if needed
  const processedData = useMemo(() => {
    if (!data || !Array.isArray(data) || data.length === 0) {
      return [];
    }
    
    let chartData = [...data];
    
    // Sort data by count or value depending on current view
    chartData.sort((a, b) => 
      showValue 
        ? b.value - a.value 
        : b.count - a.count
    );
    
    // If data exceeds limit, aggregate smaller categories
    if (dataLimit && data.length > dataLimit) {
      chartData = data.slice(0, dataLimit - 1);
      const otherCategories = data.slice(dataLimit - 1);
      
      // Create 'Other' category with aggregated values
      if (otherCategories.length > 0) {
        const otherCount = otherCategories.reduce((sum, item) => sum + item.count, 0);
        const otherValue = otherCategories.reduce((sum, item) => sum + item.value, 0);
        
        chartData.push({
          category: 'Other',
          count: otherCount,
          value: otherValue
        });
      }
    }
    
    return chartData;
  }, [data, dataLimit, showValue]);

  // Calculate totals for description
  const totals = useMemo(() => {
    if (!data || !Array.isArray(data) || data.length === 0) {
      return { count: 0, value: 0 };
    }
    const totalCount = data.reduce((sum, item) => sum + item.count, 0);
    const totalValue = data.reduce((sum, item) => sum + item.value, 0);
    return { count: totalCount, value: totalValue };
  }, [data]);

  // Generate consistent colors for bars
  const generateColors = useMemo(() => {
    if (processedData.length === 0) {
      return { backgroundColors: [], borderColors: [] };
    }
    
    const baseColor = 'rgba(59, 130, 246, 0.7)'; // Blue
    const baseColorBorder = 'rgba(59, 130, 246, 1)';
    
    const backgroundColors = [];
    const borderColors = [];
    
    // Create slightly different shades for each bar
    processedData.forEach((item, index) => {
      if (index === processedData.length - 1 && item.category === 'Other') {
        // Use gray for the "Other" category
        backgroundColors.push('rgba(156, 163, 175, 0.7)');
        borderColors.push('rgba(156, 163, 175, 1)');
      } else {
        // Adjust opacity slightly for each category
        const opacity = 0.7 - (index * 0.03);
        backgroundColors.push(`rgba(59, 130, 246, ${Math.max(0.4, opacity)})`);
        borderColors.push(baseColorBorder);
      }
    });
    
    return { backgroundColors, borderColors };
  }, [processedData]);

  // Prepare data for Chart.js - memoized to prevent recalculations
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
    
    const { backgroundColors, borderColors } = generateColors;
    
    return {
      labels: processedData.map(item => item.category),
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
  }, [processedData, showValue, generateColors]);

  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y',
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 20,
        }
      },
      tooltip: {
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
          },
        },
        ticks: {
          callback: function(value) {
            if (showValue) {
              if (value >= 1000) {
                return '$' + (value / 1000) + 'k';
              }
              return '$' + value;
            }
            return value;
          }
        }
      },
      y: {
        ticks: {
          font: {
            size: 11,
          },
        }
      }
    }
  }), [processedData, showValue]);

  // Handle toggle between count and value
  const handleToggleView = () => {
    setShowValue(prev => !prev);
  };

  return (
    <ChartCard 
      title="Assets by Category" 
      description={`Distribution of ${totals.count.toLocaleString()} assets across categories (Total value: $${totals.value.toLocaleString()})`}
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
      <div style={{ height: '400px' }}>
        <Bar data={chartData} options={options} />
      </div>
    </ChartCard>
  );
};

export default memo(AssetCategoryChart); 