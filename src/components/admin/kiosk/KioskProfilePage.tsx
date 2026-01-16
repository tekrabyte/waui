import { useState, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useInternetIdentity } from '../../hooks/useInternetIdentity';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { User, LogIn, UserCog, LogOut } from 'lucide-react';
import { toast } from 'sonner';

const GUEST_DATA_KEY = 'kiosk_guest_data';

interface GuestProfileData {
  name: string;
  phone: string;
  address: string;
}

export default function KioskProfilePage() {
  const navigate = useNavigate();
  const { identity, login, clear } = useInternetIdentity();
  const [guestData, setGuestData] = useState<GuestProfileData>({
    name: '',
    phone: '',
    address: '',
  });

  const isAuthenticated = !!identity;

  useEffect(() => {
    const savedData = localStorage.getItem(GUEST_DATA_KEY);
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        setGuestData(parsed);
      } catch (e) {
        console.error('Failed to parse guest data:', e);
      }
    }
  }, []);

  const handleSaveGuestData = () => {
    if (!guestData.name || !guestData.phone) {
      toast.error('Nama dan nomor HP wajib diisi');
      return;
    }

    localStorage.setItem(GUEST_DATA_KEY, JSON.stringify(guestData));
    toast.success('Data profil berhasil disimpan');
  };

  const handleLogin = async () => {
    try {
      await login();
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await clear();
      toast.success('Berhasil logout');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleStaffLogin = () => {
    navigate({ to: '/login' });
  };

  return (
    <div className="min-h-screen bg-white pb-20">
      {/* Header */}
      <div className="border-b bg-white sticky top-0 z-40">
        <div className="px-4 py-4">
          <div className="flex items-center gap-3">
            <User className="h-6 w-6 text-[#1D6FFF]" />
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Profil</h1>
              <p className="text-sm text-gray-600">
                {isAuthenticated ? 'Informasi akun Anda' : 'Kelola data profil Anda'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-6 space-y-4">
        {isAuthenticated ? (
          <>
            <Card style={{ borderRadius: 0 }}>
              <CardHeader>
                <CardTitle>Informasi Akun</CardTitle>
                <CardDescription>Anda sudah login sebagai customer</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3 p-4 bg-gray-100">
                  <div className="h-12 w-12 bg-[#1D6FFF]/10 flex items-center justify-center">
                    <User className="h-6 w-6 text-[#1D6FFF]" />
                  </div>
                  <div>
                    <p className="font-medium">Customer</p>
                    <p className="text-sm text-gray-600">Status: Aktif</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button 
              onClick={handleLogout} 
              variant="outline" 
              className="w-full"
              style={{ borderRadius: 0 }}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </>
        ) : (
          <>
            <Card style={{ borderRadius: 0 }}>
              <CardHeader>
                <CardTitle>Data Profil Tamu</CardTitle>
                <CardDescription>Simpan data Anda untuk checkout lebih cepat</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nama Lengkap *</Label>
                  <Input
                    id="name"
                    placeholder="Masukkan nama lengkap"
                    value={guestData.name}
                    onChange={(e) => setGuestData({ ...guestData, name: e.target.value })}
                    style={{ borderRadius: 0 }}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Nomor HP *</Label>
                  <Input
                    id="phone"
                    placeholder="08xxxxxxxxxx"
                    value={guestData.phone}
                    onChange={(e) => setGuestData({ ...guestData, phone: e.target.value })}
                    style={{ borderRadius: 0 }}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Alamat</Label>
                  <Textarea
                    id="address"
                    placeholder="Masukkan alamat lengkap"
                    value={guestData.address}
                    onChange={(e) => setGuestData({ ...guestData, address: e.target.value })}
                    rows={3}
                    style={{ borderRadius: 0 }}
                  />
                </div>

                <Button 
                  onClick={handleSaveGuestData} 
                  className="w-full bg-[#1D6FFF] hover:bg-[#1557CC] text-white"
                  style={{ borderRadius: 0 }}
                >
                  Simpan Data
                </Button>
              </CardContent>
            </Card>

            <Card style={{ borderRadius: 0 }}>
              <CardHeader>
                <CardTitle>Login</CardTitle>
                <CardDescription>Login untuk menyimpan data secara permanen</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  onClick={handleLogin} 
                  className="w-full bg-[#1D6FFF] hover:bg-[#1557CC] text-white"
                  style={{ borderRadius: 0 }}
                >
                  <LogIn className="mr-2 h-4 w-4" />
                  Login Customer
                </Button>
                <Button 
                  onClick={handleStaffLogin} 
                  variant="outline" 
                  className="w-full"
                  style={{ borderRadius: 0 }}
                >
                  <UserCog className="mr-2 h-4 w-4" />
                  Login Staff/Owner
                </Button>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
