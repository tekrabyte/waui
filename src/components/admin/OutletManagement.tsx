import React, { useState } from 'react';
import { Outlet } from '../../types';
import { Plus, Edit2, Trash2, MapPin, Phone, User } from 'lucide-react';
// Mock Data
const MOCK_OUTLETS: Outlet[] = [{
  id: '1',
  name: 'Downtown Branch',
  address: '123 Main St, New York',
  phone: '+1 234 567 890',
  manager: 'John Doe',
  status: 'active'
}, {
  id: '2',
  name: 'Westside Mall',
  address: '456 West Ave, New York',
  phone: '+1 987 654 321',
  manager: 'Jane Smith',
  status: 'active'
}, {
  id: '3',
  name: 'Airport Kiosk',
  address: 'Terminal 4, JFK Airport',
  phone: '+1 555 123 456',
  manager: 'Mike Johnson',
  status: 'inactive'
}];
export function OutletManagement() {
  const [outlets, setOutlets] = useState<Outlet[]>(MOCK_OUTLETS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this outlet?')) {
      setOutlets(prev => prev.filter(o => o.id !== id));
    }
  };
  return <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Outlet Management
          </h1>
          <p className="text-gray-500">
            Manage your store locations and branches
          </p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="bg-[#008069] text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-[#006a57] transition-colors">
          <Plus size={20} />
          Add Outlet
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 font-medium text-gray-500 text-sm">
                Outlet Name
              </th>
              <th className="px-6 py-4 font-medium text-gray-500 text-sm">
                Location
              </th>
              <th className="px-6 py-4 font-medium text-gray-500 text-sm">
                Manager
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
            {outlets.map(outlet => <tr key={outlet.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="font-medium text-gray-900">{outlet.name}</div>
                  <div className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                    <Phone size={12} /> {outlet.phone}
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-600">
                  <div className="flex items-center gap-2">
                    <MapPin size={16} className="text-gray-400" />
                    {outlet.address}
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-600">
                  <div className="flex items-center gap-2">
                    <User size={16} className="text-gray-400" />
                    {outlet.manager}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${outlet.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {outlet.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button className="p-2 text-gray-400 hover:text-[#008069] hover:bg-[#008069]/10 rounded-lg transition-colors">
                      <Edit2 size={18} />
                    </button>
                    <button onClick={() => handleDelete(outlet.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
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