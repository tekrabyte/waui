import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Lock, User } from 'lucide-react';

interface LoginPageProps {
  onLogin: (email: string, role: 'owner' | 'admin' | 'cashier') => void;
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  // Fungsi login diperbarui menggunakan async/await dan fetch ke API WordPress
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Melakukan request ke Backend WordPress Anda
      const response = await fetch('https://erpos.tekrabyte.id/wp-json/posq/v1/auth/login', {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ 
          username: email, // API WP mengharapkan 'username'
          password: password 
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // 1. Simpan Token (Penting untuk request selanjutnya)
        localStorage.setItem('posq_token', data.token);
        
        // 2. Simpan data user jika perlu (opsional)
        localStorage.setItem('posq_user', JSON.stringify(data.user));

        // 3. Panggil fungsi onLogin dari parent (App.tsx)
        // Pastikan backend mengirim role yang valid, atau default ke 'cashier'
        const userRole = data.user.role || 'cashier';
        onLogin(data.user.email, userRole);
      } else {
        // Menangani pesan error dari API
        setError(data.message || 'Invalid email or password');
      }

    } catch (err) {
      console.error('Login Error:', err);
      setError('Connection failed. Please check your internet or server.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#d1d7db] flex items-center justify-center relative overflow-hidden">
      {/* Background decoration strip (WhatsApp web style) */}
      <div className="fixed top-0 left-0 w-full h-32 bg-[#00a884] z-0" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="relative z-10 w-full max-w-md p-4"
      >
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-[#008069] p-8 text-center">
            <div className="w-20 h-20 bg-white rounded-full mx-auto flex items-center justify-center mb-4 shadow-md">
              <div className="text-[#008069] font-bold text-3xl">WP</div>
            </div>
            <h1 className="text-white text-2xl font-bold">WhatsApp POS</h1>
            <p className="text-white/80 text-sm mt-1">
              Sign in to manage your store
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="p-8 pt-6">
            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-500 text-sm rounded-lg flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                {error}
              </div>
            )}

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User size={18} className="text-gray-400" />
                  </div>
                  <input 
                    type="text" // Ubah ke text agar bisa input username juga jika perlu
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-[#008069] focus:border-[#008069] transition-colors" 
                    placeholder="Enter your email or username" 
                    required 
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock size={18} className="text-gray-400" />
                  </div>
                  <input 
                    type={showPassword ? 'text' : 'password'} 
                    value={password} 
                    onChange={e => setPassword(e.target.value)} 
                    className="block w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-[#008069] focus:border-[#008069] transition-colors" 
                    placeholder="Enter your password" 
                    required 
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)} 
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={rememberMe} 
                    onChange={e => setRememberMe(e.target.checked)} 
                    className="h-4 w-4 text-[#008069] focus:ring-[#008069] border-gray-300 rounded" 
                  />
                  <span className="ml-2 text-sm text-gray-600">
                    Remember me
                  </span>
                </label>
                <a href="#" className="text-sm text-[#008069] hover:underline font-medium">
                  Forgot password?
                </a>
              </div>

              <button 
                type="submit" 
                disabled={isLoading} 
                className="w-full bg-[#008069] text-white py-3 rounded-lg font-bold shadow-md hover:bg-[#006a57] active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : 'Sign In'}
              </button>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-100 text-center">
              <p className="text-xs text-gray-400">
                Gunakan kredensial WordPress Anda
              </p>
            </div>
          </form>
        </div>

        <p className="text-center text-gray-500 text-xs mt-6">
          © 2024 WhatsApp POS System. All rights reserved.
        </p>
      </motion.div>
    </div>
  );
}