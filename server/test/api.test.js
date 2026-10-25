import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'wellmind-test-secret-that-is-at-least-32-characters';
const { default: app } = await import('../index.js');
const server = createServer(app);
await new Promise((resolve, reject) => {
  server.once('error', reject);
  server.listen(0, '127.0.0.1', resolve);
});
const baseUrl = `http://127.0.0.1:${server.address().port}`;

test('reports service health without requiring a database connection', async () => {
  const response = await fetch(`${baseUrl}/api/health`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { status: 'ok', database: 'disconnected' });
});

test('requires authentication before exposing surveys and actions', async () => {
  for (const path of ['/api/surveys', '/api/surveys/dashboard', '/api/actions', '/api/users']) {
    const response = await fetch(`${baseUrl}${path}`);
    assert.equal(response.status, 401, `${path} must reject unauthenticated requests`);
    assert.match((await response.json()).error, /Authentification/);
  }
});

test('rejects invalid bearer tokens before accessing organization data', async () => {
  const response = await fetch(`${baseUrl}/api/surveys`, {
    headers: { Authorization: 'Bearer not-a-valid-token' },
  });
  assert.equal(response.status, 401);
});

test.after(() => new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve())));
