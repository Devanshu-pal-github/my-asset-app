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
    <div className="w-[18rem] bg-card-white fixed top-0 left-0 h-screen mt-28 ml-6 rounded-tr-[30px] shadow-lg z-10">
      
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