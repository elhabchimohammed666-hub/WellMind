import test from 'node:test';
import assert from 'node:assert/strict';
import { aggregateAnswers, deidentifyFeedback } from '../src/services/privacy.js';
import { canReport, isSurveyOpen, responseIdentity, validateAnswers } from '../src/services/survey-rules.js';
import { requireRole } from '../src/middleware/auth.js';
import { analyzeFeedback } from '../src/services/ai.js';

test('suppresses a report until the configured minimum is reached', () => {
  assert.equal(canReport(4, 5), false);
  assert.equal(canReport(5, 5), true);
  assert.equal(canReport(0, 5), false);
});

test('anonymous responses never retain an account identifier', () => {
  assert.equal(responseIdentity(true, 'employee-id'), null);
  assert.equal(responseIdentity(false, 'employee-id'), 'employee-id');
});

test('validates ratings, choices, required fields and optional feedback', () => {
  const survey = {
    questions: [
      { id: 'rating', type: 'rating', min: 1, max: 5, required: true },
      { id: 'choice', type: 'choice', options: ['Oui', 'Non'], required: true },
      { id: 'comment', type: 'text', required: false },
    ],
  };
  assert.equal(validateAnswers(survey, [
    { questionId: 'rating', value: 4 },
    { questionId: 'choice', value: 'Oui' },
    { questionId: 'comment', value: '' },
  ]), null);
  assert.match(validateAnswers(survey, [
    { questionId: 'rating', value: 9 },
    { questionId: 'choice', value: 'Oui' },
    { questionId: 'comment', value: '' },
  ]), /échelle/);
  assert.match(validateAnswers(survey, [
    { questionId: 'rating', value: 4 },
    { questionId: 'choice', value: '' },
    { questionId: 'comment', value: '' },
  ]), /obligatoires/);
});

test('keeps access to HR routes role-gated', () => {
  const guard = requireRole('hr');
  const res = { statusCode: 200, body: null, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; } };
  let nextCalled = false;
  guard({ user: { role: 'employee' } }, res, () => { nextCalled = true; });
  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 403);
});

test('rejects unavailable and out-of-window surveys', () => {
  const now = Date.now();
  assert.equal(isSurveyOpen({ status: 'published', startsAt: now - 1000, endsAt: now + 1000 }, now), true);
  assert.equal(isSurveyOpen({ status: 'draft', startsAt: now - 1000, endsAt: now + 1000 }, now), false);
  assert.equal(isSurveyOpen({ status: 'published', startsAt: now - 2000, endsAt: now - 1000 }, now), false);
});

test('masks contact details and employee names before analysis', () => {
  const [comment] = deidentifyFeedback(
    ['Contactez lea@atlas.example au 06 12 34 56 78 ; signé Léa Martin.'],
    ['Léa Martin'],
  );
  assert.doesNotMatch(comment, /lea@atlas\.example|06 12 34 56 78|Léa Martin/);
  assert.match(comment, /\[adresse masquée\]/);
  assert.match(comment, /\[numéro masqué\]/);
  assert.match(comment, /\[nom masqué\]/);
});

test('computes survey statistics from responses rather than AI output', () => {
  const survey = {
    questions: [
      { id: 'score', label: 'Charge', type: 'rating', min: 1, max: 5 },
      { id: 'team', label: 'Équipe', type: 'choice', options: ['Oui', 'Non'] },
    ],
  };
  const statistics = aggregateAnswers(survey, [
    { answers: [{ questionId: 'score', value: 2 }, { questionId: 'team', value: 'Oui' }] },
    { answers: [{ questionId: 'score', value: 4 }, { questionId: 'team', value: 'Non' }] },
  ], 1);
  assert.equal(statistics[0].average, 3);
  assert.deepEqual(statistics[0].distribution, { 1: 0, 2: 1, 3: 0, 4: 1, 5: 0 });
  assert.deepEqual(statistics[1].distribution, { Oui: 1, Non: 1 });
});

test('masks question results and low-frequency distribution cells', () => {
  const survey = {
    questions: [
      { id: 'score', label: 'Charge', type: 'rating', min: 1, max: 5 },
      { id: 'team', label: 'Équipe', type: 'choice', options: ['Oui', 'Non'] },
      { id: 'comment', label: 'Commentaire', type: 'text' },
    ],
  };
  const responses = [
    { answers: [{ questionId: 'score', value: 4 }, { questionId: 'team', value: 'Oui' }, { questionId: 'comment', value: 'A' }] },
    { answers: [{ questionId: 'score', value: 4 }, { questionId: 'team', value: 'Oui' }, { questionId: 'comment', value: 'B' }] },
    { answers: [{ questionId: 'score', value: 4 }, { questionId: 'team', value: 'Oui' }, { questionId: 'comment', value: 'C' }] },
    { answers: [{ questionId: 'score', value: 4 }, { questionId: 'team', value: 'Oui' }, { questionId: 'comment', value: 'D' }] },
    { answers: [{ questionId: 'score', value: 1 }, { questionId: 'team', value: 'Non' }, { questionId: 'comment', value: 'E' }] },
    { answers: [{ questionId: 'score', value: 4 }, { questionId: 'team', value: 'Oui' }, { questionId: 'comment', value: 'F' }] },
    { answers: [{ questionId: 'score', value: 4 }, { questionId: 'team', value: 'Oui' }, { questionId: 'comment', value: 'G' }] },
    { answers: [{ questionId: 'score', value: 4 }, { questionId: 'team', value: 'Oui' }, { questionId: 'comment', value: 'H' }] },
    { answers: [{ questionId: 'score', value: 4 }, { questionId: 'team', value: 'Oui' }, { questionId: 'comment', value: 'I' }] },
    { answers: [{ questionId: 'score', value: 4 }, { questionId: 'team', value: 'Oui' }, { questionId: 'comment', value: 'J' }] },
  ];
  const statistics = aggregateAnswers(survey, responses);

  assert.equal(statistics[0].suppressed, false);
  assert.equal(statistics[0].count, 10);
  assert.equal(statistics[0].distribution[1], null);
  assert.equal(statistics[0].distribution[4], 9);
  assert.equal(statistics[1].distribution.Non, null);
  assert.equal(statistics[1].distribution.Oui, 9);
  assert.equal(statistics[2].suppressed, false);

  const smallResults = aggregateAnswers(survey, responses.slice(0, 4));
  assert.equal(smallResults[0].suppressed, true);
  assert.equal(smallResults[0].average, null);
  assert.equal(smallResults[0].count, null);
  assert.ok(Object.values(smallResults[0].distribution).every(count => count === null));
  assert.equal(smallResults[2].count, null);
});

test('reports missing AI configuration without making a request', async () => {
  const originalKey = process.env.GEMINI_API_KEY;
  delete process.env.GEMINI_API_KEY;
  try {
    await assert.rejects(analyzeFeedback(['Retour anonymisé']), { status: 503 });
  } finally {
    if (originalKey === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = originalKey;
  }
});
