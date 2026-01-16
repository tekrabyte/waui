import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Phone, MapPin, Lock, Mail, Shield, LogOut, Camera, ChevronRight, Key, Smartphone } from 'lucide-react';
import { Avatar } from './ui/Avatar';
interface SettingsViewProps {
  onLogout: () => void;
}
export function SettingsView({
  onLogout
}: SettingsViewProps) {
  const [profile, setProfile] = useState({
    name: 'John Doe',
    bio: 'Store Manager at Downtown Branch',
    phone: '+1 234 567 890',
    address: '123 Main St, New York, NY',
    email: 'john.doe@example.com'
  });
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const SettingItem = ({
    icon: Icon,
    label,
    value,
    onClick,
    isDestructive = false,
    showChevron = true
  }: any) => <motion.button whileTap={{
    backgroundColor: '#f5f5f5'
  }} onClick={onClick} className="w-full flex items-center p-4 bg-white border-b border-gray-100 last:border-0">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-4 ${isDestructive ? 'bg-red-50 text-red-500' : 'bg-[#008069]/10 text-[#008069]'}`}>
        <Icon size={20} />
      </div>
      <div className="flex-1 text-left">
        <h3 className={`font-medium ${isDestructive ? 'text-red-500' : 'text-gray-900'}`}>
          {label}
        </h3>
        {value && <p className="text-sm text-gray-500 mt-0.5">{value}</p>}
      </div>
      {showChevron && <ChevronRight size={20} className="text-gray-300" />}
    </motion.button>;
  const SectionHeader = ({
    title
  }: {
    title: string;
  }) => <div className="px-4 py-3 bg-gray-50 text-sm font-bold text-[#008069] uppercase tracking-wider">
      {title}
    </div>;
  return <div className="bg-gray-50 min-h-full pb-20">
      {/* Profile Header */}
      <div className="bg-white p-6 flex flex-col items-center border-b border-gray-200 mb-2">
        <div className="relative mb-4">
          <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-gray-100">
            <Avatar alt={profile.name} size="lg" />
          </div>
          <button className="absolute bottom-0 right-0 bg-[#008069] text-white p-2 rounded-full shadow-lg">
            <Camera size={16} />
          </button>
        </div>
        <h2 className="text-xl font-bold text-gray-900">{profile.name}</h2>
        <p className="text-gray-500 text-sm mt-1">{profile.bio}</p>
      </div>

      {/* Profile Details */}
      <div className="bg-white mb-2 shadow-sm">
        <SectionHeader title="Profile Details" />
        <SettingItem icon={User} label="Name" value={profile.name} onClick={() => {}} />
        <SettingItem icon={Phone} label="Phone" value={profile.phone} onClick={() => {}} />
        <SettingItem icon={MapPin} label="Address" value={profile.address} onClick={() => {}} />
        <SettingItem icon={User} label="Bio" value={profile.bio} onClick={() => {}} />
      </div>

      {/* Security */}
      <div className="bg-white mb-2 shadow-sm">
        <SectionHeader title="Security" />
        <SettingItem icon={Mail} label="Email Address" value={profile.email} onClick={() => {}} />
        <SettingItem icon={Key} label="Change Password" onClick={() => {}} />
        <div className="flex items-center justify-between p-4 bg-white border-b border-gray-100">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-[#008069]/10 text-[#008069] flex items-center justify-center mr-4">
              <Shield size={20} />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Two-Factor Auth</h3>
              <p className="text-sm text-gray-500">Secure your account</p>
            </div>
          </div>
          <button onClick={() => setIs2FAEnabled(!is2FAEnabled)} className={`w-12 h-6 rounded-full p-1 transition-colors ${is2FAEnabled ? 'bg-[#25D366]' : 'bg-gray-300'}`}>
            <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${is2FAEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
          </button>
        </div>
      </div>

      {/* Account Actions */}
      <div className="bg-white shadow-sm mt-4">
        <SettingItem icon={LogOut} label="Log Out" isDestructive showChevron={false} onClick={() => {
        if (confirm('Are you sure you want to log out?')) {
          onLogout();
        }
      }} />
      </div>

      <div className="p-8 text-center text-gray-400 text-xs">
        <p>WhatsApp POS v1.0.0</p>
        <p className="mt-1">© 2024 Magic Patterns</p>
      </div>
    </div>;
}