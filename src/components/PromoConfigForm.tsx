import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tag, Clock, Calendar, DollarSign, Percent } from 'lucide-react';
import type { PromoConfig } from '../types/types';

interface PromoConfigFormProps {
  value: Partial<PromoConfig>;
  onChange: (config: Partial<PromoConfig>) => void;
  originalPrice?: number;
}

const DAYS_OPTIONS = [
  { value: 'Monday', label: 'Senin', short: 'Sen' },
  { value: 'Tuesday', label: 'Selasa', short: 'Sel' },
  { value: 'Wednesday', label: 'Rabu', short: 'Rab' },
  { value: 'Thursday', label: 'Kamis', short: 'Kam' },
  { value: 'Friday', label: 'Jumat', short: 'Jum' },
  { value: 'Saturday', label: 'Sabtu', short: 'Sab' },
  { value: 'Sunday', label: 'Minggu', short: 'Min' },
];

export default function PromoConfigForm({ value, onChange, originalPrice }: PromoConfigFormProps) {
  const updateField = <K extends keyof PromoConfig>(field: K, newValue: PromoConfig[K]) => {
    onChange({ ...value, [field]: newValue });
  };

  const toggleDay = (day: string) => {
    const currentDays = value.promoDays || [];
    const newDays = currentDays.includes(day)
      ? currentDays.filter(d => d !== day)
      : [...currentDays, day];
    updateField('promoDays', newDays);
  };

  const selectAllDays = () => {
    const allDays = DAYS_OPTIONS.map(d => d.value);
    updateField('promoDays', allDays);
  };

  const clearAllDays = () => {
    updateField('promoDays', []);
  };

  // Calculate preview price
  const calculatePreviewPrice = () => {
    if (!originalPrice || !value.promoEnabled || !value.promoValue) return null;
    
    if (value.promoType === 'percentage') {
      const discount = (originalPrice * value.promoValue) / 100;
      return originalPrice - discount;
    } else {
      return originalPrice - value.promoValue;
    }
  };

  const previewPrice = calculatePreviewPrice();

  return (
    <Card className="border-2 border-dashed">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Tag className="h-5 w-5 text-orange-500" />
            <CardTitle className="text-lg">Konfigurasi Promo</CardTitle>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="promo-enabled"
              checked={value.promoEnabled || false}
              onCheckedChange={(checked) => updateField('promoEnabled', checked as boolean)}
            />
            <Label htmlFor="promo-enabled" className="cursor-pointer font-semibold">
              {value.promoEnabled ? 'Promo Aktif' : 'Aktifkan Promo'}
            </Label>
          </div>
        </div>
        {!value.promoEnabled && (
          <CardDescription>
            Centang untuk mengaktifkan promo pada item ini
          </CardDescription>
        )}
      </CardHeader>

      {value.promoEnabled && (
        <CardContent className="space-y-6">
          {/* Promo Type */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Tipe Diskon
            </Label>
            <RadioGroup
              value={value.promoType || 'fixed'}
              onValueChange={(val) => updateField('promoType', val as 'fixed' | 'percentage')}
              className="grid grid-cols-2 gap-4"
            >
              <div className="flex items-center space-x-2 border rounded-lg p-3 cursor-pointer hover:bg-muted/50">
                <RadioGroupItem value="fixed" id="promo-fixed" />
                <Label htmlFor="promo-fixed" className="cursor-pointer flex-1">
                  <div className="font-medium">Nominal (Rp)</div>
                  <div className="text-xs text-muted-foreground">Potongan harga tetap</div>
                </Label>
              </div>
              <div className="flex items-center space-x-2 border rounded-lg p-3 cursor-pointer hover:bg-muted/50">
                <RadioGroupItem value="percentage" id="promo-percentage" />
                <Label htmlFor="promo-percentage" className="cursor-pointer flex-1">
                  <div className="font-medium flex items-center gap-1">
                    Persentase <Percent className="h-3 w-3" />
                  </div>
                  <div className="text-xs text-muted-foreground">Potongan % dari harga</div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Promo Value */}
          <div className="space-y-2">
            <Label htmlFor="promo-value" className="text-sm font-semibold">
              {value.promoType === 'percentage' ? 'Persentase Diskon (%)' : 'Nominal Diskon (Rp)'}
            </Label>
            <Input
              id="promo-value"
              type="number"
              min="0"
              max={value.promoType === 'percentage' ? 100 : undefined}
              value={value.promoValue || ''}
              onChange={(e) => updateField('promoValue', Number(e.target.value))}
              placeholder={value.promoType === 'percentage' ? 'Contoh: 20' : 'Contoh: 10000'}
              required
            />
            {originalPrice && previewPrice !== null && previewPrice >= 0 && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Preview:</span>
                <span className="line-through text-muted-foreground">
                  Rp {originalPrice.toLocaleString('id-ID')}
                </span>
                <span className="text-green-600 font-bold">
                  → Rp {previewPrice.toLocaleString('id-ID')}
                </span>
                <Badge variant="destructive" className="ml-2">
                  Hemat Rp {(originalPrice - previewPrice).toLocaleString('id-ID')}
                </Badge>
              </div>
            )}
          </div>

          <Separator />

          {/* Days Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Hari Berlaku Promo
              </Label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={selectAllDays}
                  className="text-xs text-blue-600 hover:underline"
                >
                  Pilih Semua
                </button>
                <span className="text-xs text-muted-foreground">|</span>
                <button
                  type="button"
                  onClick={clearAllDays}
                  className="text-xs text-red-600 hover:underline"
                >
                  Hapus Semua
                </button>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-2">
              {DAYS_OPTIONS.map((day) => {
                const isSelected = (value.promoDays || []).includes(day.value);
                return (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => toggleDay(day.value)}
                    className={`
                      p-3 rounded-lg border-2 text-center transition-all cursor-pointer
                      ${isSelected
                        ? 'bg-blue-500 border-blue-600 text-white font-bold shadow-md'
                        : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                      }
                    `}
                  >
                    <div className="text-xs font-semibold">{day.short}</div>
                  </button>
                );
              })}
            </div>
            {value.promoDays && value.promoDays.length > 0 && (
              <div className="text-sm text-muted-foreground">
                Dipilih: {value.promoDays.length === 7 ? 'Setiap hari' : `${value.promoDays.length} hari`}
              </div>
            )}
          </div>

          <Separator />

          {/* Time Range */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Jam Berlaku Promo
            </Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="promo-start-time" className="text-xs text-muted-foreground">
                  Jam Mulai
                </Label>
                <Input
                  id="promo-start-time"
                  type="time"
                  value={value.promoStartTime || ''}
                  onChange={(e) => updateField('promoStartTime', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="promo-end-time" className="text-xs text-muted-foreground">
                  Jam Selesai
                </Label>
                <Input
                  id="promo-end-time"
                  type="time"
                  value={value.promoEndTime || ''}
                  onChange={(e) => updateField('promoEndTime', e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          {/* Optional: Date Range */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">
              Periode Promo (Opsional)
            </Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="promo-start-date" className="text-xs text-muted-foreground">
                  Tanggal Mulai
                </Label>
                <Input
                  id="promo-start-date"
                  type="date"
                  value={value.promoStartDate || ''}
                  onChange={(e) => updateField('promoStartDate', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="promo-end-date" className="text-xs text-muted-foreground">
                  Tanggal Selesai
                </Label>
                <Input
                  id="promo-end-date"
                  type="date"
                  value={value.promoEndDate || ''}
                  onChange={(e) => updateField('promoEndDate', e.target.value)}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Kosongkan jika promo berlaku tanpa batas waktu
            </p>
          </div>

          {/* Optional: Min Purchase */}
          <div className="space-y-2">
            <Label htmlFor="promo-min-purchase" className="text-sm font-semibold">
              Minimum Pembelian (Opsional)
            </Label>
            <Input
              id="promo-min-purchase"
              type="number"
              min="0"
              value={value.promoMinPurchase || ''}
              onChange={(e) => updateField('promoMinPurchase', e.target.value ? Number(e.target.value) : undefined)}
              placeholder="Contoh: 50000"
            />
            <p className="text-xs text-muted-foreground">
              Kosongkan jika tidak ada minimum pembelian
            </p>
          </div>

          {/* Optional: Description */}
          <div className="space-y-2">
            <Label htmlFor="promo-description" className="text-sm font-semibold">
              Deskripsi Promo (Opsional)
            </Label>
            <Input
              id="promo-description"
              value={value.promoDescription || ''}
              onChange={(e) => updateField('promoDescription', e.target.value)}
              placeholder="Contoh: Promo Flash Sale Weekend"
            />
          </div>
        </CardContent>
      )}
    </Card>
  );
}
