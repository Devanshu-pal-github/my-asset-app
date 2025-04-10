import React from "react";
import { Link, useLocation } from "react-router-dom";

const Sidebar = () => {
  const location = useLocation();
  const isActive = (path) => location.pathname.startsWith(path);

  return (
    <div className="bg-white w-72 fixed h-full border-r border-gray-200 z-50 mt-28 rounded-tr-[40px] shadow-[0_6px_16px_rgba(0,0,0,0.15),_0_3px_6px_rgba(0,0,0,0.1)] ml-4">
      <div className="flex flex-col h-full">
        <nav className="mt-8 space-y-2 flex-1">
          <Link
            to="/dashboard"
            className={`flex items-center py-3 px-6 transition-all duration-300 ${
              isActive("/dashboard")
                ? "text-black bg-[#E8E4DD] border-l-4 border-blue-500"
                : "text-black hover:bg-gray-100"
            }`}
          >
            <i className="pi pi-th-large mr-3"></i>
            <span className="font-medium">Dashboard</span>
          </Link>
          <Link
            to="/asset-inventory"
            className={`flex items-center py-3 px-6 transition-all duration-300 ${
              isActive("/asset-inventory")
                ? "text-black bg-[#E8E4DD] border-l-4 border-blue-500"
                : "text-black hover:bg-gray-100"
            }`}
          >
            <i className="pi pi-box mr-3"></i>
            <span className="font-medium">Asset Inventory</span>
          </Link>
          <Link
            to="/employee-assets"
            className={`flex items-center py-3 px-6 transition-all duration-300 ${
              isActive("/employee-assets")
                ? "text-black bg-[#E8E4DD] border-l-4 border-blue-500"
                : "text-black hover:bg-gray-100"
            }`}
          >
            <i className="pi pi-users mr-3"></i>
            <span className="font-medium">Employee Assets</span>
          </Link>
          <Link
            to="/requests"
            className={`flex items-center py-3 px-6 transition-all duration-300 ${
              isActive("/requests")
                ? "text-black bg-[#E8E4DD] border-l-4 border-blue-500"
                : "text-black hover:bg-gray-100"
            }`}
          >
            <i className="pi pi-file-edit mr-3"></i>
            <span className="font-medium">Requests & Approvals</span>
          </Link>
          <Link
            to="/maintenance"
            className={`flex items-center py-3 px-6 transition-all duration-300 ${
              isActive("/maintenance")
                ? "text-black bg-[#E8E4DD] border-l-4 border-blue-500"
                : "text-black hover:bg-gray-100"
            }`}
          >
            <i className="pi pi-wrench mr-3"></i>
            <span className="font-medium">Maintenance</span>
          </Link>
          <Link
            to="/reports"
            className={`flex items-center py-3 px-6 transition-all duration-300 ${
              isActive("/reports")
                ? "text-black bg-[#E8E4DD] border-l-4 border-blue-500"
                : "text-black hover:bg-gray-100"
            }`}
          >
            <i className="pi pi-chart-bar mr-3"></i>
            <span className="font-medium">Reports & Analytics</span>
          </Link>
          <Link
            to="/settings"
            className={`flex items-center py-3 px-6 transition-all duration-300 ${
              isActive("/settings")
                ? "text-black bg-[#E8E4DD] border-l-4 border-blue-500"
                : "text-black hover:bg-gray-100"
            }`}
          >
            <i className="pi pi-cog mr-3"></i>
            <span className="font-medium">Settings</span>
          </Link>
        </nav>
      </div>
    </div>
  );
};

export default Sidebar;