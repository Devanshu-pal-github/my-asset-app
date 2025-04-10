import React from 'react';

/**
 * Component for confirming deletion of assets
 */
const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, selectedAssets, title = "Delete Assets" }) => {
  if (!isOpen) return null;

  // Count how many assets are selected
  const count = selectedAssets ? selectedAssets.length : 0;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">{title}</h3>
          <button 
            onClick={onClose} 
            className="text-gray-500 hover:text-gray-700"
          >
            <i className="pi pi-times"></i>
          </button>
        </div>
        
        <div className="text-gray-600 mb-6">
          {count > 0 ? (
            <>
              <p className="mb-2">
                Are you sure you want to delete {count === 1 ? 'this asset' : `these ${count} assets`}?
              </p>
              <p>This action cannot be undone.</p>
            </>
          ) : (
            <p>Please select at least one asset to delete.</p>
          )}
        </div>
        
        {count > 0 && (
          <div className="mb-4 max-h-40 overflow-auto bg-gray-50 rounded-md p-3">
            <ul className="text-sm">
              {selectedAssets.map(asset => (
                <li key={asset.id} className="py-1">
                  <span className="font-medium">{asset.name}</span>
                  {asset.category && (
                    <span className="text-gray-500 text-xs ml-2">({asset.category})</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
        
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          {count > 0 && (
            <button
              onClick={onConfirm}
              className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmationModal; 