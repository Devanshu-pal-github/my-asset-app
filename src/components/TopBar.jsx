import React from 'react';
import logger from '../utils/logger.jsx';

logger.debug('Rendering TopBar component');

const TopBar = () => {
  return (
    <div className="bg-white shadow p-4">
      <h1 className="text-xl font-bold">Asset Management Portal</h1>
    </div>
  );
};

export default TopBar;