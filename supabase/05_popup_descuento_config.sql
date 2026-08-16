-- ============================================================================
-- 05_popup_descuento_config.sql
-- Seed data for the lead-capture discount popup
-- Editable from admin panel (cms_config table)
-- ============================================================================

-- Insert default popup configuration values into cms_config
-- These are read by the DiscountPopup component on the public site

INSERT INTO cms_config (id, value, group_key, updated_at)
VALUES
  ('popup_enabled',         'true',                                                    'popup', now()),
  ('popup_title',           '¡20% de Descuento!',                                     'popup', now()),
  ('popup_subtitle',        'Suscríbete y obtén 20% OFF en tu primer taller o congreso', 'popup', now()),
  ('popup_discount_percent', '20',                                                     'popup', now()),
  ('popup_offer_type',      'talleres y congresos',                                    'popup', now()),
  ('popup_cta_text',        'Quiero mi descuento',                                     'popup', now()),
  ('popup_success_message', '¡Listo! Revisa tu correo para recibir tu código de descuento.', 'popup', now())
ON CONFLICT (id) DO UPDATE
SET value = EXCLUDED.value, updated_at = now();

-- ============================================================================
-- Ensure the leads table supports the discount_popup source/type
-- (If you already ran 03_suscriptores_vs_inscritos.sql these columns exist)
-- ============================================================================

-- Add type column if not present (for lead categorization)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'type'
  ) THEN
    ALTER TABLE leads ADD COLUMN type text DEFAULT 'general';
  END IF;
END $$;

-- Add full_name column to subscribers if not present
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscribers' AND column_name = 'full_name'
  ) THEN
    ALTER TABLE subscribers ADD COLUMN full_name text;
  END IF;
END $$;

-- Verify seed
SELECT id, value FROM cms_config WHERE group_key = 'popup' ORDER BY id;
