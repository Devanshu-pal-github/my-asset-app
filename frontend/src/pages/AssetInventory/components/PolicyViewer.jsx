import React from 'react';

const PolicyViewer = ({ description, policies, isOpen, onClose, title }) => {
  // Safely handle policies - ensure it's an array
  const policyList = Array.isArray(policies) ? policies : [];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl z-50 shadow-xl max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b border-gray-200 pb-4 mb-4">
          <h2 className="text-xl font-bold text-gray-900">{title || "Details"}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 p-2 rounded-full transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* Description Section */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Description</h3>
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            {description ? (
              <p className="text-gray-700">{description}</p>
            ) : (
              <p className="text-gray-500 italic">No description provided.</p>
            )}
          </div>
        </div>

        {/* Policies Section */}
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Policies</h3>
          
          {policyList.length > 0 ? (
            <div className="space-y-3">
              {policyList.map((policy, index) => (
                <div 
                  key={index} 
                  className="flex items-start p-3 bg-blue-50 rounded-lg border border-blue-100"
                >
                  <span className="text-blue-500 mr-3 mt-0.5">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </span>
                  <p className="text-gray-700">{policy}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <p className="text-gray-500 italic">No policies assigned to this category.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PolicyViewer;