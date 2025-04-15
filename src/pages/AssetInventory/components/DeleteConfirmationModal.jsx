import React from 'react';

const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, selectedAssets }) => {
  if (!isOpen) return null;

  const isSingle = selectedAssets.length === 1;
  const asset = isSingle ? selectedAssets[0] : {};

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-900">
            {isSingle ? `Delete ${asset.name}` : `Delete ${selectedAssets.length} Categories`}
          </h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <i className="pi pi-times"></i>
          </button>
        </div>
        <div className="text-gray-600 mb-6">
          <p className="mb-4">
            {isSingle
              ? 'Are you sure you want to delete this category? This action cannot be undone.'
              : 'Are you sure you want to delete these categories? This action cannot be undone.'}
          </p>
          {isSingle && (
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Name</span>
                <span>{asset.name}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Items</span>
                <span>{asset.count}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Value</span>
                <span>₹{asset.total_value.toLocaleString()}</span>
              </div>
            </div>
          )}
          <div className="mt-4 text-red-600 bg-red-50 p-3 rounded-md">
            <span className="flex items-center">
              <i className="pi pi-exclamation-triangle mr-2"></i>
              Deleting {isSingle ? 'this category' : 'these categories'} will remove all related data.
            </span>
          </div>
        </div>
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-600 rounded-md hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmationModal;