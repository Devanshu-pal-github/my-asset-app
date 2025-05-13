import React, { useMemo, memo } from 'react';
import { assetCategoryData, assetStatusData, departmentAssetData, assetAgeData } from '../mockData';

/**
 * StatisticsCards component
 * Shows summary statistics for asset management data
 * Displays key metrics in a visually appealing grid layout
 */
const StatisticsCards = ({ data, onLoaded, dataLimit }) => {
  // Notify parent when component is loaded
  React.useEffect(() => {
    if (onLoaded) onLoaded('statistics');
  }, [onLoaded]);
  
  // Calculate stats from mock data if not provided through props
  const stats = useMemo(() => {
    // If we have direct data from the Redux store, use it
    if (data && Object.keys(data).length > 0) {
      return [
        {
          id: 'total_assets',
          label: 'Total Assets',
          value: data.total_asset_count.toLocaleString(),
          icon: 'pi pi-database',
          colorClass: 'bg-blue-100 text-blue-600',
          description: 'All registered assets in the system'
        },
        {
          id: 'total_value',
          label: 'Total Value',
          value: `$${data.total_asset_value.toLocaleString()}`,
          icon: 'pi pi-dollar',
          colorClass: 'bg-green-100 text-green-600',
          description: 'Combined value of all assets'
        },
        {
          id: 'departments',
          label: 'Departments',
          value: data.total_departments.toLocaleString(),
          icon: 'pi pi-building',
          colorClass: 'bg-purple-100 text-purple-600',
          description: 'Departments with assigned assets'
        },
        {
          id: 'avg_age',
          label: 'Average Asset Age',
          value: `${data.average_asset_age.toLocaleString()} years`,
          icon: 'pi pi-calendar',
          colorClass: 'bg-amber-100 text-amber-600',
          description: 'Average age of all assets'
        },
      ];
    }
    
    // Otherwise calculate from mock data
    // Get total asset count
    const totalAssets = assetStatusData.reduce((total, item) => total + item.count, 0);
    
    // Get total asset value
    const totalValue = assetCategoryData.reduce((total, item) => total + item.value, 0);
    
    // Get total departments
    const totalDepartments = departmentAssetData.length;
    
    // Calculate weighted average age
    // Convert age ranges to approximate midpoints for calculation
    const ageRanges = {
      '< 1 year': 0.5,
      '1-2 years': 1.5,
      '2-3 years': 2.5,
      '3-4 years': 3.5,
      '4+ years': 5, // Approximate midpoint for 4+ years
    };
    
    const weightedAgeSum = assetAgeData.reduce((sum, item) => {
      const midpoint = ageRanges[item.range] || 0;
      return sum + (midpoint * item.count);
    }, 0);
    
    const averageAge = weightedAgeSum / totalAssets;
    
    return [
      {
        id: 'total_assets',
        label: 'Total Assets',
        value: totalAssets.toLocaleString(),
        icon: 'pi pi-database',
        colorClass: 'bg-blue-100 text-blue-600',
        description: 'All registered assets in the system'
      },
      {
        id: 'total_value',
        label: 'Total Value',
        value: `$${totalValue.toLocaleString()}`,
        icon: 'pi pi-dollar',
        colorClass: 'bg-green-100 text-green-600',
        description: 'Combined value of all assets'
      },
      {
        id: 'departments',
        label: 'Departments',
        value: totalDepartments.toLocaleString(),
        icon: 'pi pi-building',
        colorClass: 'bg-purple-100 text-purple-600',
        description: 'Departments with assigned assets'
      },
      {
        id: 'avg_age',
        label: 'Average Asset Age',
        value: `${averageAge.toFixed(1)} years`,
        icon: 'pi pi-calendar',
        colorClass: 'bg-amber-100 text-amber-600',
        description: 'Average age of all assets'
      },
    ];
  }, [data]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      {stats.map((stat) => (
        <div key={stat.id} className="bg-white rounded-lg shadow-md p-5 transform transition-transform duration-300 hover:shadow-lg">
          <div className="flex items-center">
            <div className={`w-14 h-14 rounded-full ${stat.colorClass} flex items-center justify-center mr-4 shadow-sm`}>
              <i className={`${stat.icon} text-xl`}></i>
            </div>
            <div>
              <p className="text-gray-500 text-sm font-medium">{stat.label}</p>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default memo(StatisticsCards); 