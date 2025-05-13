import React, { useState, useCallback, lazy, Suspense, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAssetStatistics, fetchDepartmentStatistics, fetchMaintenanceStatistics, 
         fetchEmployeeAssetStatistics, generateReport } from '../../store/slices/analyticsSlice';
import logger from '../../utils/logger';
// Import mock data for fallback when API is not available
import { assetCategoryData, assetStatusData, assetAcquisitionData, 
         departmentAssetData, maintenanceData, assetAgeData, 
         topEmployeeAssetData } from './mockData';

// Lazy load chart components for better initial load performance
const StatisticsCards = lazy(() => import('./components/StatisticsCards'));
const AssetCategoryChart = lazy(() => import('./components/AssetCategoryChart'));
const AssetStatusChart = lazy(() => import('./components/AssetStatusChart'));
const AssetAcquisitionChart = lazy(() => import('./components/AssetAcquisitionChart'));
const DepartmentAssetChart = lazy(() => import('./components/DepartmentAssetChart'));
const MaintenanceCostChart = lazy(() => import('./components/MaintenanceCostChart'));
const AssetAgeChart = lazy(() => import('./components/AssetAgeChart'));
const TopEmployeesTable = lazy(() => import('./components/TopEmployeesTable'));

// Loader component for Suspense fallback
const ChartLoader = () => (
  <div className="bg-white rounded-lg shadow-md p-5 flex justify-center items-center" style={{ height: '300px' }}>
    <div className="flex flex-col items-center">
      <i className="pi pi-spin pi-spinner text-blue-600 text-2xl mb-3"></i>
      <span className="text-gray-600">Loading chart data...</span>
    </div>
  </div>
);

/**
 * Reports & Analytics page
 * Provides visual data insights for asset management
 * Implements performance optimizations including:
 * - Backend-driven pagination for large datasets
 * - Lazy loading of chart components
 * - Memoized callback functions
 * - Suspense for component loading states
 * - Progressive data loading for large datasets
 */
const ReportsAnalytics = () => {
  const dispatch = useDispatch();
  
  // Get analytics data from store
  const assetStats = useSelector(state => state.analytics?.assets || {});
  const departmentStats = useSelector(state => state.analytics?.departments || {});
  const maintenanceStats = useSelector(state => state.analytics?.maintenance || {});
  const employeeAssetStats = useSelector(state => state.analytics?.employeeAssets || {});
  
  // Initialize state
  const [timeFrame, setTimeFrame] = useState('month');
  const [showDropdown, setShowDropdown] = useState(false);
  const [showDataControls, setShowDataControls] = useState(false);
  const [dataLimit, setDataLimit] = useState(1000);
  const [loadedComponents, setLoadedComponents] = useState({});
  
  // Pagination state for employee table
  const [employeeTablePage, setEmployeeTablePage] = useState(1);
  const [employeeTableSortBy, setEmployeeTableSortBy] = useState('value');
  const [employeeTableSortOrder, setEmployeeTableSortOrder] = useState('desc');
  
  // Error state for tracking data loading issues
  const [loadingError, setLoadingError] = useState(null);
  
  // Load initial data
  useEffect(() => {
    try {
      logger.debug('Initial analytics data loading');
      
      // Fetch analytics data from API
      dispatch(fetchAssetStatistics({ timeFrame }));
      dispatch(fetchDepartmentStatistics({ timeFrame }));
      dispatch(fetchMaintenanceStatistics({ timeFrame }));
      dispatch(fetchEmployeeAssetStatistics({ 
        page: employeeTablePage, 
        sortBy: employeeTableSortBy, 
        sortOrder: employeeTableSortOrder,
        timeFrame
      }));
      
      setLoadingError(null);
    } catch (error) {
      console.error('Error loading analytics data:', error);
      setLoadingError('Failed to load data. Using fallback data instead.');
    }
  }, [dispatch, timeFrame, employeeTablePage, employeeTableSortBy, employeeTableSortOrder]);
  
  // Toggle dropdown visibility
  const toggleDropdown = useCallback(() => {
    setShowDropdown(prev => !prev);
    if (showDataControls) setShowDataControls(false);
  }, [showDataControls]);
  
  // Toggle data controls visibility
  const toggleDataControls = useCallback(() => {
    setShowDataControls(prev => !prev);
    if (showDropdown) setShowDropdown(false);
  }, [showDropdown]);
  
  // Handle time frame change
  const handleTimeFrameChange = useCallback((newTimeFrame) => {
    if (newTimeFrame === timeFrame) return;
    
    setTimeFrame(newTimeFrame);
    setLoadedComponents({}); // Reset loaded components when time frame changes
    
  }, [timeFrame]);
  
  // Handle report generation
  const handleGenerateReport = useCallback((reportType) => {
    dispatch(generateReport({ 
      reportType, 
      timeFrame,
      dataLimit
    }));
    
    alert(`Generating ${reportType} report with ${dataLimit} data points for the ${timeFrame} timeframe...`);
    setShowDropdown(false);
  }, [dispatch, timeFrame, dataLimit]);
  
  // Handle data limit change
  const handleDataLimitChange = useCallback((e) => {
    const newLimit = parseInt(e.target.value);
    if (isNaN(newLimit) || newLimit < 100) return;
    
    setDataLimit(newLimit);
  }, []);

  // Handle employee table pagination
  const handleEmployeeTablePageChange = useCallback((newPage) => {
    setEmployeeTablePage(newPage);
  }, []);
  
  // Handle employee table sorting
  const handleEmployeeTableSort = useCallback((field, order) => {
    setEmployeeTableSortBy(field);
    setEmployeeTableSortOrder(order);
  }, []);

  // Memoized time frame label
  const timeFrameLabel = React.useMemo(() => {
    return timeFrame === 'year' ? 'past year' : timeFrame === 'quarter' ? 'past quarter' : 'past month';
  }, [timeFrame]);

  // Component loaded callback for progressive loading
  const handleComponentLoaded = useCallback((componentName) => {
    setLoadedComponents(prev => ({ ...prev, [componentName]: true }));
  }, []);

  // Get mock data for components if API data is not available
  const getAssetCategoryData = () => {
    if (!assetStats?.data?.data?.categories) {
      return assetCategoryData;
    }
    const categories = assetStats.data.data.categories;
    return Array.isArray(categories) ? categories : assetCategoryData;
  };

  const getAssetStatusData = () => {
    if (!assetStats?.data?.data?.statuses) {
      return assetStatusData;
    }
    const statuses = assetStats.data.data.statuses;
    return Array.isArray(statuses) ? statuses : assetStatusData;
  };

  const getAssetAcquisitionData = () => {
    if (!assetStats?.data?.data?.acquisitions) {
      return assetAcquisitionData;
    }
    const acquisitions = assetStats.data.data.acquisitions;
    return Array.isArray(acquisitions) ? acquisitions : assetAcquisitionData;
  };

  const getDepartmentAssetData = () => {
    if (!departmentStats?.data?.departments) {
      return departmentAssetData;
    }
    const departments = departmentStats.data.departments;
    return Array.isArray(departments) ? departments : departmentAssetData;
  };

  const getMaintenanceData = () => {
    if (!maintenanceStats?.data?.maintenance_data) {
      return maintenanceData;
    }
    const maintenance = maintenanceStats.data.maintenance_data;
    return Array.isArray(maintenance) ? maintenance : maintenanceData;
  };

  const getAssetAgeData = () => {
    if (!assetStats?.data?.data?.asset_age) {
      return assetAgeData;
    }
    const ages = assetStats.data.data.asset_age;
    return Array.isArray(ages) ? ages : assetAgeData;
  };

  const getEmployeeAssetData = () => {
    if (!employeeAssetStats?.data?.employees) {
      return topEmployeeAssetData;
    }
    const employees = employeeAssetStats.data.employees;
    return Array.isArray(employees) ? employees : topEmployeeAssetData;
  };

  // Determine if data is still loading
  const isLoading = 
    assetStats?.loading || 
    departmentStats?.loading || 
    maintenanceStats?.loading || 
    employeeAssetStats?.loading;

  return (
    <div className="mt-24 p-6 bg-background-offwhite min-h-screen">
      {/* Header with actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Reports & Analytics</h1>
          <p className="text-gray-600">Visualize and analyze your asset management data</p>
        </div>
        
        {/* Actions */}
        <div className="flex flex-wrap gap-3 mt-4 md:mt-0">
          {/* Time frame selector */}
          <div className="inline-flex rounded-md shadow-sm" role="group">
            <button
              type="button"
              onClick={() => handleTimeFrameChange('month')}
              className={`px-4 py-2 text-sm font-medium rounded-l-lg ${
                timeFrame === 'month'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Month
            </button>
            <button
              type="button"
              onClick={() => handleTimeFrameChange('quarter')}
              className={`px-4 py-2 text-sm font-medium ${
                timeFrame === 'quarter'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Quarter
            </button>
            <button
              type="button"
              onClick={() => handleTimeFrameChange('year')}
              className={`px-4 py-2 text-sm font-medium rounded-r-lg ${
                timeFrame === 'year'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Year
            </button>
          </div>
          
          {/* Generate report button with dropdown */}
          <div className="relative">
            <button
              onClick={toggleDropdown}
              type="button"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 flex items-center"
            >
              <i className="pi pi-file-export mr-2"></i>
              Generate Report
              <i className={`pi pi-chevron-${showDropdown ? 'up' : 'down'} ml-2 text-xs`}></i>
            </button>
            
            {showDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-20">
                <div className="py-1">
                  <button
                    onClick={() => handleGenerateReport('asset_summary')}
                    className="w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-100"
                  >
                    Asset Summary
                  </button>
                  <button
                    onClick={() => handleGenerateReport('department_assets')}
                    className="w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-100"
                  >
                    Department Assets
                  </button>
                  <button
                    onClick={() => handleGenerateReport('maintenance_costs')}
                    className="w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-100"
                  >
                    Maintenance Costs
                  </button>
                  <button
                    onClick={() => handleGenerateReport('employee_assets')}
                    className="w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-100"
                  >
                    Employee Assets
                  </button>
                </div>
              </div>
            )}
          </div>
          
          {/* Data sampling controls button */}
          <button
            onClick={toggleDataControls}
            type="button"
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white rounded-lg hover:bg-gray-50 flex items-center"
          >
            <i className="pi pi-cog mr-2"></i>
            Data Settings
            <i className={`pi pi-chevron-${showDataControls ? 'up' : 'down'} ml-2 text-xs`}></i>
          </button>
        </div>
      </div>
      
      {/* Data sampling controls - only shown when toggled */}
      {showDataControls && (
        <div className="mb-8 p-5 bg-white rounded-lg shadow-md">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Data Visualization Settings</h3>
          <p className="text-sm text-gray-600 mb-4">
            Adjust these settings to optimize performance when dealing with large datasets.
          </p>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="w-full sm:w-auto">
              <label htmlFor="dataLimit" className="block text-sm font-medium text-gray-700 mb-1">
                Maximum data points:
              </label>
              <input
                type="number"
                id="dataLimit"
                value={dataLimit}
                onChange={handleDataLimitChange}
                className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md p-2"
                min="100"
                step="100"
              />
            </div>
            
            <div className="text-sm text-gray-600 flex-1">
              <p>
                <i className="pi pi-info-circle text-blue-500 mr-1"></i>
                Limiting data points improves visualization performance. For large datasets, 
                consider using 1,000-5,000 points for optimal performance.
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Loading overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl flex items-center">
            <i className="pi pi-spin pi-spinner text-blue-600 text-2xl mr-3"></i>
            <span>Loading data...</span>
          </div>
        </div>
      )}

      {/* Error message if data failed to load */}
      {loadingError && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-4 mb-8">
          <div className="flex items-start">
            <i className="pi pi-exclamation-triangle text-red-500 mt-0.5 mr-3 text-lg"></i>
            <div>
              <h4 className="text-sm font-medium text-red-800 mb-1">Data Loading Error</h4>
              <p className="text-sm">{loadingError}</p>
            </div>
          </div>
        </div>
      )}

      {/* Statistics Cards */}
      <Suspense fallback={<ChartLoader />}>
        <StatisticsCards 
          onLoaded={() => handleComponentLoaded('statistics')}
          dataLimit={dataLimit}
          data={assetStats?.data?.data || {
            total_asset_count: 812,
            total_asset_value: 887100,
            total_departments: 9,
            average_asset_age: 2.1
          }}
        />
      </Suspense>

      {/* Charts - First Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <Suspense fallback={<ChartLoader />}>
          <AssetCategoryChart 
            onLoaded={() => handleComponentLoaded('categoryChart')}
            dataLimit={dataLimit}
            data={getAssetCategoryData()}
          />
        </Suspense>
        <Suspense fallback={<ChartLoader />}>
          <AssetStatusChart 
            onLoaded={() => handleComponentLoaded('statusChart')}
            dataLimit={dataLimit}
            data={getAssetStatusData()}
          />
        </Suspense>
      </div>

      {/* Charts - Second Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <Suspense fallback={<ChartLoader />}>
          <AssetAcquisitionChart 
            onLoaded={() => handleComponentLoaded('acquisitionChart')}
            dataLimit={dataLimit}
            data={getAssetAcquisitionData()}
            timeWindow={timeFrame === 'year' ? '1y' : timeFrame === 'quarter' ? '3m' : '1m'}
          />
        </Suspense>
        <Suspense fallback={<ChartLoader />}>
          <MaintenanceCostChart 
            onLoaded={() => handleComponentLoaded('maintenanceChart')}
            dataLimit={dataLimit}
            data={getMaintenanceData()}
          />
        </Suspense>
      </div>

      {/* Charts - Third Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <Suspense fallback={<ChartLoader />}>
          <DepartmentAssetChart 
            onLoaded={() => handleComponentLoaded('departmentChart')}
            dataLimit={dataLimit}
            data={getDepartmentAssetData()}
          />
        </Suspense>
        <Suspense fallback={<ChartLoader />}>
          <AssetAgeChart 
            onLoaded={() => handleComponentLoaded('ageChart')}
            dataLimit={dataLimit}
            data={getAssetAgeData()}
          />
        </Suspense>
      </div>

      {/* Tables */}
      <div className="mb-8">
        <Suspense fallback={<ChartLoader />}>
          <TopEmployeesTable 
            onLoaded={() => handleComponentLoaded('employeesTable')}
            dataLimit={dataLimit}
            data={getEmployeeAssetData()}
            pagination={employeeAssetStats?.pagination || {
              page: 1,
              total_pages: 1,
              total_count: topEmployeeAssetData.length,
              limit: 10
            }}
            onPageChange={handleEmployeeTablePageChange}
            onSortChange={handleEmployeeTableSort}
            sortField={employeeTableSortBy}
            sortOrder={employeeTableSortOrder}
            loading={employeeAssetStats?.loading}
          />
        </Suspense>
      </div>

      {/* Data sampling note */}
      {dataLimit < 100000 && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-8">
          <div className="flex items-start">
            <i className="pi pi-info-circle text-blue-500 mt-0.5 mr-3 text-lg"></i>
            <div>
              <h4 className="text-sm font-medium text-blue-800 mb-1">Large Dataset Optimization</h4>
              <p className="text-sm text-blue-600">
                Data is being sampled to {dataLimit.toLocaleString()} points for optimal visualization performance. 
                Adjust the data controls to view more data points if needed.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Footer note */}
      <div className="text-center text-gray-500 text-sm py-6 border-t border-gray-200 mt-6">
        <p className="mb-1">Data shown is for the {timeFrameLabel}.</p>
        <p>Last updated: {new Date().toLocaleDateString()}</p>
      </div>
    </div>
  );
};

export default ReportsAnalytics; 