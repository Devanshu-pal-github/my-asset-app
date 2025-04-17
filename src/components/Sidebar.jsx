import React from 'react';
import { NavLink } from 'react-router-dom';
import logger from '../utils/logger.jsx';

const Sidebar = () => {
  logger.debug('Rendering Sidebar component');

  const menuItems = [
    { to: '/dashboard', icon: 'pi pi-chart-bar', label: 'Dashboard' },
    { to: '/asset-inventory', icon: 'pi pi-box', label: 'Asset Inventory' },
    { to: '/employee-assets', icon: 'pi pi-users', label: 'Employee Assets' },
    { to: '/requests-approvals', icon: 'pi pi-check-square', label: 'Requests & Approvals' },
    { to: '/maintenance', icon: 'pi pi-wrench', label: 'Maintenance' },
    { to: '/reports-analytics', icon: 'pi pi-chart-line', label: 'Reports & Analytics' },
    { to: '/settings', icon: 'pi pi-cog', label: 'Settings' },
  ];

  return (
    <div className="w-[sidebar-width] bg-background-offwhite mt-4 rounded-tr-[sidebar-top] shadow-md">
      <div className="p-4">
        <h2 className="text-2xl font-bold text-primary-blue">AssetHR</h2>
      </div>
      <nav className="mt-4">
        {menuItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center p-3 text-text-dark hover:bg-border-gray/50 ${isActive ? 'bg-sidebar-selected font-bold' : ''}`
            }
          >
            <i className={`${item.icon} mr-3`}></i>
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;