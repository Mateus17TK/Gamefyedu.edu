import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getLevel,
  getLevelProgress,
  getTitle,
  calculateStreak,
  calculateQuestionXP,
  normalizeAnswer,
  checkTypedAnswer,
  buildLeaderboard,
  MS_PER_DAY,
} from './gamification.ts';
import { Result } from '../types/index.ts';

test('getLevel calculates correct levels from XP', () => {
  assert.equal(getLevel(0), 1);
  assert.equal(getLevel(50), 1);
  assert.equal(getLevel(100), 2);
  assert.equal(getLevel(250), 3);
  assert.equal(getLevel(550), 6);
});

test('getLevelProgress returns correct percentage within current level', () => {
  const p1 = getLevelProgress(45);
  assert.equal(p1.current, 45);
  assert.equal(p1.percent, 45);

  const p2 = getLevelProgress(130);
  assert.equal(p2.current, 30);
  assert.equal(p2.percent, 30);
});

test('getTitle returns descriptive title according to level progression', () => {
  assert.equal(getTitle(0), 'Novato Curioso');
  assert.equal(getTitle(100), 'Explorador do Saber');
  assert.equal(getTitle(500), 'Lenda Lendária');
});

test('calculateStreak accounts for consecutive active days', () => {
  const now = 1700000000000;
  const day = MS_PER_DAY;

  const mockResults: Result[] = [
    {
      id: '1',
      actId: 'a1',
      classId: 'c1',
      uid: 'u1',
      name: 'Aluno',
      av: '🦊',
      kind: 'quiz',
      correct: 5,
      total: 5,
      xp: 50,
      best: 5,
      per: [true, true, true, true, true],
      at: now, // today
    },
    {
      id: '2',
      actId: 'a2',
      classId: 'c1',
      uid: 'u1',
      name: 'Aluno',
      av: '🦊',
      kind: 'quiz',
      correct: 5,
      total: 5,
      xp: 50,
      best: 5,
      per: [true, true, true, true, true],
      at: now - day, // yesterday
    },
    {
      id: '3',
      actId: 'a3',
      classId: 'c1',
      uid: 'u1',
      name: 'Aluno',
      av: '🦊',
      kind: 'quiz',
      correct: 5,
      total: 5,
      xp: 50,
      best: 5,
      per: [true, true, true, true, true],
      at: now - 2 * day, // 2 days ago
    },
  ];

  assert.equal(calculateStreak(mockResults, now), 3);
});

test('calculateQuestionXP awards speed and combo bonuses for correct answers', () => {
  // Correct answer with half time left and no combo
  const xpNormal = calculateQuestionXP(10, 10, 20, 1, true);
  // base (10) + speed bonus (round(10 * 0.5 * 0.5) = 3) = 13
  assert.equal(xpNormal, 13);

  // Correct answer with high combo
  const xpCombo = calculateQuestionXP(10, 10, 20, 3, true);
  // 13 + combo bonus (ceil(10 * 0.5) = 5) = 18
  assert.equal(xpCombo, 18);

  // Incorrect answer gets 0 XP
  const xpWrong = calculateQuestionXP(10, 10, 20, 3, false);
  assert.equal(xpWrong, 0);
});

test('normalizeAnswer and checkTypedAnswer handle flexible student inputs', () => {
  assert.equal(normalizeAnswer('  São Paulo! '), 'sao paulo');
  assert.equal(normalizeAnswer('1/2'), '1/2');

  const accepted = ['1/2', '0.5', 'metade'];
  assert.equal(checkTypedAnswer('1/2', accepted), true);
  assert.equal(checkTypedAnswer(' 0,5 ', accepted), true);
  assert.equal(checkTypedAnswer('Metade', accepted), true);
  assert.equal(checkTypedAnswer('1/4', accepted), false);
});

test('buildLeaderboard aggregates results by student and sorts correctly', () => {
  const results: Result[] = [
    {
      id: 'r1',
      actId: 'a1',
      classId: 'c1',
      uid: 'studentA',
      name: 'Alice',
      av: '🦄',
      kind: 'quiz',
      correct: 8,
      total: 10,
      xp: 80,
      best: 4,
      per: [],
      at: Date.now(),
    },
    {
      id: 'r2',
      actId: 'a2',
      classId: 'c1',
      uid: 'studentB',
      name: 'Bruno',
      av: '🐼',
      kind: 'quiz',
      correct: 10,
      total: 10,
      xp: 120,
      best: 10,
      per: [],
      at: Date.now(),
    },
    {
      id: 'r3',
      actId: 'a3',
      classId: 'c1',
      uid: 'studentA',
      name: 'Alice',
      av: '🦄',
      kind: 'quiz',
      correct: 5,
      total: 5,
      xp: 60,
      best: 5,
      per: [],
      at: Date.now(),
    },
  ];

  const leaderboard = buildLeaderboard(results);
  assert.equal(leaderboard.length, 2);
  // Alice total XP = 80 + 60 = 140
  // Bruno total XP = 120
  assert.equal(leaderboard[0].name, 'Alice');
  assert.equal(leaderboard[0].xp, 140);
  assert.equal(leaderboard[0].rank, 1);
  assert.equal(leaderboard[1].name, 'Bruno');
  assert.equal(leaderboard[1].xp, 120);
  assert.equal(leaderboard[1].rank, 2);
});
