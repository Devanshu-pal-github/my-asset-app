import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import logger from '../../../utils/logger';
import axios from 'axios';

const AssetUnassignmentTable = () => {
  const { categoryId } = useParams();
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    logger.debug('AssetUnassignmentTable useEffect triggered', { categoryId });

    const fetchAssets = async () => {
      try {
        setLoading(true);
        logger.info('Fetching assigned assets for category', { categoryId });
        const response = await axios.get(`http://localhost:8000/api/v1/asset-items/?category_id=${categoryId}&status=In Use`);
        logger.info('Asset items response:', { data: response.data });
        setAssets(response.data);
      } catch (err) {
        logger.error('Failed to fetch assets', { error: err.message });
        setError('Failed to load assets. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchAssets();
  }, [categoryId]);

  const actionBodyTemplate = (rowData) => {
    return (
      <Link to={`/asset-inventory/${categoryId}/unassign/${rowData.id}`}>
        <Button
          label="Unassign"
          className="p-button-sm p-button-danger"
          onClick={() => logger.info('Navigating to EmployeeUnassignment', { assetId: rowData.id })}
        />
      </Link>
    );
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  if (error) {
    return <div className="p-6 text-error-red">{error}</div>;
  }

  if (!assets.length) {
    logger.info('No assigned assets found for category', { categoryId });
    return <div className="p-6">No assigned assets found</div>;
  }

  return (
    <div className="content-container p-6">
      <h2 className="text-2xl font-bold mb-4">Unassign Assets</h2>
      <DataTable
        value={assets}
        paginator
        rows={10}
        dataKey="id"
        className="p-datatable-gridlines"
        responsiveLayout="scroll"
      >
        <Column field="name" header="Asset Name" sortable />
        <Column field="asset_tag" header="Asset Tag" sortable />
        <Column field="serial_number" header="Serial Number" sortable />
        <Column field="department" header="Department" sortable />
        <Column field="location" header="Location" sortable />
        <Column header="Action" body={actionBodyTemplate} />
      </DataTable>
    </div>
  );
};

export default AssetUnassignmentTable;