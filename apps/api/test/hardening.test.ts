import assert from 'node:assert/strict';
import { randomBytes, randomUUID } from 'node:crypto';
import { test, type TestContext } from 'node:test';
import { MemoryStore } from '@fastify/session';
import { buildApp } from '../src/app.js';
import { LimitsSchema, readServerEnv, type ApiLimits } from '../src/env.js';
import { createReportComment } from '../src/services/report-comment.js';
import {
  createMemoryBearRepository,
  createMemoryCommentRepository,
  createMemoryUserRepository,
} from './memory-repositories.js';

const webOrigin = 'http://127.0.0.1:5500';

async function testApi(
  t: TestContext,
  overrides: Partial<ApiLimits> = {},
  secure = false
) {
  const comments = createMemoryCommentRepository();
  const app = await buildApp({
    bears: createMemoryBearRepository([]),
    comments,
    users: createMemoryUserRepository(),
    session: {
      secret: randomBytes(32).toString('hex'),
      secure,
      store: new MemoryStore(),
    },
    corsOrigins: [webOrigin],
    limits: LimitsSchema.parse(overrides),
    reportComment: createReportComment((operation) => operation(comments)),
    checkDatabase: () => Promise.resolve(),
    logger: false,
  });
  t.after(() => app.close());
  return app;
}

test('auth rate limits return 429 and Retry-After for login and register', async (t) => {
  const app = await testApi(t, {
    AUTH_RATE_LIMIT_MAX: 2,
    AUTH_RATE_LIMIT_WINDOW_MS: 60_000,
  });
  for (const url of ['/api/auth/login', '/api/auth/register']) {
    const post = () => app.inject({ method: 'POST', url, payload: {} });
    assert.equal((await post()).statusCode, 400);
    assert.equal((await post()).statusCode, 400);
    const limited = await post();
    assert.equal(limited.statusCode, 429);
    assert.equal(limited.json().status, 429);
    assert.match(
      String(limited.headers['content-type']),
      /^application\/problem\+json/
    );
    const seconds = Number(limited.headers['retry-after']);
    assert.ok(Number.isInteger(seconds) && seconds >= 1 && seconds <= 60);
  }
  assert.equal((await app.inject('/health')).statusCode, 200);
});

test('headers, credentialed CORS and request IDs apply to the API', async (t) => {
  const app = await testApi(t);
  const id = randomUUID();
  const health = await app.inject({
    method: 'HEAD',
    url: '/health',
    headers: { 'x-request-id': id },
  });
  assert.equal(health.statusCode, 200);
  assert.equal(health.headers['x-request-id'], id);
  assert.equal(health.headers['x-content-type-options'], 'nosniff');
  assert.match(
    String(health.headers['content-security-policy']),
    /object-src 'none'/
  );
  assert.ok(health.headers['referrer-policy']);
  assert.ok(health.headers['x-frame-options']);
  assert.equal(health.headers['strict-transport-security'], undefined);
  assert.equal(health.headers['access-control-allow-origin'], undefined);
  const allowed = await app.inject({
    method: 'OPTIONS',
    url: '/api/auth/login',
    headers: {
      origin: webOrigin,
      'access-control-request-method': 'POST',
      'access-control-request-headers': 'content-type',
    },
  });
  assert.equal(allowed.statusCode, 204);
  assert.equal(allowed.headers['access-control-allow-origin'], webOrigin);
  assert.equal(allowed.headers['access-control-allow-credentials'], 'true');
  const denied = await app.inject({
    method: 'GET',
    url: '/health',
    headers: { origin: 'https://other.example.test' },
  });
  assert.equal(denied.statusCode, 403);
  assert.equal(denied.json().status, 403);
  assert.equal(denied.headers['access-control-allow-origin'], undefined);
  const withInvalidId = await app.inject({
    method: 'GET',
    url: '/health',
    headers: { 'x-request-id': 'wrong-format' },
  });
  assert.notEqual(withInvalidId.headers['x-request-id'], 'wrong-format');
  const production = await testApi(t, {}, true);
  assert.match(
    String(
      (await production.inject('/health')).headers['strict-transport-security']
    ),
    /max-age=/
  );
});

test('body size and Zod checks cover params, queries and request bodies', async (t) => {
  const app = await testApi(t, { BODY_LIMIT_BYTES: 256 });
  const oversized = await app.inject({
    method: 'POST',
    url: '/api/auth/login',
    payload: { note: 'a'.repeat(300) },
  });
  assert.equal(oversized.statusCode, 413);
  assert.equal(oversized.json().status, 413);
  assert.match(
    String(oversized.headers['content-type']),
    /^application\/problem\+json/
  );
  for (const path of [
    '/health?extra=1',
    '/api/bears?q=brown&extra=1',
    '/api/bears/BAD',
    '/api/bears/ursus-arctos/comments?limit=0',
    '/api/bears/ursus-arctos/comments?extra=1',
    '/api/auth/me?extra=1',
  ]) {
    assert.equal((await app.inject(path)).statusCode, 400, path);
  }
  const rejected = await app.inject({
    method: 'POST',
    url: '/api/auth/logout',
    payload: { unused: true },
  });
  assert.equal(rejected.statusCode, 400);
  const payload = {
    email: 'hardening@example.test',
    password: randomBytes(24).toString('hex'),
  };
  assert.equal(
    (await app.inject({ method: 'POST', url: '/api/auth/register', payload }))
      .statusCode,
    201
  );
  const loggedIn = await app.inject({
    method: 'POST',
    url: '/api/auth/login',
    payload,
  });
  assert.equal(loggedIn.statusCode, 200);
  const header = loggedIn.headers['set-cookie'];
  assert.equal(typeof header, 'string');
  const invalidQuery = await app.inject({
    method: 'POST',
    url: '/api/bears/ursus-arctos/comments?extra=1',
    headers: { cookie: String(header).split(';')[0] },
    payload: { author: 'Reader', text: 'Example' },
  });
  assert.equal(invalidQuery.statusCode, 400);
  assert.equal(
    (await app.inject({ method: 'POST', url: '/api/auth/logout' })).statusCode,
    204
  );
});

test('server environment rejects invalid limits and non-origin URLs', () => {
  const password = randomBytes(12).toString('hex') + '@#/%25';
  const base = {
    SESSION_SECRET: randomBytes(32).toString('hex'),
    POSTGRES_PASSWORD: password,
  };
  const valid = readServerEnv({
    ...base,
    CORS_ORIGINS: webOrigin + ',https://bears.example',
  });
  assert.equal(
    decodeURIComponent(new URL(valid.DATABASE_URL).password),
    password
  );
  assert.deepEqual(valid.CORS_ORIGINS, [webOrigin, 'https://bears.example']);
  const queryUrl = new URL('postgresql://bears@127.0.0.1:5433/bears');
  queryUrl.searchParams.set('password', randomBytes(16).toString('hex'));
  const legacy = readServerEnv({
    SESSION_SECRET: base.SESSION_SECRET,
    DATABASE_URL: queryUrl.href,
  });
  assert.equal(legacy.DATABASE_URL, queryUrl.href);
  const replaced = readServerEnv({ ...base, DATABASE_URL: queryUrl.href });
  assert.equal(
    new URL(replaced.DATABASE_URL).searchParams.has('password'),
    false
  );
  assert.equal(
    decodeURIComponent(new URL(replaced.DATABASE_URL).password),
    password
  );
  for (const value of [
    '*',
    'null',
    'https://*.example',
    'https://bears.example/path',
    'https://user@bears.example',
    'https://bears.example?q=1',
  ]) {
    assert.throws(
      () => readServerEnv({ ...base, CORS_ORIGINS: value }),
      /CORS_ORIGINS/
    );
  }
  assert.throws(
    () => readServerEnv({ ...base, AUTH_RATE_LIMIT_MAX: '0' }),
    /AUTH_RATE_LIMIT_MAX/
  );
  assert.throws(
    () => readServerEnv({ ...base, BODY_LIMIT_BYTES: 'abc' }),
    /BODY_LIMIT_BYTES/
  );
  assert.throws(
    () => readServerEnv({ ...base, AUTH_RATE_LIMIT_WINDOW_MS: '-1' }),
    /AUTH_RATE_LIMIT_WINDOW_MS/
  );
  assert.throws(
    () => readServerEnv({ ...base, SESSION_SECRET: 'short' }),
    /SESSION_SECRET/
  );
  assert.throws(
    () => readServerEnv({ SESSION_SECRET: base.SESSION_SECRET }),
    /POSTGRES_PASSWORD/
  );
});
