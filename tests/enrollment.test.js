
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// Read the actual enrollment function from StudyLink.
const source = readFileSync(
  new URL('../backend/lib/db.js', import.meta.url),
  'utf8'
);

const match = source.match(
  /^export async function enrollInCourse\(courseId, userId\) \{[\s\S]*?^\}/m
);

assert.ok(match, 'enrollInCourse function must exist.');

// Execute the function with isolated dependencies.
// No production database or local enrollment files are used.
function createTestEnvironment({ local = true, courses = [1] } = {}) {
  const enrollments = [];
  const queries = [];
  let saveCount = 0;

  const pool = {
    query: async (sql, params) => {
      queries.push({ sql, params });
      return { rows: [] };
    }
  };

  const findCourse = id =>
    courses.includes(id) ? { id } : null;

  const loadCourseDetails = async (courseId, userId) => ({
    id: courseId,
    userId
  });

  const saveEnrollments = () => {
    saveCount++;
  };

  const buildFunction = new Function(
    'useLocalStore',
    'localState',
    'findCourse',
    'loadCourseDetails',
    'saveEnrollments',
    'pool',
    `return (${match[0].replace(/^export /, '')});`
  );

  const enroll = buildFunction(
    local,
    { course_enrollments: enrollments },
    findCourse,
    loadCourseDetails,
    saveEnrollments,
    pool
  );

  return {
    enroll,
    enrollments,
    queries,
    getSaveCount: () => saveCount
  };
}

test('Student can enroll in an existing course', async () => {
  const db = createTestEnvironment();

  const result = await db.enroll(1, 10);

  assert.equal(result.id, 1);
  assert.equal(db.enrollments.length, 1);
  assert.equal(db.getSaveCount(), 1);
});

test('Duplicate course enrollment is prevented', async () => {
  const db = createTestEnvironment();

  await db.enroll(1, 10);
  await db.enroll(1, 10);

  assert.equal(db.enrollments.length, 1);
  assert.equal(db.getSaveCount(), 1);
});

test('Enrollment into a nonexistent course is rejected', async () => {
  const db = createTestEnvironment();

  const result = await db.enroll(999, 10);
  assert.equal(result, null);
  assert.equal(db.enrollments.length, 0);
});

test('Different students can enroll in the same course', async () => {
  const db = createTestEnvironment();
  await db.enroll(1, 10);
  await db.enroll(1, 20);

  assert.equal(db.enrollments.length, 2);
});

test('PostgreSQL enrollment uses parameterized SQL', async () => {
  const db = createTestEnvironment({ local: false });
  await db.enroll(1, 10);
  assert.equal(db.queries.length, 1);
  assert.match(db.queries[0].sql, /ON CONFLICT/);
  assert.match(db.queries[0].sql, /DO NOTHING/);
  assert.equal(db.queries[0].params[0], 1);
  assert.equal(db.queries[0].params[1], 10);
});
