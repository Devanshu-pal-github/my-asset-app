import React from "react";
import logger from "../utils/logger.jsx";

const TopBar = () => {
  logger.debug("Rendering TopBar component");

  return (
    <div className="bg-card-white p-4 fixed top-4 right-6 left-6 shadow-md rounded-2xl flex justify-between items-center z-10">
      <div className="flex items-center space-x-4">
        <h2 className="text-2xl font-bold text-primary-blue">
          Asset Management
        </h2>
        <span className="text-text-light text-sm">
          Overview of your asset management system
        </span>
      </div>
      <div className="flex items-center space-x-2">
        <img
          src="https://via.placeholder.com/30"
          alt="User Avatar"
          className="rounded-full"
        />
        <div>
          <div className="text-text-dark font-medium">Sarah Anderson</div>
          <div className="text-text-light text-sm">HR Manager</div>
        </div>
      </div>
    </div>
  );
};

export default TopBar;
