import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { buildApp } from '../src/app.js';
import { BearSchema } from '../src/schemas/bear.js';
import { CommentSchema } from '../src/schemas/comment.js';
import {
  createMemoryBearRepository,
  createMemoryCommentRepository,
} from './memory-repositories.js';
import { CommentReportStatusSchema } from '../src/schemas/comment-report.js';
import { createReportComment } from '../src/services/report-comment.js';

const fixture = BearSchema.array().parse(
  JSON.parse(
    await readFile(new URL('../scripts/bears.json', import.meta.url), 'utf8')
  )
);

test('bear and comment routes use injected repositories without PostgreSQL', async (t) => {
  const bears = createMemoryBearRepository(fixture);
  const comments = createMemoryCommentRepository();
  const app = await buildApp({
    bears,
    comments,
    reportComment: createReportComment((operation) => operation(comments)),
    checkDatabase: () => Promise.resolve(),
    logger: false,
  });
  t.after(() => app.close());

  const list = await app.inject('/api/bears');
  assert.equal(list.statusCode, 200);
  assert.equal(BearSchema.array().parse(list.json()).length, fixture.length);
  assert.equal((await app.inject('/api/bears/ursus-arctos')).statusCode, 200);
  assert.equal((await app.inject('/api/bears/unknown-bear')).statusCode, 404);

  const path = '/api/bears/ursus-arctos/comments';
  const post = await app.inject({
    method: 'POST',
    url: path,
    payload: { author: 'Test', text: 'A comment.' },
  });
  assert.equal(post.statusCode, 201);
  const comment = CommentSchema.parse(post.json());
  assert.equal(post.headers.location, `/api/comments/${comment.id}`);

  const polarComment = await comments.create('ursus-maritimus', {
    author: 'Test',
    text: 'Another bear.',
  });
  const combined = await comments.findByBearIds([
    'ursus-arctos',
    'ursus-maritimus',
  ]);
  assert.deepEqual(
    new Set(combined.map((item) => item.id)),
    new Set([comment.id, polarComment.id])
  );

  const listComments = await app.inject(path);
  assert.equal(listComments.statusCode, 200);
  assert.deepEqual(listComments.json(), { items: [comment], nextCursor: null });

  const remove = await app.inject({
    method: 'DELETE',
    url: `/api/comments/${comment.id}`,
  });
  assert.equal(remove.statusCode, 204);
  assert.deepEqual((await app.inject(path)).json(), {
    items: [],
    nextCursor: null,
  });
});

test('name filters and comment cursors work through the HTTP interface', async (t) => {
  const comments = createMemoryCommentRepository();
  const app = await buildApp({
    bears: createMemoryBearRepository(fixture),
    comments,
    reportComment: createReportComment((operation) => operation(comments)),
    checkDatabase: () => Promise.resolve(),
    logger: false,
  });
  t.after(() => app.close());

  const filtered = await app.inject('/api/bears?q=BROWN');
  assert.equal(filtered.statusCode, 200);
  assert.deepEqual(
    BearSchema.array()
      .parse(filtered.json())
      .map((bear) => bear.id),
    ['ursus-arctos']
  );
  assert.deepEqual((await app.inject('/api/bears?q=%25')).json(), []);

  const bearId = 'ursus-arctos';
  await Promise.all(
    Array.from({ length: 3 }, () =>
      comments.create(bearId, { author: 'Test', text: 'Page test' })
    )
  );

  const path = '/api/bears/ursus-arctos/comments';
  const first = await app.inject(path + '?limit=2');
  assert.equal(first.statusCode, 200);
  const firstPage = first.json();
  assert.equal(firstPage.items.length, 2);
  assert.equal(typeof firstPage.nextCursor, 'string');

  const second = await app.inject(
    path + '?limit=2&cursor=' + firstPage.nextCursor
  );
  assert.equal(second.statusCode, 200);
  const secondPage = second.json();
  assert.equal(secondPage.items.length, 1);
  assert.equal(secondPage.nextCursor, null);
  assert.equal(
    new Set(
      [...firstPage.items, ...secondPage.items].map(
        (item: { id: string }) => item.id
      )
    ).size,
    3
  );

  assert.equal((await app.inject(path + '?limit=0')).statusCode, 400);
  assert.equal((await app.inject(path + '?cursor=invalid')).statusCode, 400);
});

test('the third report hides the comment and later reports keep the timestamp', async (t) => {
  const comments = createMemoryCommentRepository();
  const app = await buildApp({
    bears: createMemoryBearRepository(fixture),
    comments,
    reportComment: createReportComment((operation) => operation(comments)),
    checkDatabase: () => Promise.resolve(),
    logger: false,
  });
  t.after(() => app.close());

  const bearId = 'ursus-arctos';
  const { id } = await comments.create(bearId, {
    author: 'Test',
    text: 'Reported comment',
  });
  const listUrl = `/api/bears/${bearId}/comments`;
  const reportUrl = `/api/comments/${id}/report`;
  let hiddenAt: string | null = null;

  for (let count = 1; count <= 4; count += 1) {
    const response = await app.inject({ method: 'POST', url: reportUrl });
    assert.equal(response.statusCode, 200);
    const report = CommentReportStatusSchema.parse(response.json());
    assert.equal(report.reportCount, count);

    const list = await app.inject(listUrl);
    assert.equal(list.statusCode, 200);
    assert.equal(list.json().items.length, count < 3 ? 1 : 0);
    assert.equal(report.hiddenAt === null, count < 3);

    if (count === 3) {
      hiddenAt = report.hiddenAt;
    } else if (count === 4) {
      assert.equal(report.hiddenAt, hiddenAt);
    }
  }
});
