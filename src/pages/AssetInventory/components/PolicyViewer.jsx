import React from "react";

/**
 * Component for displaying asset policies in a modal
 */
const PolicyViewer = ({ policies, isOpen, onClose, title = "Asset Policies" }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">{title}</h3>
          <button 
            onClick={onClose} 
            className="text-gray-500 hover:text-gray-700"
          >
            <i className="pi pi-times"></i>
          </button>
        </div>
        
        {policies && policies.length > 0 ? (
          <div className="space-y-4">
            {policies.map((policy) => (
              <div 
                key={policy.id} 
                className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors"
              >
                <h4 className="font-medium text-lg text-gray-800 mb-2">
                  {policy.name}
                </h4>
                <p className="text-gray-600">
                  {policy.description}
                </p>
                <div className="mt-3 flex justify-end">
                  <button className="text-blue-500 hover:text-blue-700 text-sm flex items-center">
                    <i className="pi pi-external-link mr-1"></i> 
                    View Full Policy
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-6 text-center text-gray-500">
            No policies have been assigned to this asset.
          </div>
        )}
        
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default PolicyViewer;