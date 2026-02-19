CREATE POLICY "Admin can read waitlist"
ON public.waitlist
FOR SELECT
USING (auth.email() = 'info@latela.co.za');