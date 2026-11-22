
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// Read the existing StudyLink messaging endpoint.
const source = readFileSync(
  new URL('../backend/lib/studentFeatures.js', import.meta.url),
  'utf8'
);

const match = source.match(
  /app\.post\('\/api\/student\/messages\/:groupId',[\s\S]*?^\s*\}\)\);/m
);

assert.ok(match, 'Group messaging endpoint must exist.');

function createTestEnvironment({ member = true } = {}) {
  const queries = [];
  let handler;

  const app = {
    post: (_route, _auth, callback) => {
      handler = callback;
    }
  };

  const query = async (sql, params) => {
    queries.push({ sql, params });

    if (sql.includes('INSERT INTO student_messages')) {
      return {
        rows: [{
          id: 1,
          groupId: params[0],
          senderId: params[1],
          body: params[2],
          createdAt: new Date().toISOString()
        }]
      };
    }

    return { rows: [] };
  };

  const register = new Function(
    'app',
    'requireAuth',
    'safe',
    'id',
    'allowedGroup',
    'query',
    match[0]
  );

  register(
    app,
    () => {},
    fn => fn,
    value => {
      const number = Number(value);
      return Number.isSafeInteger(number) && number > 0
        ? number
        : null;
    },
    async () => member,
    query
  );

  const send = async (body, groupId = '1') => {
    const req = {
      params: { groupId },
      body: { body },
      user: { id: 10 }
    };

    const res = {
      statusCode: 200,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(data) {
        this.data = data;
        return this;
      }
    };

    await handler(req, res);
    return res;
  };

  return { send, queries };
}

test('Valid group message is saved successfully', async () => {
  const env = createTestEnvironment();
  const response = await env.send('Hello classmates');
  assert.equal(response.statusCode, 201);
  assert.equal(response.data.message.body, 'Hello classmates');
});
test('Empty group messages are rejected', async () => {
  const env = createTestEnvironment();
  const response = await env.send('   ');
  assert.equal(response.statusCode, 400);
  assert.equal(env.queries.length, 0);
});
test('Messages exceeding 2000 characters are rejected', async () => {
  const env = createTestEnvironment();
  const response = await env.send('A'.repeat(2001));
  assert.equal(response.statusCode, 400);
  assert.equal(env.queries.length, 0);
});
test('Non-members cannot send group messages', async () => {
  const env = createTestEnvironment({ member: false });
  const response = await env.send('Unauthorized message');
  assert.equal(response.statusCode, 403);
  assert.equal(env.queries.length, 0);
});
test('Invalid group IDs are rejected', async () => {
  const env = createTestEnvironment();
  const response = await env.send('Hello', 'invalid');
  assert.equal(response.statusCode, 400);
});
test('Message creation generates group notifications', async () => {
  const env = createTestEnvironment();
  await env.send('New study material available');
  assert.equal(env.queries.length, 2);
  assert.match(
    env.queries[0].sql, /INSERT INTO student_messages/
  );
  assert.match( env.queries[1].sql, /INSERT INTO student_notifications/
  );
  assert.equal(env.queries[1].params[3], '/groups/1');
});
test('Message whitespace is trimmed before saving', async () => {
  const env = createTestEnvironment();
  const response = await env.send('  Study session tomorrow  ');
  assert.equal(
    response.data.message.body, 'Study session tomorrow'
  );
});
