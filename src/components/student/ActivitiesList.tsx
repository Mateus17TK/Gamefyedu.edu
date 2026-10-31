import React, { useState, useMemo } from 'react';
import { Activity, ActivityKind, ClassRoom, Result, User } from '../../types';
import { sound } from '../../services/audio';
import { Play, RotateCcw, CheckCircle2, Clock, Sparkles, Filter, Search } from 'lucide-react';

export interface ActivitiesListProps {
  activities: Activity[];
  currentClass: ClassRoom | null;
  user: User;
  results: Result[];
  onStartActivity: (act: Activity) => void;
}

const KIND_LABELS: Record<ActivityKind, { label: string; icon: string }> = {
  quiz: { label: 'Quiz', icon: '🎯' },
  vf: { label: 'Relâmpago V/F', icon: '⚡' },
  pairs: { label: 'Ligar Pares', icon: '🧩' },
  type: { label: 'Digitada', icon: '⌨️' },
  boss: { label: 'Chefe', icon: '👹' },
};

export const ActivitiesList: React.FC<ActivitiesListProps> = React.memo(({
  activities,
  currentClass,
  user,
  results,
  onStartActivity,
}) => {
  const [filterKind, setFilterKind] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const subjectsMap = useMemo(() => {
    const map = new Map<string, { name: string; color: string }>();
    if (currentClass?.subjects) {
      currentClass.subjects.forEach(s => map.set(s.id, { name: s.name, color: s.color }));
    }
    return map;
  }, [currentClass]);

  const resultsMap = useMemo(() => {
    const map = new Map<string, Result>();
    results.forEach(r => {
      if (r.uid === user.id) {
        // Keep best/latest
        map.set(r.actId, r);
      }
    });
    return map;
  }, [results, user.id]);

  const filteredActivities = useMemo(() => {
    return activities.filter(act => {
      if (filterKind !== 'all' && act.kind !== filterKind) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = act.title.toLowerCase().includes(q);
        const sub = act.sub ? subjectsMap.get(act.sub) : null;
        const matchesSub = sub ? sub.name.toLowerCase().includes(q) : false;
        if (!matchesTitle && !matchesSub) return false;
      }
      return true;
    });
  }, [activities, filterKind, searchQuery, subjectsMap]);

  return (
    <div className="space-y-5">
      
      {/* Top Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Pesquisar por título ou matéria..."
            className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-thin">
          {[
            { id: 'all', label: 'Todas' },
            { id: 'quiz', label: 'Quizzes' },
            { id: 'boss', label: 'Chefes' },
            { id: 'pairs', label: 'Pares' },
            { id: 'vf', label: 'Relâmpago' },
            { id: 'type', label: 'Digitadas' },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => {
                sound.playClick();
                setFilterKind(f.id);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                filterKind === f.id
                  ? 'bg-violet-600 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Activity Cards Grid */}
      {filteredActivities.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
          <span className="text-4xl block mb-2">🔍</span>
          <p className="font-semibold text-base">Nenhuma atividade encontrada com estes filtros.</p>
          <p className="text-xs mt-1">Tente pesquisar com outro termo ou selecionar outra categoria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredActivities.map((act) => {
            const sub = act.sub ? subjectsMap.get(act.sub) : null;
            const res = resultsMap.get(act.id);
            const isCompleted = !!res;
            const isBossLost = isCompleted && act.kind === 'boss' && !res.win;
            const totalQ = act.kind === 'pairs' ? (act.pairs?.length || 0) : act.questions.length;
            const kindInfo = KIND_LABELS[act.kind] || KIND_LABELS.quiz;

            return (
              <div
                key={act.id}
                className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-4 group"
              >
                <div className="space-y-2.5">
                  
                  {/* Subject Tag & Kind Indicator */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {sub && (
                        <span
                          className="px-2.5 py-0.5 rounded-full text-[11px] font-bold text-white shadow-sm"
                          style={{ backgroundColor: sub.color }}
                        >
                          {sub.name}
                        </span>
                      )}
                      <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1">
                        <span>{kindInfo.icon}</span>
                        <span>{kindInfo.label}</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-xs font-mono font-bold text-violet-600 dark:text-violet-400">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{act.xp} XP</span>
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="font-display font-bold text-base sm:text-lg text-slate-900 dark:text-white leading-snug group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                    {act.title}
                  </h3>

                  {/* Metrics */}
                  <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                    <span>{totalQ} {act.kind === 'pairs' ? 'pares' : 'questões'}</span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-amber-500" />
                      {act.time}s / questão
                    </span>
                  </div>
                </div>

                {/* Bottom Row / Status & Action */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                  <div>
                    {isCompleted && !isBossLost ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{res.correct}/{res.total} acertos · {res.xp} XP</span>
                      </span>
                    ) : isBossLost ? (
                      <span className="text-xs font-bold text-rose-500">
                        💀 Derrotado pelo chefe
                      </span>
                    ) : (
                      <span className="text-xs font-semibold text-slate-400">
                        Pendente
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      sound.playClick();
                      onStartActivity(act);
                    }}
                    className={`flex items-center gap-1.5 py-2 px-4 rounded-xl font-bold text-xs transition-all shadow-sm ${
                      isBossLost
                        ? 'bg-rose-600 hover:bg-rose-700 text-white'
                        : isCompleted
                        ? 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                        : 'bg-violet-600 hover:bg-violet-700 text-white shadow-violet-600/20'
                    }`}
                  >
                    {isBossLost ? (
                      <>
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Revanche</span>
                      </>
                    ) : isCompleted ? (
                      <>
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Refazer</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Jogar</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
});
