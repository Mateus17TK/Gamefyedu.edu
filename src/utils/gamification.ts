import { Badge, DailyMission, Result, StudentLeaderboardEntry } from '../types';

export const XP_PER_LEVEL = 100;
export const MS_PER_DAY = 86_400_000;

export const TITLES = [
  'Novato Curioso',
  'Explorador do Saber',
  'Aventureiro do Conhecimento',
  'Herói dos Desafios',
  'Mestre da Sabedoria',
  'Lenda Lendária',
];

export function getLevel(xp: number): number {
  if (xp <= 0) return 1;
  return Math.floor(xp / XP_PER_LEVEL) + 1;
}

export function getLevelProgress(xp: number): { current: number; max: number; percent: number } {
  const current = xp % XP_PER_LEVEL;
  const percent = Math.min(100, Math.round((current / XP_PER_LEVEL) * 100));
  return { current, max: XP_PER_LEVEL, percent };
}

export function getTitle(xp: number): string {
  const lvl = getLevel(xp);
  const index = Math.min(lvl - 1, TITLES.length - 1);
  return TITLES[Math.max(0, index)];
}

export function getLocalDayNumber(timestamp: number): number {
  const d = new Date(timestamp);
  return Math.floor((timestamp - d.getTimezoneOffset() * 60 * 1000) / MS_PER_DAY);
}

export function calculateStreak(results: Result[], now: number = Date.now()): number {
  if (!results.length) return 0;
  
  const daysSet = new Set(
    results.map(r => getLocalDayNumber(r.at))
  );

  let currentDay = getLocalDayNumber(now);
  let streak = 0;

  // If student hasn't played today yet, check if they played yesterday to maintain active streak
  if (!daysSet.has(currentDay)) {
    currentDay--;
  }

  while (daysSet.has(currentDay)) {
    streak++;
    currentDay--;
  }

  return streak;
}

export function calculateQuestionXP(
  baseXP: number,
  timeRemainingSec: number,
  totalTimeSec: number,
  comboCount: number,
  isCorrect: boolean
): number {
  if (!isCorrect) return 0;

  // Speed bonus: up to 50% extra for answering quickly
  const speedRatio = totalTimeSec > 0 ? Math.max(0, timeRemainingSec / totalTimeSec) : 0;
  const speedBonus = Math.round(baseXP * 0.5 * speedRatio);

  // Combo bonus: +50% base XP for combo >= 3
  const comboBonus = comboCount >= 3 ? Math.ceil(baseXP * 0.5) : 0;

  return baseXP + speedBonus + comboBonus;
}

export function normalizeAnswer(str: string): string {
  return String(str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove diacritics
    .replace(/[^a-z0-9 \/,.]/g, '') // remove special symbols
    .replace(/\s+/g, ' ')
    .trim();
}

export function checkTypedAnswer(userAnswer: string, acceptedAnswers: string[]): boolean {
  const normUser = normalizeAnswer(userAnswer);
  if (!normUser) return false;

  return acceptedAnswers.some(accepted => {
    const normAccepted = normalizeAnswer(accepted);
    if (normUser === normAccepted) return true;
    
    // Numeric equivalence support: 0,5 == 0.5 == 1/2
    if ((normUser === '0.5' || normUser === '0,5' || normUser === '1/2') && 
        (normAccepted === '0.5' || normAccepted === '0,5' || normAccepted === '1/2')) {
      return true;
    }
    return false;
  });
}

export function getDailyMissions(results: Result[], now: number = Date.now()): DailyMission[] {
  const todayKey = getLocalDayNumber(now);
  const todayResults = results.filter(r => getLocalDayNumber(r.at) === todayKey);
  const academicToday = todayResults.filter(r => r.actId !== 'chest_daily');

  const totalActsDone = academicToday.length;
  const totalCorrectToday = academicToday.reduce((acc, r) => acc + (r.correct || 0), 0);
  const bestComboToday = academicToday.reduce((max, r) => Math.max(max, r.best || 0), 0);
  const bossDefeatedToday = academicToday.some(r => r.kind === 'boss' && r.win);

  return [
    {
      id: 'm_act',
      title: 'Desbravador Diário',
      desc: 'Conclua pelo menos 1 atividade hoje',
      rewardXp: 20,
      completed: totalActsDone >= 1,
      progress: Math.min(1, totalActsDone),
      target: 1,
    },
    {
      id: 'm_correct',
      title: 'Mente Afiada',
      desc: 'Acerte 5 questões hoje',
      rewardXp: 30,
      completed: totalCorrectToday >= 5,
      progress: Math.min(5, totalCorrectToday),
      target: 5,
    },
    {
      id: 'm_combo',
      title: 'Ritmo Perfeito',
      desc: 'Faça um combo de 3 acertos seguidos',
      rewardXp: 25,
      completed: bestComboToday >= 3,
      progress: Math.min(3, bestComboToday),
      target: 3,
    },
    {
      id: 'm_boss',
      title: 'Caçador de Desafios',
      desc: 'Derrote 1 Chefe ou faça 100% em qualquer quiz',
      rewardXp: 40,
      completed: bossDefeatedToday || academicToday.some(r => r.correct === r.total && r.total > 0),
      progress: (bossDefeatedToday || academicToday.some(r => r.correct === r.total && r.total > 0)) ? 1 : 0,
      target: 1,
    },
  ];
}

export function evaluateBadges(results: Result[], totalXP: number, streakDays: number): Badge[] {
  const academicResults = results.filter(r => r.actId !== 'chest_daily');
  const totalActs = academicResults.length;
  const totalQuestions = academicResults.reduce((acc, r) => acc + (r.total || 0), 0);
  const totalCorrect = academicResults.reduce((acc, r) => acc + (r.correct || 0), 0);
  const accuracy = totalQuestions > 0 ? totalCorrect / totalQuestions : 0;
  const maxCombo = academicResults.reduce((max, r) => Math.max(max, r.best || 0), 0);
  const perfectScores = academicResults.filter(r => r.correct === r.total && r.total > 0).length;
  const bossWins = academicResults.filter(r => r.kind === 'boss' && r.win).length;

  return [
    {
      id: 'b_first_step',
      icon: '🌱',
      title: 'Primeiro Passo',
      desc: 'Complete sua primeira atividade educacional',
      rarity: 'common',
      unlocked: totalActs >= 1,
      progress: Math.min(1, totalActs),
      max: 1,
    },
    {
      id: 'b_dedicated',
      icon: '🔥',
      title: 'Estudante Focado',
      desc: 'Complete 3 atividades diferentes',
      rarity: 'common',
      unlocked: totalActs >= 3,
      progress: Math.min(3, totalActs),
      max: 3,
    },
    {
      id: 'b_xp_100',
      icon: '⚡',
      title: 'Energia Pura',
      desc: 'Acumule 100 pontos de XP total',
      rarity: 'common',
      unlocked: totalXP >= 100,
      progress: Math.min(100, totalXP),
      max: 100,
    },
    {
      id: 'b_lvl_3',
      icon: '🏅',
      title: 'Aventureiro Nato',
      desc: 'Alcance o Nível 3',
      rarity: 'rare',
      unlocked: getLevel(totalXP) >= 3,
      progress: Math.min(3, getLevel(totalXP)),
      max: 3,
    },
    {
      id: 'b_combo_5',
      icon: '💎',
      title: 'Super Combo x5',
      desc: 'Acerte 5 perguntas em sequência sem errar',
      rarity: 'rare',
      unlocked: maxCombo >= 5,
      progress: Math.min(5, maxCombo),
      max: 5,
    },
    {
      id: 'b_streak_3',
      icon: '📅',
      title: 'Chama Acesa',
      desc: 'Mantenha uma ofensiva de 3 dias consecutivos',
      rarity: 'rare',
      unlocked: streakDays >= 3,
      progress: Math.min(3, streakDays),
      max: 3,
    },
    {
      id: 'b_accuracy_80',
      icon: '🎯',
      title: 'Mira Certeira',
      desc: 'Responda pelo menos 10 questões com 80%+ de precisão',
      rarity: 'epic',
      unlocked: totalQuestions >= 10 && accuracy >= 0.8,
      progress: Math.min(10, Math.round(accuracy * 10)),
      max: 10,
    },
    {
      id: 'b_perfect_star',
      icon: '⭐',
      title: 'Nota Máxima',
      desc: 'Acerte 100% das questões em 2 atividades',
      rarity: 'epic',
      unlocked: perfectScores >= 2,
      progress: Math.min(2, perfectScores),
      max: 2,
    },
    {
      id: 'b_boss_slayer',
      icon: '👹',
      title: 'Domador de Chefes',
      desc: 'Derrote 2 Chefes de matéria',
      rarity: 'legendary',
      unlocked: bossWins >= 2,
      progress: Math.min(2, bossWins),
      max: 2,
    },
    {
      id: 'b_legend_xp',
      icon: '👑',
      title: 'Lenda Viva',
      desc: 'Acumule 500 XP total e domine o conhecimento',
      rarity: 'legendary',
      unlocked: totalXP >= 500,
      progress: Math.min(500, totalXP),
      max: 500,
    },
  ];
}

export function buildLeaderboard(results: Result[]): StudentLeaderboardEntry[] {
  const map: Record<string, StudentLeaderboardEntry> = {};

  for (const r of results) {
    if (!map[r.uid]) {
      map[r.uid] = {
        uid: r.uid,
        name: r.name,
        av: r.av || '🦊',
        xp: 0,
        correct: 0,
        total: 0,
        acts: 0,
        accuracy: 0,
      };
    }
    const entry = map[r.uid];
    entry.xp += r.xp || 0;
    
    // Only count real school activities towards acts count and question accuracy
    if (r.actId !== 'chest_daily') {
      entry.correct += r.correct || 0;
      entry.total += r.total || 0;
      entry.acts += 1;
    }
  }

  const list = Object.values(map).map(entry => ({
    ...entry,
    accuracy: entry.total > 0 ? Math.round((entry.correct / entry.total) * 100) : 0,
  }));

  // Sort descending by XP, tie breaker by accuracy
  list.sort((a, b) => b.xp - a.xp || b.accuracy - a.accuracy);

  return list.map((entry, index) => ({
    ...entry,
    rank: index + 1,
  }));
}
