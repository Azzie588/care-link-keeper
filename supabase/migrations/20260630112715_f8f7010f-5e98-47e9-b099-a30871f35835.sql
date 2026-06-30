
CREATE TABLE public.providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  specialty text,
  practice_name text,
  npi text,
  phone text,
  fax text,
  email text,
  website text,
  notes text,
  is_hidden boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.providers TO authenticated;
GRANT ALL ON public.providers TO service_role;

ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners manage their providers"
  ON public.providers FOR ALL TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Family can view shared providers"
  ON public.providers FOR SELECT TO authenticated
  USING (
    auth.uid() <> owner_id
    AND is_hidden = false
    AND public.can_view_owner(auth.uid(), owner_id)
  );

CREATE TRIGGER providers_touch
  BEFORE UPDATE ON public.providers
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE INDEX providers_owner_idx ON public.providers(owner_id);

CREATE TABLE public.provider_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  label text,
  address_line1 text,
  address_line2 text,
  city text,
  state text,
  postal_code text,
  phone text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.provider_locations TO authenticated;
GRANT ALL ON public.provider_locations TO service_role;

ALTER TABLE public.provider_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners manage their provider locations"
  ON public.provider_locations FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.providers p WHERE p.id = provider_id AND p.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.providers p WHERE p.id = provider_id AND p.owner_id = auth.uid()));

CREATE POLICY "Family can view shared provider locations"
  ON public.provider_locations FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.providers p
    WHERE p.id = provider_id
      AND p.is_hidden = false
      AND p.owner_id <> auth.uid()
      AND public.can_view_owner(auth.uid(), p.owner_id)
  ));

CREATE TRIGGER provider_locations_touch
  BEFORE UPDATE ON public.provider_locations
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE INDEX provider_locations_provider_idx ON public.provider_locations(provider_id);
