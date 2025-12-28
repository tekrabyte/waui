import { useState, useEffect } from 'react';

// Mock hook untuk Internet Identity agar KioskPage tidak error
export const useInternetIdentity = () => {
  const [identity, setIdentity] = useState<any>(null);

  useEffect(() => {
    // Cek local storage sebagai mock session
    const user = localStorage.getItem('posq_user');
    if (user) {
      setIdentity(JSON.parse(user));
    }
  }, []);

  const login = async () => {
    // Redirect ke halaman login yang ada
    window.location.href = '/login';
  };

  const logout = async () => {
    localStorage.removeItem('posq_user');
    setIdentity(null);
  };

  return {
    identity,
    login,
    logout,
    isAuthenticated: !!identity
  };
};