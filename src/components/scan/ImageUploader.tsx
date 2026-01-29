import { useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Camera, Upload, X, Loader2 } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { cn } from '@/lib/utils';
import { toast } from '@/components/ui/sonner';

interface ImageUploaderProps {
  onImageCapture: (base64: string) => void;
  isLoading: boolean;
}

export const ImageUploader = ({ onImageCapture, isLoading }: ImageUploaderProps) => {
  const { t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const processFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }
    
    if (file.size > 4 * 1024 * 1024) {
      toast.error('Image must be less than 4MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      setPreview(base64);
      onImageCapture(base64);
    };
    reader.readAsDataURL(file);
  }, [onImageCapture]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const clearPreview = () => {
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleTakePhoto = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      // For now, just use file input - camera capture would need a modal
      stream.getTracks().forEach(track => track.stop());
      fileInputRef.current?.click();
    } catch {
      // Fall back to file input
      fileInputRef.current?.click();
    }
  };

  if (preview) {
    return (
      <Card 
        className="border-2 border-foreground p-4 relative"
        style={{ boxShadow: '4px 4px 0px #000000' }}
      >
        <button
          onClick={clearPreview}
          className="absolute top-2 right-2 p-1 bg-foreground text-background rounded-full hover:opacity-80"
          disabled={isLoading}
        >
          <X size={16} />
        </button>
        <img 
          src={preview} 
          alt="Grocery list preview" 
          className="w-full max-h-64 object-contain rounded-lg"
        />
        {isLoading && (
          <div className="absolute inset-0 bg-background/80 flex items-center justify-center rounded-xl">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin" />
              <p className="text-sm font-medium">{t('scan.parsing')}</p>
            </div>
          </div>
        )}
      </Card>
    );
  }

  return (
    <Card 
      className={cn(
        "border-2 border-dashed border-foreground p-8 text-center transition-colors",
        isDragging && "bg-accent"
      )}
      style={{ boxShadow: '4px 4px 0px #000000' }}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />
      
      <div className="flex flex-col items-center gap-4">
        <div className="p-4 rounded-full bg-muted">
          <Camera size={48} className="text-muted-foreground" />
        </div>
        
        <div>
          <h3 className="font-bold text-lg">{t('scan.uploadTitle')}</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {t('scan.uploadDescription')}
          </p>
        </div>
        
        <div className="flex gap-3 flex-wrap justify-center">
          <Button 
            onClick={handleTakePhoto}
            className="gap-2"
            disabled={isLoading}
          >
            <Camera size={18} />
            {t('scan.takePhoto')}
          </Button>
          <Button 
            variant="outline" 
            onClick={() => fileInputRef.current?.click()}
            className="gap-2 border-2 border-foreground"
            disabled={isLoading}
          >
            <Upload size={18} />
            {t('scan.uploadImage')}
          </Button>
        </div>
      </div>
    </Card>
  );
};
