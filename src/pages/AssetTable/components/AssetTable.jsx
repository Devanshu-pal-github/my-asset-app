import React, { useEffect } from "react";
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Link } from "react-router-dom";

const AssetTable = ({ data, header, globalFilter }) => {
  // Log table data for debugging
  useEffect(() => {
    console.log("AssetTable component data:", data);
  }, [data]);

  // Action column template
  const actionBodyTemplate = (rowData) => {
    console.log("Rendering action for:", rowData);
    return (
      <Link
        to={`/asset-inventory/${rowData.deviceId}`}
        className="text-blue-500 hover:underline"
        onClick={() => console.log("Clicked detail link for:", rowData.deviceId)}
      >
        View Details
      </Link>
    );
  };

  // Status indicator template
  const deviceIdBodyTemplate = (rowData) => {
    return (
      <div className="flex items-center">
        {rowData.deviceId}
        {rowData.status && (
          <span
            className={`ml-2 w-2 h-2 rounded-full ${
              rowData.status === "In Use"
                ? "bg-blue-500"
                : rowData.status === "Maintenance"
                ? "bg-yellow-500"
                : "bg-gray-400"
            }`}
          ></span>
        )}
      </div>
    );
  };

  return (
    <div className="card">
      <DataTable 
        value={data} 
        className="p-datatable-sm" 
        responsiveLayout="scroll"
        stripedRows
        paginator 
        rows={10}
        rowsPerPageOptions={[5, 10, 25]} 
        tableStyle={{ minWidth: '50rem' }}
        header={header}
        globalFilter={globalFilter}
        emptyMessage="No assets found."
      >
        <Column 
          field="deviceId" 
          header="Device ID" 
          body={deviceIdBodyTemplate}
          sortable 
        />
        <Column 
          field="serialNumber" 
          header="Serial Number" 
          sortable 
        />
        <Column 
          field="assignedTo" 
          header="Assigned To" 
          sortable 
        />
        <Column 
          field="department" 
          header="Department" 
          sortable 
        />
        <Column 
          field="assignmentDate" 
          header="Assignment Date" 
          sortable 
        />
        <Column 
          field="specs" 
          header="Specifications" 
        />
        <Column 
          header="Actions" 
          body={actionBodyTemplate} 
          style={{ width: '10%' }}
        />
      </DataTable>
    </div>
  );
};

export default AssetTable; 