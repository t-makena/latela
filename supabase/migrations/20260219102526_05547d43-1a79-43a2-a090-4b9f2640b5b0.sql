
CREATE TABLE IF NOT EXISTS public.waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can join waitlist" ON public.waitlist 
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Service read waitlist" ON public.waitlist 
  FOR SELECT USING (auth.role() = 'service_role');
