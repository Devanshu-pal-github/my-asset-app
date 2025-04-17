import React from 'react';
import logger from '../utils/logger.jsx';

const TopBar = () => {
  logger.debug('Rendering TopBar component');

  return (
    <div className="bg-card-white p-4 mx-6 my-4 rounded-[topbar-card] shadow-md flex justify-between items-center ml-[sidebar-width]">
      <div className="flex items-center space-x-4">
        <h2 className="text-2xl font-bold text-primary-blue">AssetHR</h2>
      </div>
      <div className="flex items-center space-x-2">
        <img src="https://via.placeholder.com/30" alt="User Avatar" className="rounded-full" />
        <div>
          <div className="text-text-dark font-medium">Sarah Anderson</div>
          <div className="text-text-light text-sm">HR Manager</div>
        </div>
      </div>
    </div>
  );
};

export default TopBar;