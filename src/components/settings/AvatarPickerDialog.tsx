import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { DefaultAvatar } from "@/components/avatars/DefaultAvatars";
import { cn } from "@/lib/utils";
import { Upload, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";

interface AvatarPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentAvatarType: string | null;
  currentDefaultAvatarId: string | null;
  onSave: (avatarType: 'default' | 'custom', defaultAvatarId?: string, avatarUrl?: string) => Promise<void>;
}

export const AvatarPickerDialog = ({
  open,
  onOpenChange,
  currentAvatarType,
  currentDefaultAvatarId,
  onSave,
}: AvatarPickerDialogProps) => {
  const [selectedType, setSelectedType] = useState<'default' | 'custom'>(
    currentAvatarType === 'custom' ? 'custom' : 'default'
  );
  const [selectedDefaultId, setSelectedDefaultId] = useState<string>(
    currentDefaultAvatarId || 'default'
  );
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDefaultSelect = (id: string) => {
    setSelectedType('default');
    setSelectedDefaultId(id);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    setIsUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/avatar.${fileExt}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get signed URL (bucket is private)
      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from('avatars')
        .createSignedUrl(fileName, 60 * 60 * 24 * 365); // 1 year expiry

      if (signedUrlError || !signedUrlData?.signedUrl) throw signedUrlError || new Error('Failed to get signed URL');

      const avatarSignedUrl = signedUrlData.signedUrl;

      // Save immediately
      await onSave('custom', undefined, avatarSignedUrl);
      onOpenChange(false);
      toast.success('Avatar updated successfully!');
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(selectedType, selectedDefaultId);
      onOpenChange(false);
      toast.success('Avatar updated successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update avatar');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Choose Avatar</DialogTitle>
          <DialogDescription>
            Select a default avatar or upload your own photo
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Default Avatar Option */}
          <div className="space-y-3">
            <p className="text-sm font-medium">Default Avatar</p>
            <div className="flex justify-center">
              <button
                onClick={() => handleDefaultSelect('default')}
                className={cn(
                  "p-2 rounded-full transition-all",
                  selectedType === 'default'
                    ? "ring-4 ring-primary ring-offset-2 ring-offset-background"
                    : "hover:ring-2 hover:ring-muted-foreground"
                )}
              >
                <DefaultAvatar className="h-20 w-20" />
              </button>
            </div>
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">or</span>
            </div>
          </div>

          {/* Upload Custom */}
          <div className="space-y-3">
            <p className="text-sm font-medium">Upload Custom Photo</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
            <Button
              variant="outline"
              className="w-full"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Photo
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Save Button for Default Selection */}
        {selectedType === 'default' && (
          <Button onClick={handleSave} disabled={isSaving} className="w-full">
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Selection'
            )}
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
};
