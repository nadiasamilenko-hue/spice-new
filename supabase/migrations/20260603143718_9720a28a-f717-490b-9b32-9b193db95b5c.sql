
-- Order status enum
CREATE TYPE public.order_status AS ENUM ('new', 'contacted', 'paid', 'packed', 'shipped', 'completed', 'cancelled');
CREATE TYPE public.carrier_type AS ENUM ('nova_poshta', 'ukrposhta');
CREATE TYPE public.delivery_type AS ENUM ('branch', 'locker');
CREATE TYPE public.contact_channel AS ENUM ('telegram', 'viber', 'whatsapp', 'phone');

CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT NOT NULL UNIQUE DEFAULT ('SM-' || to_char(now(), 'YYMMDD') || '-' || substr(gen_random_uuid()::text, 1, 6)),
  status public.order_status NOT NULL DEFAULT 'new',

  -- Customer
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  preferred_contact public.contact_channel NOT NULL,

  -- Delivery
  carrier public.carrier_type NOT NULL,
  city TEXT NOT NULL,
  delivery_type public.delivery_type NOT NULL DEFAULT 'branch',
  branch_address TEXT NOT NULL,

  -- Recipient (nullable = same as customer)
  recipient_name TEXT,
  recipient_phone TEXT,

  -- Items + totals (products only, no shipping)
  items JSONB NOT NULL,
  items_total INTEGER NOT NULL,
  comment TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_orders_status ON public.orders (status);
CREATE INDEX idx_orders_created_at ON public.orders (created_at DESC);
CREATE INDEX idx_orders_customer_phone ON public.orders (customer_phone);

GRANT INSERT ON public.orders TO anon, authenticated;
GRANT ALL ON public.orders TO service_role;

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Anyone can create an order (guest checkout)
CREATE POLICY "Anyone can place an order"
  ON public.orders FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- No public SELECT/UPDATE: orders only viewable via service-role (manager backend)

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER orders_set_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Abandoned cart tracking (best-effort: snapshot when user reaches checkout)
CREATE TABLE public.abandoned_carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact TEXT,                 -- email or phone if provided
  items JSONB NOT NULL,
  items_total INTEGER NOT NULL,
  converted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_abandoned_carts_created_at ON public.abandoned_carts (created_at DESC);

GRANT INSERT ON public.abandoned_carts TO anon, authenticated;
GRANT ALL ON public.abandoned_carts TO service_role;

ALTER TABLE public.abandoned_carts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can log abandoned cart"
  ON public.abandoned_carts FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);
