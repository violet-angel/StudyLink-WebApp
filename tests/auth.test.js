
import test from 'node:test';
import assert from 'node:assert/strict';

import {
  hashPassword,
  verifyPassword,
  createAuthToken,
  verifyAuthToken
} from '../backend/lib/auth.js';

test('Password hashing generates a valid scrypt hash', () => {
  const hash = hashPassword('TestPassword123!');
  assert.ok(hash.startsWith('scrypt$'));
});

test('Correct password is verified successfully', () => {
  const hash = hashPassword('TestPassword123!');
  assert.equal(verifyPassword('TestPassword123!', hash), true);
});

test('Incorrect password is rejected', () => {
  const hash = hashPassword('TestPassword123!');
  assert.equal(verifyPassword('WrongPassword', hash), false);
});

test('Missing password hash is rejected', () => {
  assert.equal(verifyPassword('TestPassword123!', ''), false);
});

test('Password hashes use different random salts', () => {
  const first = hashPassword('TestPassword123!');
  const second = hashPassword('TestPassword123!');
  assert.notEqual(first, second);
});

test('Authentication token is generated and verified', () => {
  const user = {
    id: 1,
    name: 'Test Student',
    email: 'student@example.com',
    role: 'student'
  };
  const token = createAuthToken(user);
  const payload = verifyAuthToken(token);
  assert.ok(payload);
  assert.equal(payload.sub, '1');
  assert.equal(payload.role, 'student');
});

test('Invalid authentication token is rejected', () => {
  assert.equal(verifyAuthToken('invalid.token'), null);
});

test('Missing authentication token is rejected', () => {
  assert.equal(verifyAuthToken(''), null);
});
