
CREATE TABLE public.form_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  form_id UUID REFERENCES public.saved_forms(id) ON DELETE CASCADE,
  form_name TEXT,
  level TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.form_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all read logs" ON public.form_logs FOR SELECT USING (true);
CREATE POLICY "Allow all insert logs" ON public.form_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all delete logs" ON public.form_logs FOR DELETE USING (true);
