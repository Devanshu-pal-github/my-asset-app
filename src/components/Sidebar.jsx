import React from 'react';
import { NavLink } from 'react-router-dom';
import logger from '../utils/logger.jsx';

logger.debug('Rendering Sidebar component');

const Sidebar = () => {
  return (
    <div className="w-64 bg-gray-800 text-white p-4">
      <h2 className="text-xl font-bold mb-4">Asset Management</h2>
      <nav>
        <NavLink
          to="/asset-inventory"
          className={({ isActive }) => `block py-2 px-4 ${isActive ? 'bg-gray-600' : 'hover:bg-gray-700'}`}
        >
          Inventory
        </NavLink>
        <NavLink
          to="/asset-inventory/add-category"
          className={({ isActive }) => `block py-2 px-4 ${isActive ? 'bg-gray-600' : 'hover:bg-gray-700'}`}
        >
          Add Category
        </NavLink>
      </nav>
    </div>
  );
};

export default Sidebar;