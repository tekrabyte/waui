import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import type { PromoConfig } from '../types/types';

interface PromoConfigFormProps {
  config: Partial<PromoConfig>;
  onChange: (config: Partial<PromoConfig>) => void;
  disabled?: boolean;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function PromoConfigForm({ config, onChange, disabled = false }: PromoConfigFormProps) {
  const handleToggleDay = (day: string) => {
    const currentDays = config.promoDays || [];
    const newDays = currentDays.includes(day)
      ? currentDays.filter(d => d !== day)
      : [...currentDays, day];
    onChange({ ...config, promoDays: newDays });
  };

  return (
    <div className="space-y-4">
      {/* Enable Promo */}
      <div className="flex items-center justify-between">
        <Label htmlFor="promo-enabled">Aktifkan Promo</Label>
        <Switch
          id="promo-enabled"
          checked={config.promoEnabled || false}
          onCheckedChange={(checked) => onChange({ ...config, promoEnabled: checked })}
          disabled={disabled}
        />
      </div>

      {config.promoEnabled && (
        <>
          {/* Promo Type */}
          <div className="space-y-2">
            <Label>Tipe Promo</Label>
            <Select
              value={config.promoType || 'fixed'}
              onValueChange={(value: 'fixed' | 'percentage') => onChange({ ...config, promoType: value })}
              disabled={disabled}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih tipe promo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fixed">Potongan Harga (Rp)</SelectItem>
                <SelectItem value="percentage">Persentase (%)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Promo Value */}
          <div className="space-y-2">
            <Label>Nilai Promo</Label>
            <Input
              type="number"
              value={config.promoValue || ''}
              onChange={(e) => onChange({ ...config, promoValue: parseFloat(e.target.value) || 0 })}
              placeholder={config.promoType === 'percentage' ? 'Contoh: 20' : 'Contoh: 10000'}
              disabled={disabled}
            />
            <p className="text-xs text-muted-foreground">
              {config.promoType === 'percentage' ? 'Diskon dalam persen (%)' : 'Potongan harga dalam Rupiah'}
            </p>
          </div>

          {/* Promo Days */}
          <div className="space-y-2">
            <Label>Hari Berlaku</Label>
            <div className="grid grid-cols-2 gap-2">
              {DAYS.map((day) => (
                <div key={day} className="flex items-center space-x-2">
                  <Checkbox
                    id={`day-${day}`}
                    checked={(config.promoDays || []).includes(day)}
                    onCheckedChange={() => handleToggleDay(day)}
                    disabled={disabled}
                  />
                  <Label htmlFor={`day-${day}`} className="text-sm font-normal cursor-pointer">
                    {day}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Time Range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Jam Mulai</Label>
              <Input
                type="time"
                value={config.promoStartTime || ''}
                onChange={(e) => onChange({ ...config, promoStartTime: e.target.value })}
                disabled={disabled}
              />
            </div>
            <div className="space-y-2">
              <Label>Jam Selesai</Label>
              <Input
                type="time"
                value={config.promoEndTime || ''}
                onChange={(e) => onChange({ ...config, promoEndTime: e.target.value })}
                disabled={disabled}
              />
            </div>
          </div>

          {/* Date Range (Optional) */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tanggal Mulai (Opsional)</Label>
              <Input
                type="date"
                value={config.promoStartDate || ''}
                onChange={(e) => onChange({ ...config, promoStartDate: e.target.value })}
                disabled={disabled}
              />
            </div>
            <div className="space-y-2">
              <Label>Tanggal Selesai (Opsional)</Label>
              <Input
                type="date"
                value={config.promoEndDate || ''}
                onChange={(e) => onChange({ ...config, promoEndDate: e.target.value })}
                disabled={disabled}
              />
            </div>
          </div>

          {/* Min Purchase (Optional) */}
          <div className="space-y-2">
            <Label>Minimum Pembelian (Opsional)</Label>
            <Input
              type="number"
              value={config.promoMinPurchase || ''}
              onChange={(e) => onChange({ ...config, promoMinPurchase: parseFloat(e.target.value) || undefined })}
              placeholder="Contoh: 50000"
              disabled={disabled}
            />
            <p className="text-xs text-muted-foreground">Minimum pembelian untuk mendapat promo</p>
          </div>

          {/* Description (Optional) */}
          <div className="space-y-2">
            <Label>Deskripsi Promo (Opsional)</Label>
            <Textarea
              value={config.promoDescription || ''}
              onChange={(e) => onChange({ ...config, promoDescription: e.target.value })}
              placeholder="Deskripsi promo..."
              disabled={disabled}
              rows={3}
            />
          </div>
        </>
      )}
    </div>
  );
}
