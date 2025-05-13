import React, { useState, useCallback, lazy, Suspense } from 'react';
import logger from '../../utils/logger';

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
  <div className="bg-white rounded-lg shadow-md p-4 flex justify-center items-center" style={{ height: '300px' }}>
    <div className="flex flex-col items-center">
      <i className="pi pi-spin pi-spinner text-blue-600 text-2xl mb-2"></i>
      <span className="text-gray-600">Loading chart data...</span>
    </div>
  </div>
);

/**
 * Reports & Analytics page
 * Provides visual data insights for asset management
 * Implements performance optimizations including:
 * - Lazy loading of chart components
 * - Memoized callback functions
 * - Suspense for component loading states
 */
const ReportsAnalytics = () => {
  const [timeFrame, setTimeFrame] = useState('year'); // 'year', 'quarter', 'month'
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  // Handle time frame change - memoized to prevent unnecessary re-renders
  const handleTimeFrameChange = useCallback((newTimeFrame) => {
    if (newTimeFrame === timeFrame) return; // Prevent unnecessary updates
    
    setLoading(true);
    logger.debug('Changing time frame', { newTimeFrame });
    
    // In a real app, you would fetch new data based on the time frame
    // For demo, just simulate a loading state
    setTimeout(() => {
      setTimeFrame(newTimeFrame);
      setLoading(false);
    }, 500);
  }, [timeFrame]);

  // Generate report - memoized to prevent unnecessary re-renders
  const handleGenerateReport = useCallback((reportType) => {
    logger.info('Generating report', { reportType, timeFrame });
    // In a real app, this would generate and download a report
    alert(`Generating ${reportType} report for ${timeFrame} time frame`);
    setShowDropdown(false);
  }, [timeFrame]);

  // Toggle dropdown visibility
  const toggleDropdown = useCallback(() => {
    setShowDropdown(prev => !prev);
  }, []);

  // Memoized time frame label
  const timeFrameLabel = React.useMemo(() => {
    return timeFrame === 'year' ? 'past year' : timeFrame === 'quarter' ? 'past quarter' : 'past month';
  }, [timeFrame]);

  return (
    <div className="mt-24 p-6 bg-background-offwhite min-h-screen">
      {/* Header with actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Reports & Analytics</h1>
          <p className="text-gray-600">Visualize and analyze your asset management data</p>
        </div>
        
        {/* Actions */}
        <div className="flex flex-wrap gap-2 mt-4 md:mt-0">
          {/* Time frame selector */}
          <div className="inline-flex rounded-md shadow-sm">
            <button
              type="button"
              className={`px-3 py-2 text-sm font-medium rounded-l-md ${
                timeFrame === 'month' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
              onClick={() => handleTimeFrameChange('month')}
            >
              Month
            </button>
            <button
              type="button"
              className={`px-3 py-2 text-sm font-medium ${
                timeFrame === 'quarter' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
              onClick={() => handleTimeFrameChange('quarter')}
            >
              Quarter
            </button>
            <button
              type="button"
              className={`px-3 py-2 text-sm font-medium rounded-r-md ${
                timeFrame === 'year' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
              onClick={() => handleTimeFrameChange('year')}
            >
              Year
            </button>
          </div>
          
          {/* Report generation dropdown */}
          <div className="relative inline-block text-left">
            <div>
              <button 
                type="button" 
                className="inline-flex justify-center items-center w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none"
                onClick={toggleDropdown}
              >
                <i className="pi pi-file-pdf mr-2"></i>
                Generate Report
                <i className="pi pi-chevron-down ml-2"></i>
              </button>
            </div>
            <div 
              className={`${showDropdown ? 'block' : 'hidden'} origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10`}
            >
              <div className="py-1">
                <button
                  onClick={() => handleGenerateReport('summary')}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Asset Summary Report
                </button>
                <button
                  onClick={() => handleGenerateReport('departments')}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Department Allocation Report
                </button>
                <button
                  onClick={() => handleGenerateReport('maintenance')}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Maintenance Cost Report
                </button>
                <button
                  onClick={() => handleGenerateReport('depreciation')}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Depreciation Forecast Report
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Loading overlay */}
      {loading && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl flex items-center">
            <i className="pi pi-spin pi-spinner text-blue-600 text-2xl mr-3"></i>
            <span>Loading data...</span>
          </div>
        </div>
      )}

      {/* Statistics Cards */}
      <Suspense fallback={<ChartLoader />}>
        <StatisticsCards />
      </Suspense>

      {/* Charts - First Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Suspense fallback={<ChartLoader />}>
          <AssetCategoryChart />
        </Suspense>
        <Suspense fallback={<ChartLoader />}>
          <AssetStatusChart />
        </Suspense>
      </div>

      {/* Charts - Second Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Suspense fallback={<ChartLoader />}>
          <AssetAcquisitionChart />
        </Suspense>
        <Suspense fallback={<ChartLoader />}>
          <MaintenanceCostChart />
        </Suspense>
      </div>

      {/* Charts - Third Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Suspense fallback={<ChartLoader />}>
          <DepartmentAssetChart />
        </Suspense>
        <Suspense fallback={<ChartLoader />}>
          <AssetAgeChart />
        </Suspense>
      </div>

      {/* Tables */}
      <div className="mb-6">
        <Suspense fallback={<ChartLoader />}>
          <TopEmployeesTable />
        </Suspense>
      </div>

      {/* Footer note */}
      <div className="text-center text-gray-500 text-sm mt-8 mb-4">
        <p>Data shown is for the {timeFrameLabel}.</p>
        <p>Last updated: {new Date().toLocaleDateString()}</p>
      </div>
    </div>
  );
};

export default React.memo(ReportsAnalytics); 