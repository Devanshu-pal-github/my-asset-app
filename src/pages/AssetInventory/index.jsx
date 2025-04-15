import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAssetCategories } from '../../store/slices/assetCategorySlice.jsx';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import logger from '../../utils/logger.jsx';

const AssetInventory = () => {
  const dispatch = useDispatch();
  const { categories, loading, error } = useSelector((state) => state.assetCategories);

  useEffect(() => {
    logger.debug('AssetInventory useEffect triggered');
    dispatch(fetchAssetCategories());
  }, [dispatch]);

  logger.debug('Rendering AssetInventory', { categories, loading, error });

  if (loading && !categories.length) {
    return <div className="asset-inventory-container">Loading...</div>;
  }

  if (error) {
    logger.error('AssetInventory error', { error });
    return (
      <div className="asset-inventory-container">
        Error: {error.toString()}
      </div>
    );
  }

  if (!categories.length) {
    logger.info('No categories found');
    return <div className="asset-inventory-container">No categories found</div>;
  }

  return (
    <div className="asset-inventory-container">
      <h1 className="text-2xl font-bold mb-4">Asset Inventory</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((category) => (
          <Card
            key={category._id || category.id}
            title={category.name}
            subTitle={`Count: ${category.count}`}
            className="card"
          >
            <div className="flex items-center mb-2">
              <i className={`${category.icon} mr-2`}></i>
              <span>Total Value: ${Number(category.total_value).toLocaleString()}</span>
            </div>
            <p>Policies: {category.policies.join(', ')}</p>
            <Button label="View Details" className="p-button-sm mt-2" />
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AssetInventory;