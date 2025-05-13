import React, { memo } from 'react';
import PropTypes from 'prop-types';

/**
 * ChartCard component
 * Provides consistent card wrapper for all chart components
 * with controlled dimensions to prevent layout issues
 */
const ChartCard = ({ 
  title, 
  description, 
  children, 
  extraContent, 
  className 
}) => {
  return (
    <div className={`bg-white rounded-lg shadow-md overflow-hidden ${className}`}>
      <div className="p-4 border-b">
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        {description && <p className="text-sm text-gray-600 mt-1">{description}</p>}
      </div>
      
      <div className="p-4 overflow-hidden">
        {children}
      </div>
      
      {extraContent && (
        <div className="bg-gray-50 px-4 py-3 border-t">
          {extraContent}
        </div>
      )}
    </div>
  );
};

ChartCard.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  children: PropTypes.node.isRequired,
  extraContent: PropTypes.node,
  className: PropTypes.string
};

ChartCard.defaultProps = {
  description: '',
  extraContent: null,
  className: ''
};

// Memoize the component to prevent unnecessary re-renders
export default memo(ChartCard); 