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
            {isSingle ? `Delete ${asset.category_name}` : `Delete ${selectedAssets.length} Categories`}
          </h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
            </svg>
          </button>
        </div>
        <div className="text-gray-600 mb-6 space-y-4">
          <p>
            {isSingle
              ? 'Are you sure you want to delete this category? This action cannot be undone.'
              : 'Are you sure you want to delete these categories? This action cannot be undone.'}
          </p>
          {isSingle && (
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Name</span>
                <span className="text-sm font-medium text-gray-900">{asset.category_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Total Items</span>
                <span className="text-sm font-medium text-gray-900">{asset.total_assets}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Total Value</span>
                <span className="text-sm font-medium text-gray-900">
                  {asset.total_cost?.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                </span>
              </div>
            </div>
          )}
          <div className="mt-4 text-red-600 bg-red-50 p-3 rounded-md">
            <span className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 24 24" className="mr-2">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm-1-13h2v2h-2V7zm0 4h2v6h-2v-6z" />
              </svg>
              Deleting {isSingle ? 'this category' : 'these categories'} will remove all related data.
            </span>
          </div>
        </div>
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 hover:scale-102 text-white font-medium rounded-md transition-all duration-200"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 hover:scale-102 text-white font-medium rounded-md transition-all duration-200"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmationModal;