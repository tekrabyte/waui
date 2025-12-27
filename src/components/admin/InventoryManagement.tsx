import React from 'react';
import { InventoryItem } from '../../types';
import { AlertTriangle, RefreshCw } from 'lucide-react';
const MOCK_INVENTORY: (InventoryItem & {
  productName: string;
})[] = [{
  productId: '1',
  productName: 'Cappuccino Beans',
  currentStock: 15,
  minStock: 20,
  maxStock: 100,
  lastUpdated: '2024-03-20'
}, {
  productId: '2',
  productName: 'Milk Cartons',
  currentStock: 45,
  minStock: 10,
  maxStock: 50,
  lastUpdated: '2024-03-21'
}, {
  productId: '3',
  productName: 'Chocolate Syrup',
  currentStock: 5,
  minStock: 10,
  maxStock: 30,
  lastUpdated: '2024-03-19'
}];
export function InventoryManagement() {
  return <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Inventory Management
          </h1>
          <p className="text-gray-500">Track stock levels and reorder points</p>
        </div>
        <button className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-50 transition-colors">
          <RefreshCw size={20} />
          Sync Stock
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 font-medium text-gray-500 text-sm">
                Item Name
              </th>
              <th className="px-6 py-4 font-medium text-gray-500 text-sm">
                Current Stock
              </th>
              <th className="px-6 py-4 font-medium text-gray-500 text-sm">
                Status
              </th>
              <th className="px-6 py-4 font-medium text-gray-500 text-sm">
                Last Updated
              </th>
              <th className="px-6 py-4 font-medium text-gray-500 text-sm text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {MOCK_INVENTORY.map(item => {
            const isLowStock = item.currentStock <= item.minStock;
            return <tr key={item.productId} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {item.productName}
                  </td>
                  <td className="px-6 py-4">
                    <div className="w-full max-w-[100px] bg-gray-200 rounded-full h-2.5 mb-1">
                      <div className={`h-2.5 rounded-full ${isLowStock ? 'bg-red-500' : 'bg-green-500'}`} style={{
                    width: `${item.currentStock / item.maxStock * 100}%`
                  }}></div>
                    </div>
                    <span className="text-xs text-gray-500">
                      {item.currentStock} / {item.maxStock} units
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {isLowStock ? <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        <AlertTriangle size={12} /> Low Stock
                      </span> : <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        In Stock
                      </span>}
                  </td>
                  <td className="px-6 py-4 text-gray-500 text-sm">
                    {item.lastUpdated}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-[#008069] font-medium text-sm hover:underline">
                      Restock
                    </button>
                  </td>
                </tr>;
          })}
          </tbody>
        </table>
      </div>
    </div>;
}