-- ============================================================================
-- Help Center — Full-Text Search for the AI Assistant
-- ============================================================================

-- Add search vector column for fast FTS
ALTER TABLE help_articles
  ADD COLUMN IF NOT EXISTS search_vector TSVECTOR;

-- Build initial vectors for existing rows
UPDATE help_articles SET
  search_vector = to_tsvector('spanish',
    coalesce(title, '') || ' ' ||
    coalesce(summary, '') || ' ' ||
    coalesce(array_to_string(tags, ' '), '') || ' ' ||
    coalesce(regexp_replace(body, '<[^>]+>', ' ', 'g'), '')
  );

-- Trigger to keep search_vector in sync on insert/update
CREATE OR REPLACE FUNCTION help_articles_search_vector_update()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.search_vector := to_tsvector('spanish',
    coalesce(NEW.title, '') || ' ' ||
    coalesce(NEW.summary, '') || ' ' ||
    coalesce(array_to_string(NEW.tags, ' '), '') || ' ' ||
    coalesce(regexp_replace(NEW.body, '<[^>]+>', ' ', 'g'), '')
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS help_articles_search_vector_trigger ON help_articles;
CREATE TRIGGER help_articles_search_vector_trigger
  BEFORE INSERT OR UPDATE ON help_articles
  FOR EACH ROW EXECUTE FUNCTION help_articles_search_vector_update();

-- GIN index for fast FTS queries
CREATE INDEX IF NOT EXISTS idx_help_articles_search_vector
  ON help_articles USING GIN (search_vector);

-- RPC: search articles by query, returns top N sorted by rank
CREATE OR REPLACE FUNCTION search_help_articles(
  p_query  TEXT,
  p_limit  INT DEFAULT 4
)
RETURNS TABLE (
  id        UUID,
  slug      TEXT,
  title     TEXT,
  category  TEXT,
  summary   TEXT,
  body      TEXT,
  tags      TEXT[],
  rank      FLOAT4
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_tsquery TSQUERY;
BEGIN
  -- Try strict query first, fall back to prefix matching
  BEGIN
    v_tsquery := plainto_tsquery('spanish', p_query);
  EXCEPTION WHEN OTHERS THEN
    v_tsquery := to_tsquery('spanish', p_query || ':*');
  END;

  RETURN QUERY
  SELECT
    a.id,
    a.slug,
    a.title,
    a.category,
    a.summary,
    a.body,
    a.tags,
    ts_rank_cd(a.search_vector, v_tsquery) AS rank
  FROM help_articles a
  WHERE
    a.published = TRUE
    AND (
      a.search_vector @@ v_tsquery
      OR a.title ILIKE '%' || p_query || '%'
      OR a.summary ILIKE '%' || p_query || '%'
    )
  ORDER BY rank DESC, a.views_count DESC
  LIMIT p_limit;
END;
$$;
