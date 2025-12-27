import React, { useState } from 'react';
import { Staff } from '../../types';
import { Plus, Edit2, Trash2, Mail, Shield } from 'lucide-react';
const MOCK_STAFF: Staff[] = [{
  id: '1',
  name: 'John Doe',
  email: 'john@example.com',
  role: 'manager',
  outletId: '1',
  status: 'active'
}, {
  id: '2',
  name: 'Alice Cooper',
  email: 'alice@example.com',
  role: 'cashier',
  outletId: '1',
  status: 'active'
}, {
  id: '3',
  name: 'Bob Wilson',
  email: 'bob@example.com',
  role: 'admin',
  outletId: 'all',
  status: 'active'
}];
export function StaffManagement() {
  const [staff, setStaff] = useState<Staff[]>(MOCK_STAFF);
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-800';
      case 'manager':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  return <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Staff Management</h1>
          <p className="text-gray-500">Manage employees and permissions</p>
        </div>
        <button className="bg-[#008069] text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-[#006a57] transition-colors">
          <Plus size={20} />
          Add Staff
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 font-medium text-gray-500 text-sm">
                Employee
              </th>
              <th className="px-6 py-4 font-medium text-gray-500 text-sm">
                Role
              </th>
              <th className="px-6 py-4 font-medium text-gray-500 text-sm">
                Outlet
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
            {staff.map(person => <tr key={person.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold">
                      {person.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">
                        {person.name}
                      </div>
                      <div className="text-sm text-gray-500 flex items-center gap-1">
                        <Mail size={12} /> {person.email}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(person.role)}`}>
                    {person.role}
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-600">
                  {person.outletId === 'all' ? 'All Outlets' : `Outlet #${person.outletId}`}
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${person.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {person.status}
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