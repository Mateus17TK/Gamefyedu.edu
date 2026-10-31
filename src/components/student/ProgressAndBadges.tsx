import React, { useMemo } from 'react';
import { Activity, Badge, BadgeRarity, Result, User } from '../../types';
import { evaluateBadges } from '../../utils/gamification';
import { Award, Calendar, CheckCircle2, Lock, Sparkles, TrendingUp } from 'lucide-react';

export interface ProgressAndBadgesProps {
  user: User;
  results: Result[];
  totalXP: number;
  streakDays: number;
  activities: Activity[];
}

const RARITY_COLORS: Record<BadgeRarity, { border: string; bg: string; text: string; label: string }> = {
  common: {
    border: 'border-slate-300 dark:border-slate-700',
    bg: 'bg-slate-100/50 dark:bg-slate-800/40',
    text: 'text-slate-600 dark:text-slate-400',
    label: 'Comum',
  },
  rare: {
    border: 'border-sky-400/80',
    bg: 'bg-sky-50/50 dark:bg-sky-950/30',
    text: 'text-sky-600 dark:text-sky-400',
    label: 'Raro',
  },
  epic: {
    border: 'border-purple-400/80',
    bg: 'bg-purple-50/50 dark:bg-purple-950/30',
    text: 'text-purple-600 dark:text-purple-400',
    label: 'Épico',
  },
  legendary: {
    border: 'border-amber-400',
    bg: 'bg-amber-50/50 dark:bg-amber-950/30',
    text: 'text-amber-600 dark:text-amber-400',
    label: 'Lendário',
  },
};

export const ProgressAndBadges: React.FC<ProgressAndBadgesProps> = React.memo(({
  user,
  results,
  totalXP,
  streakDays,
  activities,
}) => {
  const myResults = useMemo(() => {
    return results.filter(r => r.uid === user.id);
  }, [results, user.id]);

  const badges = useMemo(() => {
    return evaluateBadges(myResults, totalXP, streakDays);
  }, [myResults, totalXP, streakDays]);

  const unlockedCount = useMemo(() => {
    return badges.filter(b => b.unlocked).length;
  }, [badges]);

  const activitiesMap = useMemo(() => {
    const map = new Map<string, string>();
    activities.forEach(a => map.set(a.id, a.title));
    return map;
  }, [activities]);

  // Sort results by date descending
  const recentHistory = useMemo(() => {
    return [...myResults].sort((a, b) => b.at - a.at);
  }, [myResults]);

  return (
    <div className="space-y-8">
      
      {/* Badges Section Header */}
      <div>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display font-extrabold text-xl text-slate-900 dark:text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              <span>Conquistas & Troféus Acadêmicos</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Desbloqueie insígnias exclusivas demonstrando consistência, precisão e derrotando chefes.
            </p>
          </div>
          <div className="text-right">
            <span className="font-mono font-bold text-sm text-violet-600 dark:text-violet-400">
              {unlockedCount} de {badges.length}
            </span>
            <span className="text-xs text-slate-400 block">desbloqueadas</span>
          </div>
        </div>

        {/* Badges Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 mt-4">
          {badges.map((badge) => {
            const rarityStyle = RARITY_COLORS[badge.rarity];
            const percent = Math.min(100, Math.round((badge.progress / badge.max) * 100));

            return (
              <div
                key={badge.id}
                className={`p-4 rounded-3xl border-2 transition-all flex flex-col justify-between gap-3 ${
                  badge.unlocked
                    ? `${rarityStyle.border} ${rarityStyle.bg} shadow-sm`
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 opacity-70'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 ${
                      badge.unlocked
                        ? 'bg-white dark:bg-slate-800 shadow-sm'
                        : 'bg-slate-200 dark:bg-slate-800 grayscale'
                    }`}
                  >
                    {badge.unlocked ? badge.icon : '🔒'}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <h3 className="font-display font-bold text-sm text-slate-900 dark:text-white truncate">
                        {badge.title}
                      </h3>
                      <span className={`text-[10px] font-extrabold uppercase tracking-wider ${rarityStyle.text}`}>
                        {rarityStyle.label}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                      {badge.desc}
                    </p>
                  </div>
                </div>

                {/* Progress bar towards badge unlock */}
                <div className="space-y-1 pt-1">
                  <div className="flex justify-between text-[11px] font-medium text-slate-400">
                    <span>{badge.unlocked ? 'Conquistado!' : 'Progresso'}</span>
                    <span className="font-mono">{badge.progress} / {badge.max}</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        badge.unlocked ? 'bg-emerald-500' : 'bg-violet-500'
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Accuracy Performance Histogram / Chart */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-500" />
            <h3 className="font-display font-bold text-base text-slate-900 dark:text-white">
              Curva de Acertos Recentes
            </h3>
          </div>
          <span className="text-xs text-slate-400">Taxa de acerto por tentativa</span>
        </div>

        {myResults.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-6">
            Nenhuma atividade concluída ainda. Comece jogando um quiz!
          </p>
        ) : (
          <div className="space-y-2">
            <div className="h-32 flex items-end gap-2 pt-4 px-2 border-b border-slate-100 dark:border-slate-800">
              {myResults.slice(-12).map((r, idx) => {
                const pct = r.total > 0 ? Math.round((r.correct / r.total) * 100) : 0;
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1 group relative">
                    <div
                      className="w-full rounded-t-lg bg-gradient-to-t from-violet-600 to-indigo-500 hover:from-amber-400 hover:to-amber-300 transition-all cursor-pointer min-h-[8px]"
                      style={{ height: `${Math.max(8, pct)}%` }}
                    />
                    <div className="opacity-0 group-hover:opacity-100 absolute -top-8 bg-slate-900 text-white text-[10px] font-bold py-1 px-2 rounded-lg pointer-events-none transition-opacity whitespace-nowrap z-20">
                      {pct}% ({r.correct}/{r.total})
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between text-[11px] text-slate-400 px-1">
              <span>Primeiras tentativas</span>
              <span>Mais recentes →</span>
            </div>
          </div>
        )}
      </div>

      {/* History Log */}
      <div className="space-y-3">
        <h3 className="font-display font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
          <Calendar className="w-4 h-4 text-violet-500" />
          <span>Histórico Detalhado</span>
        </h3>

        {recentHistory.length === 0 ? (
          <p className="text-xs text-slate-400">Nenhum registro no histórico.</p>
        ) : (
          <div className="space-y-2">
            {recentHistory.map((r) => {
              const title = activitiesMap.get(r.actId) || 'Atividade Educacional';
              const dateStr = new Date(r.at).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={r.id}
                  className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="font-semibold text-slate-900 dark:text-white">
                      {title}
                    </div>
                    <div className="text-slate-400 text-[11px]">
                      {dateStr}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      {r.correct}/{r.total} acertos
                    </span>
                    <span className="font-mono font-bold text-violet-600 dark:text-violet-400">
                      +{r.xp} XP
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
});
