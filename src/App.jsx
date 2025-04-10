import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import AssetInventory from "./pages/AssetInventory/index";
import AssetDetail from "./pages/AssetDetail/index";
import AssetTable from "./pages/AssetTable/index";

function App() {
  // Define all the states that we need to manage at the app level
  const [assetCategories, setAssetCategories] = useState([]);
  const [assetItems, setAssetItems] = useState([]);
  const [assetDetails, setAssetDetails] = useState([]);
  const [assignmentHistory, setAssignmentHistory] = useState([]);
  const [maintenanceHistory, setMaintenanceHistory] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load data on component mount
  useEffect(() => {
    // Simulate loading delay for UX
    const timer = setTimeout(() => {
      // Hardcoded asset categories data
      const categories = [
        {
          id: 'laptops',
          name: 'Laptops',
          category: 'Hardware',
          icon: 'pi pi-desktop',
          count: 45,
          value: 67500,
          policies: [
            { id: 1, name: 'Laptop Usage Policy', description: 'Guidelines for proper usage of company laptops' },
            { id: 2, name: 'Software Installation Policy', description: 'Rules regarding installation of software on company laptops' },
            { id: 3, name: 'Remote Work Policy', description: 'Policies for using company laptops while working remotely' }
          ]
        },
        {
          id: 'mobile',
          name: 'Mobile Devices',
          category: 'Hardware',
          icon: 'pi pi-mobile',
          count: 32,
          value: 38400,
          policies: [
            { id: 1, name: 'Mobile Device Usage Policy', description: 'Guidelines for proper usage of company mobile devices' },
            { id: 2, name: 'Data Security Policy', description: 'Rules for securing company data on mobile devices' }
          ]
        },
        {
          id: 'monitors',
          name: 'Monitors',
          category: 'Hardware',
          icon: 'pi pi-desktop',
          count: 27,
          value: 13500,
          policies: [
            { id: 1, name: 'Display Equipment Policy', description: 'Guidelines for proper usage and care of company monitors' }
          ]
        },
        {
          id: 'peripherals',
          name: 'Peripherals',
          category: 'Hardware',
          icon: 'pi pi-calculator',
          count: 64,
          value: 9600,
          policies: [
            { id: 1, name: 'Peripheral Equipment Policy', description: 'Guidelines for usage of company peripherals' }
          ]
        },
        {
          id: 'software',
          name: 'Software Licenses',
          category: 'Software',
          icon: 'pi pi-code',
          count: 120,
          value: 45000,
          policies: [
            { id: 1, name: 'Software License Policy', description: 'Rules regarding software licensing and compliance' },
            { id: 2, name: 'Software Usage Policy', description: 'Guidelines for proper usage of licensed software' }
          ]
        }
      ];

      // Hardcoded asset items data
      const items = [
        {
          deviceId: 'LAPTOP001',
          serialNumber: 'DX15987654',
          assignedTo: 'John Smith',
          department: 'Engineering',
          assignmentDate: '2022-03-20',
          specs: 'i7, 16GB RAM, 512GB SSD',
          status: 'In Use',
          categoryId: 'laptops'
        },
        {
          deviceId: 'LAPTOP002',
          serialNumber: 'MP13567890',
          assignedTo: 'Sarah Johnson',
          department: 'Design',
          assignmentDate: '2022-05-15',
          specs: 'M1 Pro, 16GB RAM, 1TB SSD',
          status: 'In Use',
          categoryId: 'laptops'
        },
        {
          deviceId: 'LAPTOP003',
          serialNumber: 'LT45678901',
          assignedTo: '',
          department: '',
          assignmentDate: '',
          specs: 'i5, 8GB RAM, 256GB SSD',
          status: 'In Storage',
          categoryId: 'laptops'
        }
      ];

      // Hardcoded asset details data
      const details = [
        {
          deviceId: 'LAPTOP001',
          assetTag: 'LAPTOP001',
          itemId: 'laptops',
          model: 'Dell XPS 15',
          serialNumber: 'DX15987654',
          status: 'Assigned',
          condition: 'Good',
          purchaseDate: '2022-03-15',
          assignedTo: 'John Smith',
          department: 'Engineering',
          assignmentDate: '2022-03-20',
          expectedReturn: '2024-03-20',
          specs: 'i7, 16GB RAM, 512GB SSD',
          vendor: 'Dell',
          purchaseCost: 1500,
          warrantyExpiration: '2025-03-15',
          currentValue: 1200,
          lastUpdated: '2023-01-10',
          notes: 'Minor scratch on lid',
          policies: [
            { id: 1, name: 'Laptop Usage Policy', description: 'Guidelines for proper usage of company laptops' },
            { id: 2, name: 'Data Security Policy', description: 'Rules for securing company data on laptops' }
          ]
        },
        {
          deviceId: 'LAPTOP002',
          assetTag: 'LAPTOP002',
          itemId: 'laptops',
          model: 'MacBook Pro',
          serialNumber: 'MP13567890',
          status: 'Assigned',
          condition: 'Excellent',
          purchaseDate: '2022-05-10',
          assignedTo: 'Sarah Johnson',
          department: 'Design',
          assignmentDate: '2022-05-15',
          expectedReturn: '2024-05-15',
          specs: 'M1 Pro, 16GB RAM, 1TB SSD',
          vendor: 'Apple',
          purchaseCost: 1800,
          warrantyExpiration: '2025-05-10',
          currentValue: 1500,
          lastUpdated: '2022-12-05',
          notes: '',
          policies: [
            { id: 1, name: 'Laptop Usage Policy', description: 'Guidelines for proper usage of company laptops' },
            { id: 3, name: 'Design Software Policy', description: 'Guidelines for design software usage on company laptops' }
          ]
        },
        {
          deviceId: 'LAPTOP003',
          assetTag: 'LAPTOP003',
          itemId: 'laptops',
          model: 'Lenovo ThinkPad',
          serialNumber: 'LT45678901',
          status: 'In Storage',
          condition: 'Good',
          purchaseDate: '2021-11-20',
          assignedTo: '',
          department: '',
          assignmentDate: '',
          expectedReturn: '',
          specs: 'i5, 8GB RAM, 256GB SSD',
          vendor: 'Lenovo',
          purchaseCost: 1100,
          warrantyExpiration: '2024-11-20',
          currentValue: 800,
          lastUpdated: '2023-02-18',
          notes: 'Battery replaced in January 2023',
          policies: [
            { id: 1, name: 'Laptop Usage Policy', description: 'Guidelines for proper usage of company laptops' }
          ]
        }
      ];

      // Hardcoded assignment history data
      const assignmentHist = [
        {
          id: 1,
          deviceId: 'LAPTOP001',
          assignedTo: 'John Smith',
          department: 'Engineering',
          assignmentDate: '2022-03-20',
          returnDate: '',
          notes: 'Primary work laptop'
        },
        {
          id: 2,
          deviceId: 'LAPTOP001',
          assignedTo: 'Alex Rodriguez',
          department: 'Engineering',
          assignmentDate: '2021-06-15',
          returnDate: '2022-03-10',
          notes: 'Returned due to upgrade'
        },
        {
          id: 3,
          deviceId: 'LAPTOP002',
          assignedTo: 'Sarah Johnson',
          department: 'Design',
          assignmentDate: '2022-05-15',
          returnDate: '',
          notes: 'Primary design workstation'
        }
      ];

      // Hardcoded maintenance history data
      const maintenanceHist = [
        {
          id: 1,
          deviceId: 'LAPTOP001',
          maintenanceType: 'Repair',
          technician: 'IT Support',
          maintenanceDate: '2022-10-15',
          completedDate: '2022-10-18',
          cost: 120,
          notes: 'Fixed keyboard issue'
        },
        {
          id: 2,
          deviceId: 'LAPTOP003',
          maintenanceType: 'Battery Replacement',
          technician: 'Service Center',
          maintenanceDate: '2023-01-10',
          completedDate: '2023-01-10',
          cost: 85,
          notes: 'Replaced with new OEM battery'
        }
      ];

      // Hardcoded documents data
      const docs = [
        {
          id: 1,
          deviceId: 'LAPTOP001',
          filename: 'warranty_laptop001.pdf',
          fileType: 'Warranty',
          uploadDate: '2022-03-15',
          uploadedBy: 'System Admin'
        },
        {
          id: 2,
          deviceId: 'LAPTOP001',
          filename: 'repair_report_oct2022.pdf',
          fileType: 'Repair',
          uploadDate: '2022-10-18',
          uploadedBy: 'IT Support'
        },
        {
          id: 3,
          deviceId: 'LAPTOP002',
          filename: 'warranty_laptop002.pdf',
          fileType: 'Warranty',
          uploadDate: '2022-05-10',
          uploadedBy: 'System Admin'
        }
      ];

      // Update state with hardcoded data
      setAssetCategories(categories);
      setAssetItems(items);
      setAssetDetails(details);
      setAssignmentHistory(assignmentHist);
      setMaintenanceHistory(maintenanceHist);
      setDocuments(docs);
      
      console.log("App loaded hardcoded data:", {
        categories,
        items,
        details,
        assignmentHist,
        maintenanceHist,
        docs
      });
      
      setLoading(false);
    }, 800); // Simulate loading time of 800ms

    return () => clearTimeout(timer);
  }, []);

  // Function to add a new asset category (would be passed to AssetInventory)
  const addAssetCategory = (newCategory) => {
    setAssetCategories([...assetCategories, newCategory]);
  };

  // Function to delete an asset category
  const deleteAssetCategory = (categoryId) => {
    console.log("Deleting asset category:", categoryId);
    
    // Remove the category
    setAssetCategories(assetCategories.filter(category => category.id !== categoryId));
    
    // Also remove all associated items
    setAssetItems(assetItems.filter(item => item.categoryId !== categoryId));
    
    // And remove all related asset details
    setAssetDetails(assetDetails.filter(detail => detail.itemId !== categoryId));
    
    console.log("Category and associated items deleted");
  };

  // Function to add a new asset item (would be passed to AssetTable)
  const addAssetItem = (newItem) => {
    setAssetItems([...assetItems, newItem]);
  };

  // Function to get asset by ID (would be passed to AssetDetail)
  const getAssetById = (id) => {
    // First try to find in our loaded data
    const foundAsset = assetDetails.find(asset => asset.deviceId === id);
    if (foundAsset) {
      console.log("Found asset in data:", foundAsset);
      return foundAsset;
    }
    
    // If not found, provide sample data for laptop items
    if (id === 'LAPTOP001' || id === 'LAPTOP002' || id === 'LAPTOP003') {
      console.log("Using hardcoded data for:", id);
      
      // Sample data for laptop assets
      const sampleAssets = {
        'LAPTOP001': {
          deviceId: 'LAPTOP001',
          assetTag: 'LAPTOP001',
          itemId: 'laptops',
          model: 'Dell XPS 15',
          serialNumber: 'DX15987654',
          status: 'Assigned',
          condition: 'Good',
          purchaseDate: '2022-03-15',
          assignedTo: 'John Smith',
          department: 'Engineering',
          assignmentDate: '2022-03-20',
          expectedReturn: '2024-03-20',
          specs: 'i7, 16GB RAM, 512GB SSD',
          vendor: 'Dell',
          purchaseCost: 1500,
          warrantyExpiration: '2025-03-15',
          currentValue: 1200,
          lastUpdated: '2023-01-10',
          notes: 'Minor scratch on lid',
          policies: [
            { id: 1, name: 'Laptop Usage Policy', description: 'Guidelines for proper usage of company laptops' },
            { id: 2, name: 'Data Security Policy', description: 'Rules for securing company data on laptops' }
          ]
        },
        'LAPTOP002': {
          deviceId: 'LAPTOP002',
          assetTag: 'LAPTOP002',
          itemId: 'laptops',
          model: 'MacBook Pro',
          serialNumber: 'MP13567890',
          status: 'Assigned',
          condition: 'Excellent',
          purchaseDate: '2022-05-10',
          assignedTo: 'Sarah Johnson',
          department: 'Design',
          assignmentDate: '2022-05-15',
          expectedReturn: '2024-05-15',
          specs: 'M1 Pro, 16GB RAM, 1TB SSD',
          vendor: 'Apple',
          purchaseCost: 1800,
          warrantyExpiration: '2025-05-10',
          currentValue: 1500,
          lastUpdated: '2022-12-05',
          notes: '',
          policies: [
            { id: 1, name: 'Laptop Usage Policy', description: 'Guidelines for proper usage of company laptops' },
            { id: 3, name: 'Design Software Policy', description: 'Guidelines for design software usage on company laptops' }
          ]
        },
        'LAPTOP003': {
          deviceId: 'LAPTOP003',
          assetTag: 'LAPTOP003',
          itemId: 'laptops',
          model: 'Lenovo ThinkPad',
          serialNumber: 'LT45678901',
          status: 'In Storage',
          condition: 'Good',
          purchaseDate: '2021-11-20',
          assignedTo: '',
          department: '',
          assignmentDate: '',
          expectedReturn: '',
          specs: 'i5, 8GB RAM, 256GB SSD',
          vendor: 'Lenovo',
          purchaseCost: 1100,
          warrantyExpiration: '2024-11-20',
          currentValue: 800,
          lastUpdated: '2023-02-18',
          notes: 'Battery replaced in January 2023',
          policies: [
            { id: 1, name: 'Laptop Usage Policy', description: 'Guidelines for proper usage of company laptops' }
          ]
        }
      };
      
      return sampleAssets[id] || null;
    }
    
    return null;
  };

  // Function to update asset details
  const updateAssetDetails = (updatedAsset) => {
    console.log("Updating asset details:", updatedAsset);
    
    // Check if this is a sample data asset
    if (['LAPTOP001', 'LAPTOP002', 'LAPTOP003'].includes(updatedAsset.deviceId)) {
      console.log("This is a sample asset - would update if real data");
      // In real app, we would update the data here
      // For now, just log that we would update
      return;
    }
    
    // Update the actual asset details
    setAssetDetails(assetDetails.map(asset => 
      asset.deviceId === updatedAsset.deviceId ? updatedAsset : asset
    ));
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          {/* Redirect root to asset inventory */}
          <Route index element={<Navigate to="/asset-inventory" replace />} />
          
          {/* Asset Inventory routes */}
          <Route path="asset-inventory">
            {/* Main asset inventory listing */}
            <Route index element={
              <AssetInventory 
                assets={assetCategories} 
                loading={loading}
                addAssetCategory={addAssetCategory}
                deleteAssetCategory={deleteAssetCategory}
              />
            } />
            
            {/* Asset detail page - must come before the /:id/table route */}
            <Route path=":id" element={
              <AssetDetail 
                assetDetails={assetDetails}
                assetCategories={assetCategories}
                assignmentHistory={assignmentHistory}
                maintenanceHistory={maintenanceHistory}
                documents={documents}
                loading={loading}
                getAssetById={getAssetById}
                updateAssetDetails={updateAssetDetails}
              />
            } />
            
            {/* Asset table page showing items in a category */}
            <Route path=":id/table" element={
              <AssetTable 
                assetItems={assetItems} 
                assetCategories={assetCategories}
                loading={loading}
                addAssetItem={addAssetItem}
              />
            } />
          </Route>
          
          {/* Redirect other menu items to asset inventory (not yet implemented) */}
          <Route path="dashboard" element={<Navigate to="/asset-inventory" replace />} />
          <Route path="employee-assets" element={<Navigate to="/asset-inventory" replace />} />
          <Route path="requests" element={<Navigate to="/asset-inventory" replace />} />
          <Route path="maintenance" element={<Navigate to="/asset-inventory" replace />} />
          <Route path="reports" element={<Navigate to="/asset-inventory" replace />} />
          <Route path="settings" element={<Navigate to="/asset-inventory" replace />} />
          
          {/* Fallback for any unmatched routes */}
          <Route path="*" element={<Navigate to="/asset-inventory" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;