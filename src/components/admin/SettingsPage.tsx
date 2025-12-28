import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

export default function SettingsPage() {
  const [config, setConfig] = useState({
    enableStockTracking: true,
    enableEmailNotifications: false
  });

  const handleSave = () => {
    // Simulasi save ke local storage atau API
    localStorage.setItem('app_settings', JSON.stringify(config));
    toast.success("Pengaturan disimpan");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Pengaturan</h1>
        <p className="text-muted-foreground">Konfigurasi sistem aplikasi</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Preferensi Umum</CardTitle>
          <CardDescription>Sesuaikan bagaimana aplikasi bekerja</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Pelacakan Stok</Label>
              <p className="text-sm text-muted-foreground">Kurangi stok otomatis saat transaksi</p>
            </div>
            <Switch 
              checked={config.enableStockTracking} 
              onCheckedChange={v => setConfig({...config, enableStockTracking: v})} 
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Notifikasi Email</Label>
              <p className="text-sm text-muted-foreground">Terima laporan harian via email</p>
            </div>
            <Switch 
              checked={config.enableEmailNotifications} 
              onCheckedChange={v => setConfig({...config, enableEmailNotifications: v})} 
            />
          </div>
          <div className="pt-4 flex justify-end">
            <Button onClick={handleSave}>Simpan Perubahan</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}