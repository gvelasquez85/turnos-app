-- ============================================================================
-- Distinguish superadmin-granted modules from brand self-subscriptions
-- Modules with granted_by_superadmin = TRUE are never billed.
-- ============================================================================

ALTER TABLE module_subscriptions
  ADD COLUMN IF NOT EXISTS granted_by_superadmin BOOLEAN NOT NULL DEFAULT FALSE;

-- Index for billing queries: exclude superadmin grants
CREATE INDEX IF NOT EXISTS idx_module_subs_billable
  ON module_subscriptions (brand_id, module_key, status)
  WHERE granted_by_superadmin = FALSE;

COMMENT ON COLUMN module_subscriptions.granted_by_superadmin IS
  'TRUE = activated by superadmin at no cost. FALSE = self-subscribed by brand (billable).';
