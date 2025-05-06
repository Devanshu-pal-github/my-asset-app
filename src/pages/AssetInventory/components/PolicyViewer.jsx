import React from 'react';

const PolicyViewer = ({ description, policies, isOpen, onClose, title }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-900">{title}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
            </svg>
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium text-gray-700">Description</h4>
            <p className="text-gray-600">{description || 'No description available.'}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-700">Policies</h4>
            {policies && policies.length > 0 ? (
              <div className="space-y-2">
                {policies.map((policy, index) => (
                  <div key={index} className="p-4 border border-gray-200 rounded-md">
                    <p className="text-gray-800">{policy}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600 py-4">No policies assigned to this category.</p>
            )}
          </div>
        </div>
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="bg-blue-600 hover:bg-blue-700 hover:scale-102 text-white font-medium py-2 px-4 rounded-md transition-all duration-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default PolicyViewer;