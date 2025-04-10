import React from "react";

const TopBar = () => {
  return (
    <div className="bg-white max-w-[1260px] mr-12 w-full mx-auto shadow-md border-b border-blue-200 fixed top-4 left-1/2 transform -translate-x-1/2 z-40 rounded-lg overflow-hidden">
      <div className="flex justify-between items-center px-6 py-3">
        <h2 className="text-xl font-bold text-black tracking-tight">AssetHR</h2>
        <div className="flex items-center space-x-6">
          <div className="relative w-72">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <i className="pi pi-search text-black opacity-75"></i>
            </div>
            <input
              type="text"
              placeholder="Search assets..."
              className="w-full pl-10 pr-4 py-2 bg-white/10 text-black placeholder-black/70 border border-white/20 rounded-md focus:outline-none focus:ring-2 focus:ring-white/50 text-sm"
            />
          </div>
          <div className="relative">
            <button className="p-2 text-black hover:bg-white/20 rounded-full focus:outline-none transition-colors">
              <i className="pi pi-bell text-lg"></i>
            </button>
            <span className="absolute top-0 right-0 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
              1
            </span>
          </div>
          <div className="flex items-center">
            <div className="w-9 h-9 rounded-full bg-white/20 overflow-hidden mr-3">
              <img
                src="/assets/avatar.svg"
                alt="User avatar"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <span className="font-semibold text-black">Sarah Anderson</span>
              <span className="block text-sm text-black/80">HR Manager</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopBar;
