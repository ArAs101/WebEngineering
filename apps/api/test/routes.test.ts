import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { buildApp } from '../src/app.js';
import { BearSchema } from '../src/schemas/bear.js';
import { CommentSchema } from '../src/schemas/comment.js';
import {
  createMemoryBearRepository,
  createMemoryCommentRepository,
  createMemoryUserRepository,
} from './memory-repositories.js';
import { CommentReportStatusSchema } from '../src/schemas/comment-report.js';
import { createReportComment } from '../src/services/report-comment.js';
import { verify } from 'argon2';
import type { PublicUser } from '../src/schemas/auth.js';
import { randomBytes } from 'node:crypto';
import { MemoryStore } from '@fastify/session';

function testSession(secure = false) {
  return {
    secret: randomBytes(32).toString('hex'),
    secure,
    store: new MemoryStore(),
  };
}

const fixture = BearSchema.array().parse(
  JSON.parse(
    await readFile(new URL('../scripts/bears.json', import.meta.url), 'utf8')
  )
);

test('bear and comment routes use injected repositories without PostgreSQL', async (t) => {
  const bears = createMemoryBearRepository(fixture);
  const comments = createMemoryCommentRepository();
  const app = await buildApp({
    session: testSession(),
    bears,
    comments,
    users: createMemoryUserRepository(),
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
    session: testSession(),
    bears: createMemoryBearRepository(fixture),
    comments,
    users: createMemoryUserRepository(),
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
    session: testSession(),
    bears: createMemoryBearRepository(fixture),
    comments,
    users: createMemoryUserRepository(),
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

test('registration validates input, hashes the exact password and reports a duplicate', async (t) => {
  const accounts = new Map<string, PublicUser & { passwordHash: string }>();
  const comments = createMemoryCommentRepository();
  const app = await buildApp({
    session: testSession(),
    bears: createMemoryBearRepository(fixture),
    comments,
    users: createMemoryUserRepository(accounts),
    reportComment: createReportComment((operation) => operation(comments)),
    checkDatabase: () => Promise.resolve(),
    logger: false,
  });
  t.after(() => app.close());

  const email = 'reader@example.test';
  const password = ' ' + 'a'.repeat(10) + ' ';
  const post = (payload: Record<string, unknown>) =>
    app.inject({ method: 'POST', url: '/api/auth/register', payload });

  for (const payload of [
    { email: 'invalid', password },
    { email, password: 'a'.repeat(11) },
    { email, password: '🐻'.repeat(6) },
    { email, password, role: 'moderator' },
  ]) {
    assert.equal((await post(payload)).statusCode, 400);
  }
  assert.equal(accounts.size, 0);

  const response = await post({ email: email.toUpperCase(), password });
  assert.equal(response.statusCode, 201);
  const account = accounts.get(email);
  assert.ok(account);
  assert.match(account.passwordHash, /^\$argon2id\$/);
  assert.ok(await verify(account.passwordHash, password));
  assert.deepEqual(response.json(), { id: account.id, email, role: 'user' });

  const duplicate = await post({ email, password });
  assert.equal(duplicate.statusCode, 409);
  assert.match(
    String(duplicate.headers['content-type']),
    /^application\/problem\+json/
  );
  assert.equal(duplicate.json().status, 409);
  assert.equal(accounts.size, 1);
});

test('login rotates the credential, /me restores it and logout revokes it', async (t) => {
  const comments = createMemoryCommentRepository();
  const app = await buildApp({
    session: testSession(true),
    trustedProxyIp: '127.0.0.1',
    bears: createMemoryBearRepository(fixture),
    comments,
    users: createMemoryUserRepository(),
    reportComment: createReportComment((operation) => operation(comments)),
    checkDatabase: () => Promise.resolve(),
    logger: false,
  });
  t.after(() => app.close());
  const payload = {
    email: 'reader@example.test',
    password: 'a long test password',
  };
  const saved = await app.inject({
    method: 'POST',
    url: '/api/auth/register',
    payload,
  });
  assert.equal(saved.statusCode, 201);
  const https = { 'x-forwarded-proto': 'https' };
  const me = (cookie?: string) =>
    app.inject({
      method: 'GET',
      url: '/api/auth/me',
      headers: cookie ? { ...https, cookie } : https,
    });
  const login = (credentials: typeof payload, cookie?: string) =>
    app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: credentials,
      headers: cookie ? { ...https, cookie } : https,
    });
  function issuedCookie(response: { headers: Record<string, unknown> }) {
    const header = response.headers['set-cookie'];
    assert.equal(typeof header, 'string');
    const raw = String(header);
    for (const flag of ['Path=/', 'HttpOnly', 'Secure', 'SameSite=Lax'])
      assert.ok(raw.split('; ').includes(flag));
    return raw.split(';')[0];
  }
  const anonymous = await me();
  assert.equal(anonymous.statusCode, 401);
  assert.match(
    String(anonymous.headers['content-type']),
    /^application\/problem\+json/
  );
  const wrong = await login({ ...payload, password: 'incorrect' });
  const unknown = await login({ ...payload, email: 'missing@example.test' });
  assert.equal(wrong.statusCode, 401);
  assert.equal(unknown.statusCode, 401);
  assert.equal(wrong.json().detail, unknown.json().detail);
  const http = await app.inject({
    method: 'POST',
    url: '/api/auth/login',
    payload,
  });
  assert.equal(http.statusCode, 400);
  const first = await login(payload);
  assert.equal(first.statusCode, 200);
  assert.deepEqual(first.json(), saved.json());
  const oldCookie = issuedCookie(first);
  const second = await login(payload, oldCookie);
  assert.equal(second.statusCode, 200);
  const currentCookie = issuedCookie(second);
  assert.notEqual(currentCookie, oldCookie);
  assert.equal((await me(oldCookie)).statusCode, 401);
  const active = await me(currentCookie);
  assert.equal(active.statusCode, 200);
  assert.deepEqual(active.json(), saved.json());
  const logout = await app.inject({
    method: 'POST',
    url: '/api/auth/logout',
    headers: { ...https, cookie: currentCookie },
  });
  assert.equal(logout.statusCode, 204);
  assert.equal(logout.body, '');
  assert.equal((await me(currentCookie)).statusCode, 401);
});