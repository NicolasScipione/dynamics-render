
CREATE TABLE public.saved_forms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  snippet TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.saved_forms ENABLE ROW LEVEL SECURITY;

-- Public access for now (no auth yet)
CREATE POLICY "Allow all read" ON public.saved_forms FOR SELECT USING (true);
CREATE POLICY "Allow all insert" ON public.saved_forms FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all delete" ON public.saved_forms FOR DELETE USING (true);
