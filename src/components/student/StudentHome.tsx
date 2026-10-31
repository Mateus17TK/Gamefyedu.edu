import React, { useMemo } from 'react';
import { Activity, DailyMission, Result, User } from '../../types';
import { getLevel, getTitle, getLevelProgress, getDailyMissions } from '../../utils/gamification';
import { Flame, Sparkles, CheckCircle2, Circle, Trophy, ArrowRight, Shield, Swords } from 'lucide-react';
import { sound } from '../../services/audio';

export interface StudentHomeProps {
  user: User;
  totalXP: number;
  streakDays: number;
  results: Result[];
  activities: Activity[];
  onStartActivity: (act: Activity) => void;
  onNavigateTab: (tab: string) => void;
  onOpenChest: () => void;
  canClaimChest: boolean;
}

export const StudentHome: React.FC<StudentHomeProps> = React.memo(({
  user,
  totalXP,
  streakDays,
  results,
  activities,
  onStartActivity,
  onNavigateTab,
  onOpenChest,
  canClaimChest,
}) => {
  const level = useMemo(() => getLevel(totalXP), [totalXP]);
  const title = useMemo(() => getTitle(totalXP), [totalXP]);
  const progress = useMemo(() => getLevelProgress(totalXP), [totalXP]);
  const missions = useMemo(() => getDailyMissions(results), [results]);

  const totalActsDone = results.length;
  const totalQuestions = results.reduce((sum, r) => sum + (r.total || 0), 0);
  const totalCorrect = results.reduce((sum, r) => sum + (r.correct || 0), 0);
  const accuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

  // Find boss activity or next pending activity
  const featuredBoss = useMemo(() => {
    return activities.find(a => a.kind === 'boss');
  }, [activities]);

  const allMissionsComplete = useMemo(() => {
    return missions.every(m => m.completed);
  }, [missions]);

  return (
    <div className="space-y-6">
      
      {/* Hero Card */}
      <section className="relative overflow-hidden bg-gradient-to-br from-violet-600 via-indigo-600 to-purple-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-2xl pointer-events-none -mr-20 -mt-20" />
        
        <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="relative">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-white/20 backdrop-blur-md border-2 border-white/30 flex items-center justify-center text-5xl sm:text-6xl shadow-inner select-none">
              {user.avatar}
            </div>
            <div className="absolute -bottom-2 -right-2 px-2.5 py-0.5 bg-amber-400 text-slate-900 font-extrabold text-xs rounded-full shadow-md">
              Nv.{level}
            </div>
          </div>

          <div className="flex-1 text-center sm:text-left space-y-2">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h1 className="font-display font-extrabold text-2xl sm:text-3xl tracking-tight">
                Olá, {user.name}!
              </h1>
              <span className="px-3 py-0.5 rounded-full bg-white/15 text-xs font-semibold backdrop-blur-sm">
                {title}
              </span>
            </div>

            <p className="text-violet-100 text-sm">
              Mantenha o foco nos estudos! Você está a {progress.max - progress.current} XP do Nível {level + 1}.
            </p>

            {/* Level XP Bar */}
            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between text-xs font-semibold text-violet-200">
                <span>Progresso do Nível</span>
                <span className="font-mono">{progress.current} / {progress.max} XP</span>
              </div>
              <div className="w-full h-3 bg-black/20 rounded-full overflow-hidden p-0.5 border border-white/20">
                <div
                  className="h-full bg-gradient-to-r from-amber-400 to-amber-300 rounded-full transition-all duration-700"
                  style={{ width: `${progress.percent}%` }}
                />
              </div>
            </div>

            {/* Quick Actions Row */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-2">
              <div className="flex items-center gap-1.5 px-3 py-1 bg-white/15 rounded-xl text-xs font-bold">
                <Flame className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span>{streakDays} dias de ofensiva</span>
              </div>
              {canClaimChest && (
                <button
                  onClick={() => {
                    sound.playClick();
                    onOpenChest();
                  }}
                  className="flex items-center gap-1.5 px-3 py-1 bg-amber-400 hover:bg-amber-300 text-slate-900 rounded-xl text-xs font-extrabold shadow-md transition-all animate-pulse"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Abrir Baú Diário!</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">XP Acumulado</span>
          <div className="font-display font-extrabold text-2xl sm:text-3xl text-violet-600 dark:text-violet-400 mt-1 tabular-nums">
            {totalXP}
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 block">em todas as matérias</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Atividades</span>
          <div className="font-display font-extrabold text-2xl sm:text-3xl text-emerald-600 dark:text-emerald-400 mt-1 tabular-nums">
            {totalActsDone}
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 block">concluídas</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Precisão Geral</span>
          <div className="font-display font-extrabold text-2xl sm:text-3xl text-amber-500 dark:text-amber-400 mt-1 tabular-nums">
            {accuracy}%
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 block">{totalCorrect} de {totalQuestions} acertos</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Ofensiva Atual</span>
          <div className="font-display font-extrabold text-2xl sm:text-3xl text-rose-500 mt-1 flex items-center gap-1.5 tabular-nums">
            <Flame className="w-6 h-6 fill-rose-500" />
            <span>{streakDays}d</span>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 block">dias consecutivos</span>
        </div>
      </div>

      {/* Daily Missions & Boss Showcase */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Missions Card (2 cols) */}
        <div className="lg:col-span-2 p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">🎯</span>
              <h2 className="font-display font-bold text-lg text-slate-900 dark:text-white">
                Missões Diárias
              </h2>
            </div>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Renovam a cada dia
            </span>
          </div>

          <div className="space-y-3">
            {missions.map((mission) => (
              <div
                key={mission.id}
                className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                  mission.completed
                    ? 'bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40 text-emerald-900 dark:text-emerald-300'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  {mission.completed ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                  ) : (
                    <Circle className="w-5 h-5 text-slate-300 dark:text-slate-600 shrink-0" />
                  )}
                  <div>
                    <h3 className="font-semibold text-sm leading-snug">
                      {mission.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {mission.desc}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-mono text-xs font-bold text-violet-600 dark:text-violet-400">
                    +{mission.rewardXp} XP
                  </span>
                </div>
              </div>
            ))}
          </div>

          {allMissionsComplete && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl text-center text-xs font-bold text-amber-800 dark:text-amber-300">
              🌟 Parabéns! Todas as missões diárias de hoje foram concluídas!
            </div>
          )}
        </div>

        {/* Featured Challenge Spotlight (1 col) */}
        <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-rose-500/10 via-amber-500/10 to-violet-500/10 border border-rose-200 dark:border-rose-900/40 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="px-2.5 py-1 bg-rose-500 text-white font-extrabold text-[11px] rounded-lg uppercase tracking-wider">
                Desafio Especial
              </span>
              <Swords className="w-5 h-5 text-rose-500" />
            </div>

            {featuredBoss ? (
              <div className="space-y-2 mt-2">
                <div className="text-4xl text-center my-2">👹</div>
                <h3 className="font-display font-extrabold text-base text-slate-900 dark:text-white text-center">
                  {featuredBoss.title}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 text-center">
                  Enfrente o chefe da disciplina e conquiste o triplo de XP se conseguir derrotá-lo com 3 corações de vida!
                </p>
              </div>
            ) : (
              <div className="space-y-2 mt-2">
                <div className="text-4xl text-center my-2">📚</div>
                <h3 className="font-display font-extrabold text-base text-slate-900 dark:text-white text-center">
                  Explore Novas Matérias
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 text-center">
                  Descubra atividades criadas especialmente para o seu ano escolar.
                </p>
              </div>
            )}
          </div>

          <div className="pt-4">
            {featuredBoss ? (
              <button
                onClick={() => {
                  sound.playClick();
                  onStartActivity(featuredBoss);
                }}
                className="w-full py-3 px-4 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-2xl shadow-lg shadow-rose-600/30 transition-all flex items-center justify-center gap-2 text-sm"
              >
                <span>Desafiar o Chefe</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => {
                  sound.playClick();
                  onNavigateTab('play');
                }}
                className="w-full py-3 px-4 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-2xl shadow-lg shadow-violet-600/30 transition-all flex items-center justify-center gap-2 text-sm"
              >
                <span>Ver Atividades</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

      </div>

    </div>
  );
});
