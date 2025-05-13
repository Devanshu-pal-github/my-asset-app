import React from 'react';
import { assetCategoryData, assetStatusData, departmentAssetData, assetAgeData } from '../mockData';

const StatisticsCards = () => {
  // Calculate total asset count
  const totalAssets = assetStatusData.reduce((total, item) => total + item.count, 0);
  
  // Calculate total asset value
  const totalValue = assetCategoryData.reduce((total, item) => total + item.value, 0);
  
  // Calculate total departments
  const totalDepartments = departmentAssetData.length;
  
  // Calculate average asset age (weighted average)
  const totalAssetsByAge = assetAgeData.reduce((total, item) => total + item.count, 0);
  const weightedAgeSum = assetAgeData.reduce((sum, item) => {
    // Convert range to number (use midpoint of range)
    let age;
    if (item.range === '< 1 year') age = 0.5;
    else if (item.range === '1-2 years') age = 1.5;
    else if (item.range === '2-3 years') age = 2.5;
    else if (item.range === '3-4 years') age = 3.5;
    else age = 5; // 4+ years

    return sum + (age * item.count);
  }, 0);
  const averageAge = (weightedAgeSum / totalAssetsByAge).toFixed(1);

  const stats = [
    { 
      label: 'Total Assets', 
      value: totalAssets.toLocaleString(), 
      icon: 'pi pi-box',
      color: 'bg-blue-100 text-blue-800'
    },
    { 
      label: 'Total Value', 
      value: `$${totalValue.toLocaleString()}`, 
      icon: 'pi pi-dollar',
      color: 'bg-green-100 text-green-800'
    },
    { 
      label: 'Departments', 
      value: totalDepartments, 
      icon: 'pi pi-building',
      color: 'bg-purple-100 text-purple-800'
    },
    { 
      label: 'Avg. Asset Age', 
      value: `${averageAge} years`, 
      icon: 'pi pi-calendar',
      color: 'bg-orange-100 text-orange-800'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {stats.map((stat, index) => (
        <div key={index} className="bg-white rounded-lg shadow-sm p-4 flex items-center">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${stat.color} mr-4`}>
            <i className={`${stat.icon} text-xl`}></i>
          </div>
          <div>
            <p className="text-gray-600 text-sm">{stat.label}</p>
            <p className="text-2xl font-bold">{stat.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StatisticsCards; 