-- Add color_palette column to user_settings table
ALTER TABLE public.user_settings 
ADD COLUMN IF NOT EXISTS color_palette text NOT NULL DEFAULT 'multicolor';

-- Add comment to document the column
COMMENT ON COLUMN public.user_settings.color_palette IS 'User color palette preference: multicolor or blackwhite';