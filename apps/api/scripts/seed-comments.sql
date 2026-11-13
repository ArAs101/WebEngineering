DO $$
BEGIN
  IF (SELECT count(*) FROM bears) <> 8 OR EXISTS (SELECT 1 FROM comments) THEN
    RAISE EXCEPTION 'Use a fresh benchmark database with exactly eight seeded bears and an empty comments table';
  END IF;
END
$$;

WITH species AS (
  SELECT id, row_number() OVER (ORDER BY id) AS number
  FROM bears
)
INSERT INTO comments (bear_id, author, text, created_at)
SELECT
  species.id,
  'Benchmark',
  'Generated benchmark comment ' || n,
  TIMESTAMPTZ '2026-01-01 00:00:00+00' + n * INTERVAL '1 second'
FROM generate_series(1, 100000) AS n
JOIN species ON species.number = ((n - 1) % 8) + 1;

ANALYZE comments;