import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Upload, X, Loader2 } from 'lucide-react';
import { api } from '../services/api';
import { toast } from 'sonner';

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  onClear: () => void;
  label?: string;
  placeholder?: string;
}

export function ImageUpload({ 
  value, 
  onChange, 
  onClear, 
  label = "Gambar",
  placeholder 
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validasi tipe file
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Tipe file tidak didukung. Gunakan JPG, PNG, GIF, atau WEBP');
      return;
    }

    // Validasi ukuran file (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ukuran file terlalu besar. Maksimal 5MB');
      return;
    }

    setIsUploading(true);
    console.log('[ImageUpload] Starting upload for file:', file.name, 'Size:', file.size);
    
    try {
      const result = await api.images.upload(file);
      console.log('[ImageUpload] Upload result:', result);
      
      if (result.success && result.url) {
        onChange(result.url);
        toast.success('Gambar berhasil diupload');
        console.log('[ImageUpload] Upload successful, URL:', result.url);
      } else {
        console.error('[ImageUpload] Upload failed - no URL in response:', result);
        toast.error('Gagal mengupload gambar - tidak ada URL');
      }
    } catch (error: any) {
      console.error('[ImageUpload] Upload error:', error);
      console.error('[ImageUpload] Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      
      const errorMessage = error.message || 'Gagal mengupload gambar';
      toast.error(`Upload gagal: ${errorMessage}`);
    } finally {
      setIsUploading(false);
      // Reset input file
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleClear = () => {
    onClear();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-2">
      {label && <Label>{label}</Label>}
      
      <div className="flex items-start gap-4">
        {/* Preview atau Placeholder */}
        <div className="flex-shrink-0">
          {value ? (
            <div className="relative w-24 h-24 rounded-lg border-2 border-gray-200 overflow-hidden bg-gray-50">
              <img 
                src={value} 
                alt="Preview" 
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={handleClear}
                className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                title="Hapus gambar"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ) : placeholder ? (
            <div className="w-24 h-24 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-400">
                  {placeholder}
                </div>
              </div>
            </div>
          ) : (
            <div className="w-24 h-24 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center">
              <Upload className="h-8 w-8 text-gray-400" />
            </div>
          )}
        </div>

        {/* Upload Button */}
        <div className="flex-1 space-y-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
            onChange={handleFileChange}
            className="hidden"
            id="image-upload-input"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Mengupload...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                {value ? 'Ganti Gambar' : 'Pilih Gambar'}
              </>
            )}
          </Button>
          <p className="text-xs text-muted-foreground">
            JPG, PNG, GIF atau WEBP. Maksimal 5MB
          </p>
        </div>
      </div>
    </div>
  );
}
