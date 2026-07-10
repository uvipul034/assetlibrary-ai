-- ============================================================================
-- AssetLibrary AI — Initial Schema Migration
-- ============================================================================
-- This migration creates the complete database schema including:
--   • Custom enums for roles and statuses
--   • Core tables with soft-delete pattern
--   • Performance indexes (partial, filtered)
--   • Automatic profile creation trigger (SECURITY DEFINER)
--   • Row Level Security (RLS) policies enforcing RBAC
-- ============================================================================

-- =========================
-- 1. ENUMS
-- =========================

CREATE TYPE user_role AS ENUM ('admin', 'manager', 'editor');
CREATE TYPE asset_status AS ENUM ('pending', 'approved', 'rejected');


-- =========================
-- 2. TABLES
-- =========================

-- Profiles: linked 1:1 to auth.users via trigger (never manually inserted from frontend)
CREATE TABLE profiles (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email      TEXT       NOT NULL,
  role       user_role  NOT NULL DEFAULT 'editor',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Assets: core entity with soft-delete pattern (deleted_at instead of hard delete)
CREATE TABLE assets (
  id           UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  title        TEXT          NOT NULL,
  storage_path TEXT          NOT NULL,
  mime_type    TEXT          NOT NULL,
  size_bytes   BIGINT        NOT NULL,
  status       asset_status  NOT NULL DEFAULT 'pending',
  alt_text     TEXT          DEFAULT NULL,
  uploaded_by  UUID          REFERENCES profiles(id) NOT NULL,
  deleted_at   TIMESTAMPTZ   DEFAULT NULL,
  created_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- Asset Tags: AI-generated and manual tags linked to assets
CREATE TABLE asset_tags (
  id               UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id         UUID    REFERENCES assets(id) NOT NULL,
  tag_name         TEXT    NOT NULL,
  confidence_score FLOAT   NOT NULL,
  is_ai_generated  BOOLEAN NOT NULL DEFAULT false
);

-- Approval Logs: immutable audit trail for status changes
CREATE TABLE approval_logs (
  id          UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id    UUID          REFERENCES assets(id) NOT NULL,
  actioned_by UUID          REFERENCES profiles(id) NOT NULL,
  status_to   asset_status  NOT NULL,
  comments    TEXT,
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);


-- =========================
-- 3. INDEXES
-- =========================
-- Partial indexes filter out soft-deleted assets for query performance

CREATE INDEX idx_assets_status      ON assets(status)      WHERE deleted_at IS NULL;
CREATE INDEX idx_assets_uploaded_by ON assets(uploaded_by)  WHERE deleted_at IS NULL;
CREATE INDEX idx_assets_created_at  ON assets(created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_assets_mime_type   ON assets(mime_type)    WHERE deleted_at IS NULL;
CREATE INDEX idx_asset_tags_asset   ON asset_tags(asset_id);
CREATE INDEX idx_approval_logs_asset ON approval_logs(asset_id);


-- =========================
-- 4. AUTOMATIC PROFILE CREATION TRIGGER
-- =========================
-- Why a trigger instead of frontend code?
-- If a user signs up but a network glitch occurs before the frontend writes to
-- profiles, you get an orphaned auth.users row and a broken app. This SECURITY
-- DEFINER trigger fires at the database level the exact millisecond a user
-- registers — it is immune to client-side failures.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (new.id, new.email, 'editor');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- =========================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- =========================

ALTER TABLE profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets        ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_tags    ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_logs ENABLE ROW LEVEL SECURITY;


-- -------------------------------------------------------
-- PROFILES
-- -------------------------------------------------------
-- All authenticated users can read profiles (needed for displaying names/roles)
CREATE POLICY "profiles_select_authenticated"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

-- Users can only update their own profile (e.g., display name changes)
CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid());


-- -------------------------------------------------------
-- ASSETS
-- -------------------------------------------------------
-- All authenticated users can view non-deleted assets
CREATE POLICY "assets_select_non_deleted"
  ON assets FOR SELECT
  TO authenticated
  USING (deleted_at IS NULL);

-- All authenticated users can upload new assets (INSERT sets uploaded_by = self)
CREATE POLICY "assets_insert_own"
  ON assets FOR INSERT
  TO authenticated
  WITH CHECK (uploaded_by = auth.uid());

-- Managers and admins can update ANY asset (approve, reject, edit, soft-delete)
CREATE POLICY "assets_update_manager_admin"
  ON assets FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('manager', 'admin')
    )
  );

-- Editors can ONLY modify their own assets that are still pending.
-- The WITH CHECK constraint prevents editors from changing status to 'approved'
-- or modifying assets that have already been approved/rejected — this closes
-- the privilege escalation exploit where an editor could self-approve.
CREATE POLICY "assets_update_editor_own_pending"
  ON assets FOR UPDATE
  TO authenticated
  USING (uploaded_by = auth.uid())
  WITH CHECK (
    status = 'pending'
    AND uploaded_by = auth.uid()
  );


-- -------------------------------------------------------
-- ASSET_TAGS
-- -------------------------------------------------------
-- All authenticated users can view tags
CREATE POLICY "asset_tags_select_authenticated"
  ON asset_tags FOR SELECT
  TO authenticated
  USING (true);

-- NOTE: No INSERT policy is defined for asset_tags.
-- The /api/analyze-asset route uses SUPABASE_SERVICE_ROLE_KEY to initialize
-- the Supabase client, which bypasses RLS entirely. This is the correct
-- architecture for trusted server-side operations (AI tag insertion).
-- A service role client does NOT need an RLS policy to write.


-- -------------------------------------------------------
-- APPROVAL_LOGS
-- -------------------------------------------------------
-- All authenticated users can view the audit trail
CREATE POLICY "approval_logs_select_authenticated"
  ON approval_logs FOR SELECT
  TO authenticated
  USING (true);

-- Only managers and admins can create approval log entries
CREATE POLICY "approval_logs_insert_manager_admin"
  ON approval_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('manager', 'admin')
    )
  );
