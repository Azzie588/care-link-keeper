CREATE TABLE public.medications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  dosage text,
  frequency text,
  prescriber text,
  pharmacy text,
  date_filled date,
  refill_reminder_date date,
  notes text,
  is_hidden boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.medications TO authenticated;
GRANT ALL ON public.medications TO service_role;

ALTER TABLE public.medications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners manage their medications"
  ON public.medications FOR ALL TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Family can view shared medications"
  ON public.medications FOR SELECT TO authenticated
  USING (
    auth.uid() <> owner_id
    AND is_hidden = false
    AND public.can_view_owner(auth.uid(), owner_id)
  );

CREATE TRIGGER medications_touch
  BEFORE UPDATE ON public.medications
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE INDEX medications_owner_idx ON public.medications(owner_id);