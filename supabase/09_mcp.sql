-- ═══════════════════════════════════════════════════════════════════════════
-- Script 09 — Tokens MCP para IAs (3 niveles de acceso)
--
--   mcp_tokens : tokens API que las IAs usan contra /api/mcp
--                · scope 'admin' → todo lo que hace un admin (solo role=admin)
--                · scope 'user'  → leer contenido + gestionar SUS datos
--   mcp_usage  : contador diario de uso (IP anónima o token). Solo el
--                service role (edge function) puede tocarla.
--
-- El acceso PÚBLICO (sin cuenta) no usa token: se limita por IP (5/día)
-- directamente en la edge function, también vía mcp_usage.
-- Re-ejecutable (idempotente)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS mcp_tokens (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token        text NOT NULL UNIQUE,
  name         text NOT NULL DEFAULT 'Mi IA',
  scope        text NOT NULL CHECK (scope IN ('user', 'admin')),
  profile_id   uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  is_active    boolean NOT NULL DEFAULT true,
  last_used_at timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mcp_tokens_profile ON mcp_tokens(profile_id);
CREATE INDEX IF NOT EXISTS idx_mcp_tokens_scope ON mcp_tokens(scope);

-- Uso diario: kind = 'ip' (acceso público anónimo) | 'token' (token MCP)
-- day = fecha local de Lima (America/Lima), la que ve el usuario
CREATE TABLE IF NOT EXISTS mcp_usage (
  kind  text NOT NULL CHECK (kind IN ('ip', 'token')),
  key   text NOT NULL,
  day   date NOT NULL,
  calls integer NOT NULL DEFAULT 0,
  PRIMARY KEY (kind, key, day)
);

ALTER TABLE mcp_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE mcp_usage  ENABLE ROW LEVEL SECURITY;
-- mcp_usage: SIN políticas → inaccesible desde clientes; solo service role.

-- ═══════════════════════════════════════════════════════════════════════════
-- RLS mcp_tokens — cada quien administra SOLO sus propios tokens
-- ═══════════════════════════════════════════════════════════════════════════

-- Ver mis tokens
DROP POLICY IF EXISTS "MCP tokens: owner read" ON mcp_tokens;
CREATE POLICY "MCP tokens: owner read"
  ON mcp_tokens FOR SELECT
  USING (profile_id = auth.uid());

-- Crear: tokens 'user' para cualquier autenticado;
-- tokens 'admin' SOLO si tu perfil es admin (sin escalada de privilegios)
DROP POLICY IF EXISTS "MCP tokens: owner insert" ON mcp_tokens;
CREATE POLICY "MCP tokens: owner insert"
  ON mcp_tokens FOR INSERT
  WITH CHECK (
    profile_id = auth.uid()
    AND (
      scope = 'user'
      OR (
        scope = 'admin'
        AND EXISTS (
          SELECT 1 FROM profiles
          WHERE id = auth.uid() AND role = 'admin'
        )
      )
    )
  );

-- Actualizar (renombrar / revocar): dueño, sin poder escalar scope
DROP POLICY IF EXISTS "MCP tokens: owner update" ON mcp_tokens;
CREATE POLICY "MCP tokens: owner update"
  ON mcp_tokens FOR UPDATE
  USING (profile_id = auth.uid())
  WITH CHECK (
    profile_id = auth.uid()
    AND (
      scope = 'user'
      OR (
        scope = 'admin'
        AND EXISTS (
          SELECT 1 FROM profiles
          WHERE id = auth.uid() AND role = 'admin'
        )
      )
    )
  );

-- Eliminar (revocación definitiva)
DROP POLICY IF EXISTS "MCP tokens: owner delete" ON mcp_tokens;
CREATE POLICY "MCP tokens: owner delete"
  ON mcp_tokens FOR DELETE
  USING (profile_id = auth.uid());
