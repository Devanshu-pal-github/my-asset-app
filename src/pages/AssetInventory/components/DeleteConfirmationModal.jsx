import React from 'react';

/**
 * Component for confirming deletion of assets
 */
const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, selectedAssets, title = "Delete Confirmation" }) => {
  if (!isOpen) return null;

  // Assuming selectedAssets contains an array with asset details
  const asset = selectedAssets.length > 0 ? selectedAssets[0] : {};
  const totalItems = asset.count || 0;
  const assignedItems = Math.floor(asset.count * 0.8) || 0;
  const underMaintenance = Math.floor(asset.count * 0.1) || 0;

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
          <p className="mb-2">
            You are about to delete this asset record. This action cannot be undone.
          </p>
          <div className="mt-4 space-y-2">
            <div className="flex justify-between">
              <span>Asset Type</span>
              <span>{asset.category || 'Laptops'}</span>
            </div>
            <div className="flex justify-between">
              <span>Total Items</span>
              <span>{totalItems}</span>
            </div>
            <div className="flex justify-between">
              <span>Assigned Items</span>
              <span>{assignedItems}</span>
            </div>
            <div className="flex justify-between">
              <span>Under Maintenance</span>
              <span>{underMaintenance}</span>
            </div>
          </div>
          <div className="mt-4 text-red-600 bg-red-50 p-2 rounded-md">
            <span className="flex items-center">
              <i className="pi pi-exclamation-triangle mr-2"></i>
              Deleting this asset will remove all related data from the system.
            </span>
          </div>
        </div>
        
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
          >
            Delete Asset
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmationModal;