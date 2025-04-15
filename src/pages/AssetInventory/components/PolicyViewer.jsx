import React from 'react';

const PolicyViewer = ({ policies, isOpen, onClose, title }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-900">{title}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <i className="pi pi-times"></i>
          </button>
        </div>
        {policies && policies.length > 0 ? (
          <div className="space-y-4">
            {policies.map((policy, index) => (
              <div
                key={index}
                className="p-4 border border-gray-200 rounded-md hover:border-blue-300"
              >
                <p className="text-gray-800">{policy}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-600 py-4">No policies assigned to this category.</p>
        )}
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default PolicyViewer;