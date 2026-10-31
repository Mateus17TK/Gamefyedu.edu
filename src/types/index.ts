export type UserRole = 'student' | 'teacher';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  title?: string;
  salt: string;
  pw: string;
  created: number;
  streakShields?: number;
  lastDailyChestClaim?: number;
}

export interface Subject {
  id: string;
  name: string;
  color: string;
  icon?: string;
}

export interface ClassRoom {
  id: string;
  name: string;
  owner: string;
  subjects?: Subject[];
  created?: number;
}

export interface Member {
  id: string;
  classId: string;
  uid: string;
  name: string;
  avatar?: string;
  joinedAt?: number;
}

export type ActivityKind = 'quiz' | 'vf' | 'pairs' | 'type' | 'boss';

export interface Question {
  q: string;
  o?: string[];
  a?: number;
  ans?: string[];
  e?: string;
}

export type Pair = [string, string];

export interface Activity {
  id: string;
  classId: string;
  sub?: string;
  kind: ActivityKind;
  title: string;
  xp: number;
  time: number;
  due?: string;
  questions: Question[];
  pairs?: Pair[];
  created?: number;
}

export interface Result {
  id: string;
  actId: string;
  classId: string;
  uid: string;
  name: string;
  av: string;
  kind: ActivityKind;
  win?: boolean;
  correct: number;
  total: number;
  xp: number;
  best: number;
  per: boolean[];
  at: number;
}

export type BadgeRarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface Badge {
  id: string;
  icon: string;
  title: string;
  desc: string;
  rarity: BadgeRarity;
  unlocked: boolean;
  progress: number;
  max: number;
}

export interface DailyMission {
  id: string;
  title: string;
  desc: string;
  rewardXp: number;
  completed: boolean;
  progress: number;
  target: number;
}

export interface StudentLeaderboardEntry {
  uid: string;
  name: string;
  av: string;
  xp: number;
  correct: number;
  total: number;
  acts: number;
  accuracy: number;
  rank?: number;
}
