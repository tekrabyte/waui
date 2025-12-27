import React, { useState } from 'react';
import { Product } from '../../types';
import { Plus, Edit2, Trash2, Image as ImageIcon } from 'lucide-react';
// Using existing PRODUCTS mock data structure
const MOCK_PRODUCTS: Product[] = [{
  id: '1',
  name: 'Cappuccino',
  price: 4.5,
  category: 'beverages',
  available: true,
  image: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=400&q=80'
}, {
  id: '2',
  name: 'Club Sandwich',
  price: 12.5,
  category: 'meals',
  available: true,
  image: 'https://images.unsplash.com/photo-1567234669003-dce7a7a88821?w=400&q=80'
}, {
  id: '3',
  name: 'Chocolate Cake',
  price: 6.5,
  category: 'desserts',
  available: false,
  image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&q=80'
}];
export function ProductManagement() {
  const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS);
  return <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Product Management
          </h1>
          <p className="text-gray-500">Manage catalog and pricing</p>
        </div>
        <button className="bg-[#008069] text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-[#006a57] transition-colors">
          <Plus size={20} />
          Add Product
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 font-medium text-gray-500 text-sm">
                Product
              </th>
              <th className="px-6 py-4 font-medium text-gray-500 text-sm">
                Category
              </th>
              <th className="px-6 py-4 font-medium text-gray-500 text-sm">
                Price
              </th>
              <th className="px-6 py-4 font-medium text-gray-500 text-sm">
                Status
              </th>
              <th className="px-6 py-4 font-medium text-gray-500 text-sm text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {products.map(product => <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                      {product.image ? <img src={product.image} alt={product.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <ImageIcon size={20} />
                        </div>}
                    </div>
                    <div className="font-medium text-gray-900">
                      {product.name}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="capitalize bg-gray-100 text-gray-600 px-2 py-1 rounded-md text-sm">
                    {product.category}
                  </span>
                </td>
                <td className="px-6 py-4 font-medium text-gray-900">
                  ${product.price.toFixed(2)}
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${product.available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {product.available ? 'Available' : 'Unavailable'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button className="p-2 text-gray-400 hover:text-[#008069] hover:bg-[#008069]/10 rounded-lg transition-colors">
                      <Edit2 size={18} />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>)}
          </tbody>
        </table>
      </div>
    </div>;
}