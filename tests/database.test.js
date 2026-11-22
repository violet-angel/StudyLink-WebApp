
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(
  new URL('../backend/lib/db.js', import.meta.url),
  'utf8'
);

// Extract the existing database helper functions without
// importing the database module or opening a connection.
function loadHelper(name, dependencies = {}) {
  const pattern = new RegExp(
    `^function ${name}\\([^\\n]*\\) \\{[\\s\\S]*?^\\}`,
    'm'
  );

  const match = source.match(pattern);
  assert.ok(match, `${name} must exist in db.js`);

  const names = Object.keys(dependencies);
  const values = Object.values(dependencies);

  return new Function(
    ...names,
    `${match[0]}; return ${name};`
  )(...values);
}

const normalizeSql = loadHelper('normalizeSql');
const nextId = loadHelper('nextId');

test('SQL text is normalized correctly', () => {
  assert.equal(
    normalizeSql(' SELECT   *\n FROM users '), 'select * from users'
  );
});
test('SQL normalization handles empty input', () => {
  assert.equal(normalizeSql(''), '');
});
test('Database IDs increment correctly', () => {
  const result = nextId([
    { id: 1 }, { id: 3 }, { id: 5 }
  ]);
  assert.equal(result, 6);
});
test('Empty database collection starts at ID 1', () => {
  assert.equal(nextId([]), 1);
});
test('Database IDs handle missing values', () => {
  const result = nextId([
    { id: 2 }, { name: 'Missing ID' }, { id: 4 }
  ]);
  assert.equal(result, 5);
});
test('Course enrollment status is calculated correctly', () => {
  const localState = {
    course_enrollments: [
      { course_id: 1, user_id: 10 },
      { course_id: 1, user_id: 20 }
    ]
  };
  const getCourseEnrollmentEntries = loadHelper(
    'getCourseEnrollmentEntries', { localState }
  );
  const toCourseRow = loadHelper(
    'toCourseRow',
    { getCourseEnrollmentEntries }
  );
  const enrolled = toCourseRow(
    { id: 1, code: 'APT3065' }, 10
  );
  const notEnrolled = toCourseRow(
    { id: 1, code: 'APT3065' }, 30
  );
  assert.equal(enrolled.enrolled_count, 2);
  assert.equal(enrolled.is_enrolled, true);
  assert.equal(notEnrolled.is_enrolled, false);
});
