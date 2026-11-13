SELECT version();
SELECT count(*) AS comments FROM comments;

BEGIN;
DROP INDEX comments_bear_created_idx;
CREATE INDEX comments_bear_id_idx ON comments (bear_id);

\echo Without the composite index
EXPLAIN (ANALYZE, BUFFERS)
SELECT id, bear_id, author, text, created_at
FROM comments
WHERE bear_id = 'ursus-arctos'
ORDER BY created_at DESC, id DESC
LIMIT 21;
ROLLBACK;

\echo With the composite index
EXPLAIN (ANALYZE, BUFFERS)
SELECT id, bear_id, author, text, created_at
FROM comments
WHERE bear_id = 'ursus-arctos'
ORDER BY created_at DESC, id DESC
LIMIT 21;