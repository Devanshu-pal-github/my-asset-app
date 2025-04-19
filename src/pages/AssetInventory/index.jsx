import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAssetCategories, deleteAssetCategory, updateAssetCategory } from '../../store/slices/assetCategorySlice';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import DeleteConfirmationModal from '../AssetInventory/components/DeleteConfirmationModal';
import EditAssetForm from '../AssetInventory/components/EditAssetForm';
import logger from '../../utils/logger';
import { Link } from 'react-router-dom';

const AssetInventory = () => {
  const dispatch = useDispatch();
  const { categories, loading, error } = useSelector((state) => state.assetCategories);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [deleteError, setDeleteError] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editCategory, setEditCategory] = useState(null);
  const [editError, setEditError] = useState(null);

  useEffect(() => {
    logger.debug('AssetInventory useEffect triggered');
    dispatch(fetchAssetCategories());
  }, [dispatch]);

  logger.debug('Rendering AssetInventory', { categories, loading, error });
  logger.debug('Categories in state:', { categories });

  const handleDeleteClick = (category) => {
    logger.debug('Delete icon clicked for category', { categoryId: category._id, categoryName: category.name });
    setSelectedCategory(category);
    setIsDeleteModalOpen(true);
    setDeleteError(null);
  };

  const handleDeleteConfirm = () => {
    if (!selectedCategory) {
      logger.error('No category selected for deletion');
      return;
    }

    logger.debug('Confirming deletion for category', { categoryId: selectedCategory._id });
    dispatch(deleteAssetCategory(selectedCategory._id))
      .unwrap()
      .then(() => {
        logger.info('Successfully deleted category', { categoryId: selectedCategory._id });
        setIsDeleteModalOpen(false);
        setSelectedCategory(null);
      })
      .catch((err) => {
        logger.error('Failed to delete category', { categoryId: selectedCategory._id, error: err });
        setDeleteError(err || 'Failed to delete category');
      });
  };

  const handleDeleteCancel = () => {
    logger.debug('Delete cancelled for category', { categoryId: selectedCategory?._id });
    setIsDeleteModalOpen(false);
    setSelectedCategory(null);
    setDeleteError(null);
  };

  const handleEditClick = (category) => {
    logger.debug('Edit icon clicked for category', { categoryId: category._id, categoryName: category.name });
    setEditCategory({
      id: category._id,
      name: category.name,
      icon: category.icon || 'pi pi-desktop',
      count: category.count || 0,
      total_value: category.total_value || 0,
      policies: category.policies || [],
      is_active: category.is_active !== undefined ? category.is_active : true,
    });
    setIsEditModalOpen(true);
    setEditError(null);
  };

  const handleEditSubmit = (updatedData) => {
    if (!editCategory) {
      logger.error('No category selected for editing');
      return;
    }

    logger.debug('Submitting updated category', { categoryId: editCategory.id, updatedData });
    dispatch(updateAssetCategory({ id: editCategory.id, category: updatedData }))
      .unwrap()
      .then(() => {
        logger.info('Successfully updated category', { categoryId: editCategory.id });
        setIsEditModalOpen(false);
        setEditCategory(null);
      })
      .catch((err) => {
        logger.error('Failed to update category', { categoryId: editCategory.id, error: err });
        setEditError(err || 'Failed to update category');
      });
  };

  const handleEditCancel = () => {
    logger.debug('Edit cancelled for category', { categoryId: editCategory?.id });
    setIsEditModalOpen(false);
    setEditCategory(null);
    setEditError(null);
  };

  if (loading && !categories.length) {
    return <div className="p-6">Loading...</div>;
  }

  if (error) {
    logger.error('AssetInventory error', { error });
    return <div className="p-6 text-error-red">Error: {error.toString()}</div>;
  }

  if (!categories.length) {
    logger.info('No categories found');
    return <div className="p-6">No categories found</div>;
  }

  const stats = [
    { title: 'Total Assets', value: categories.reduce((sum, cat) => sum + cat.count, 0).toString(), trend: '+0%' },
    { title: 'Active Assets', value: categories.filter(cat => cat.is_active).reduce((sum, cat) => sum + cat.count, 0).toString(), trend: '+0%' },
    { title: 'Total Value', value: categories.reduce((sum, cat) => sum + (cat.total_value || 0), 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' }), trend: '+0%' },
    { title: 'Depreciated Assets', value: categories.reduce((sum, cat) => sum + (cat.total_value || 0) * 0.2, 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' }), trend: '-0%' },
  ];

  return (
    <div className="content-container">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white p-4 rounded-xl shadow-md">
            <div className="text-text-dark font-semibold">{stat.title}</div>
            <div className="text-2xl font-bold text-text-dark mt-2">
              {stat.value}{' '}
              <span className={stat.trend.startsWith('+') ? 'text-secondary-green' : 'text-error-red'}>
                {stat.trend}
              </span>
            </div>
          </div>
        ))}
      </div>
      <div className="flex flex-col md:flex-row justify-between mb-4 gap-3">
        <input
          type="text"
          placeholder="Search assets..."
          className="p-2 border border-border-gray rounded-xl w-full md:w-1/3 text-text-light"
        />
        <div className="flex gap-2 justify-end">
          <button className="p-2 bg-primary-blue text-white rounded-xl">Filter</button>
          <Link to="/asset-inventory/add-category">
            <button className="p-2 bg-primary-blue text-white rounded-xl">Add New Asset</button>
          </Link>
        </div>
      </div>
      {deleteError && (
        <div className="p-4 mb-4 text-red-600 bg-red-50 rounded-md">
          <span className="flex items-center">
            <i className="pi pi-exclamation-triangle mr-2"></i>
            {deleteError}
          </span>
        </div>
      )}
      {editError && (
        <div className="p-4 mb-4 text-red-600 bg-red-50 rounded-md">
          <span className="flex items-center">
            <i className="pi pi-exclamation-triangle mr-2"></i>
            {editError}
          </span>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-[70vh] overflow-y-auto pr-2">
        {categories.map((category) => {
          const categoryId = String(category._id || category.id || 'default-id');
          logger.debug('Category ID for View Details:', { categoryId });
          return (
            <Card
              key={categoryId}
              className="bg-white rounded-xl shadow-md relative"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="flex items-center space-x-2">
                    <i className={`${category.icon} text-primary-blue`}></i>
                    <span className="text-text-dark font-semibold text-lg">{category.name}</span>
                  </div>
                  <div className="text-xs text-text-light mt-1">{category.description || 'No description'}</div>
                </div>
                <div className="flex space-x-2 text-text-light text-sm">
                  <i
                    className="pi pi-pencil cursor-pointer"
                    onClick={() => handleEditClick(category)}
                  />
                  <i className="pi pi-copy cursor-pointer" />
                  <i
                    className="pi pi-trash cursor-pointer"
                    onClick={() => handleDeleteClick(category)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 text-sm text-text-dark mb-3">
                <div>
                  <div className="font-medium">Total Items</div>
                  <div className="text-lg font-bold">{category.count || 0}</div>
                </div>
                <div>
                  <div className="font-medium">Assigned</div>
                  <div className="text-lg font-bold">0</div>
                </div>
                <div>
                  <div className="font-medium text-secondary-green">Available</div>
                  <div className="text-lg font-bold text-secondary-green">0</div>
                </div>
                <div>
                  <div className="font-medium text-yellow-500">Maintenance</div>
                  <div className="text-lg font-bold text-yellow-500">0</div>
                </div>
              </div>
              <div className="text-sm text-text-dark mb-1">Utilization Rate</div>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                <div className="bg-primary-blue h-2 rounded-full" style={{ width: '0%' }}></div>
              </div>
              <div className="text-right text-sm text-dark font-semibold mb-2">0%</div>
              <div className="flex space-x-2 mb-4">
                <Link
                  to={`/asset-inventory/${categoryId}/assign`}
                  onClick={() => logger.info('Navigating to AssetAssignmentTable', { categoryId, url: `/asset-inventory/${categoryId}/assign` })}
                >
                  <Button label="Assign Asset" className="p-button-sm w-1/2 bg-primary-blue text-white" />
                </Link>
                <Button label="Unassign Asset" className="p-button-sm w-1/2 bg-error-red text-white" />
              </div>
              <div className="flex justify-between items-center">
                <div className="bg-green-100 text-green-800 font-semibold px-3 py-1 rounded-full text-sm">
                  ${Number(category.total_value || 0).toLocaleString()}
                </div>
                <Link
                  to={`/asset-inventory/${categoryId}`}
                  onClick={() => logger.info('Navigating to AssetTablePage', { categoryId, url: `/asset-inventory/${categoryId}` })}
                >
                  <Button
                    label="View Details"
                    className="p-button-text p-button-sm text-primary-blue font-semibold bg-transparent"
                  />
                </Link>
              </div>
            </Card>
          );
        })}
      </div>
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        selectedAssets={selectedCategory ? [selectedCategory] : []}
      />
      {isEditModalOpen && editCategory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">Edit Category</h3>
              <button onClick={handleEditCancel} className="text-gray-500 hover:text-gray-700">
                <i className="pi pi-times"></i>
              </button>
            </div>
            <EditAssetForm
              asset={editCategory}
              onClose={handleEditCancel}
              onUpdateAsset={handleEditSubmit}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default AssetInventory;