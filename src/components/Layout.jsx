import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import TopBar from './TopBar.jsx';
import logger from '../utils/logger.jsx';

const Layout = () => {
  logger.debug('Rendering Layout component');

  return (
    <div className="flex h-screen bg-background-offwhite">
      <Sidebar />
      <div className="flex-1 flex flex-col ml-[sidebar-width]">
        <TopBar />
        <div className="p-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default Layout;