import assert from 'node:assert/strict';
import { createPool } from '../src/db/pool.js';
import { readEnv } from '../src/env.js';

const mode = process.argv[2];
assert.ok(
  mode === 'naive' || mode === 'fixed',
  'Expected mode: naive or fixed.'
);

const requestCount = 50;
const { DATABASE_URL, PORT } = readEnv();
const origin = `http://127.0.0.1:${PORT}`;
const pool = createPool(DATABASE_URL);
let commentId: string | undefined;

try {
  const created = await pool.query<{ id: string }>(
    'INSERT INTO comments (bear_id, author, text) VALUES ($1, $2, $3) RETURNING id',
    ['ursus-arctos', 'Report experiment', 'Temporary test comment']
  );
  commentId = created.rows[0].id;
  const reportUrl = `${origin}/api/comments/${commentId}/report`;

  const results = await Promise.allSettled(
    Array.from({ length: requestCount }, async () => {
      const response = await fetch(reportUrl, {
        method: 'POST',
        signal: AbortSignal.timeout(15_000),
      });
      const body = await response.text();
      assert.equal(response.status, 200, `Unexpected report response: ${body}`);
    })
  );
  const successful = results.filter(
    (result) => result.status === 'fulfilled'
  ).length;
  const firstFailure = results.find(
    (result): result is PromiseRejectedResult => result.status === 'rejected'
  );

  if (firstFailure !== undefined) {
    throw new Error(`${successful}/${requestCount} HTTP 200.`, {
      cause: firstFailure.reason,
    });
  }

  const { rows } = await pool.query<{
    report_count: number;
    hidden_at: Date | null;
  }>('SELECT report_count, hidden_at FROM comments WHERE id = $1', [commentId]);
  const [row] = rows;
  assert.ok(row, 'The API and this script must use the same database.');

  console.log(
    `${mode}: ${successful}/${requestCount} HTTP 200; stored report_count=${row.report_count}; hidden_at=${row.hidden_at?.toISOString() ?? 'null'}`
  );

  if (mode === 'naive') {
    assert.ok(
      row.report_count < requestCount,
      'No lost update observed. Run again.'
    );
  } else {
    assert.equal(row.report_count, requestCount);
    assert.ok(row.hidden_at);
  }
} finally {
  try {
    if (commentId !== undefined) {
      await pool.query('DELETE FROM comments WHERE id = $1', [commentId]);
    }
  } finally {
    await pool.end();
  }
}
