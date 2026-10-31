import React, { useState, useMemo } from 'react';
import { Activity, ClassRoom, Result, Subject, User } from '../../types';
import { sound } from '../../services/audio';
import { getTitle } from '../../utils/gamification';
import { ArrowLeft, BookOpen, CheckCircle2, Trophy, Play, Clock, Sparkles } from 'lucide-react';

export interface SubjectsHubProps {
  currentClass: ClassRoom | null;
  activities: Activity[];
  results: Result[];
  user: User;
  onStartActivity: (act: Activity) => void;
}

export const SubjectsHub: React.FC<SubjectsHubProps> = React.memo(({
  currentClass,
  activities,
  results,
  user,
  onStartActivity,
}) => {
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);

  const subjects = useMemo(() => {
    return currentClass?.subjects || [];
  }, [currentClass]);

  const selectedSubject = useMemo(() => {
    return subjects.find(s => s.id === selectedSubjectId) || null;
  }, [subjects, selectedSubjectId]);

  // Subject calculations
  const subjectStats = useMemo(() => {
    const stats: Record<string, { totalActs: number; doneActs: number; totalXP: number; correct: number; totalQ: number }> = {};
    
    subjects.forEach(s => {
      const subActs = activities.filter(a => a.sub === s.id);
      const subActIds = new Set(subActs.map(a => a.id));
      const userSubResults = results.filter(r => r.uid === user.id && subActIds.has(r.actId));

      const doneActIds = new Set(userSubResults.map(r => r.actId));
      const totalXP = userSubResults.reduce((acc, r) => acc + (r.xp || 0), 0);
      const correct = userSubResults.reduce((acc, r) => acc + (r.correct || 0), 0);
      const totalQ = userSubResults.reduce((acc, r) => acc + (r.total || 0), 0);

      stats[s.id] = {
        totalActs: subActs.length,
        doneActs: doneActIds.size,
        totalXP,
        correct,
        totalQ,
      };
    });

    return stats;
  }, [subjects, activities, results, user.id]);

  // If a subject is selected, show detail view
  if (selectedSubject) {
    const st = subjectStats[selectedSubject.id] || { totalActs: 0, doneActs: 0, totalXP: 0, correct: 0, totalQ: 0 };
    const subActs = activities.filter(a => a.sub === selectedSubject.id);
    const subPercent = st.totalActs > 0 ? Math.round((st.doneActs / st.totalActs) * 100) : 0;
    const accuracy = st.totalQ > 0 ? Math.round((st.correct / st.totalQ) * 100) : 0;

    // Leaderboard for this subject
    const subjectLeaderboard = (() => {
      const subActIds = new Set(subActs.map(a => a.id));
      const subResults = results.filter(r => subActIds.has(r.actId));
      const map: Record<string, { name: string; av: string; xp: number }> = {};
      subResults.forEach(r => {
        if (!map[r.uid]) map[r.uid] = { name: r.name, av: r.av, xp: 0 };
        map[r.uid].xp += r.xp;
      });
      return Object.values(map).sort((a, b) => b.xp - a.xp).slice(0, 5);
    })();

    return (
      <div className="space-y-6">
        <button
          onClick={() => {
            sound.playClick();
            setSelectedSubjectId(null);
          }}
          className="flex items-center gap-2 text-sm font-bold text-violet-600 dark:text-violet-400 hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar para todas as matérias</span>
        </button>

        {/* Subject Hero */}
        <section
          className="rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${selectedSubject.color}, #1f1147)`,
          }}
        >
          <div className="relative z-10 space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-4xl">{selectedSubject.icon || '📚'}</span>
              <div>
                <h1 className="font-display font-extrabold text-2xl sm:text-3xl">
                  {selectedSubject.name}
                </h1>
                <p className="text-xs text-white/80">
                  {getTitle(st.totalXP)} · {st.totalXP} XP conquistados · {accuracy}% de precisão
                </p>
              </div>
            </div>

            <div className="space-y-1 pt-2">
              <div className="flex justify-between text-xs font-semibold text-white/90">
                <span>Progresso da Matéria</span>
                <span>{st.doneActs} de {st.totalActs} atividades concluídas ({subPercent}%)</span>
              </div>
              <div className="w-full h-3 bg-black/30 rounded-full overflow-hidden p-0.5 border border-white/20">
                <div
                  className="h-full bg-white rounded-full transition-all duration-500"
                  style={{ width: `${subPercent}%` }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Subject Activities & Top Rankers */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <h2 className="font-display font-bold text-lg text-slate-900 dark:text-white">
              Atividades de {selectedSubject.name}
            </h2>

            {subActs.length === 0 ? (
              <div className="p-8 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-400">
                Nenhuma atividade cadastrada para esta matéria ainda.
              </div>
            ) : (
              <div className="space-y-3">
                {subActs.map(act => {
                  const userRes = results.find(r => r.uid === user.id && r.actId === act.id);
                  const isDone = !!userRes;
                  return (
                    <div
                      key={act.id}
                      className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <h3 className="font-semibold text-sm sm:text-base text-slate-900 dark:text-white">
                          {act.title}
                        </h3>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <span className="font-mono text-violet-600 dark:text-violet-400 font-bold">{act.xp} XP</span>
                          <span>·</span>
                          <span>{act.time}s</span>
                          {isDone && (
                            <>
                              <span>·</span>
                              <span className="text-emerald-600 font-bold flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                {userRes.correct}/{userRes.total} acertos
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          sound.playClick();
                          onStartActivity(act);
                        }}
                        className={`py-2 px-3.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                          isDone
                            ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                            : 'bg-violet-600 hover:bg-violet-700 text-white shadow-sm'
                        }`}
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>{isDone ? 'Refazer' : 'Iniciar'}</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Subject Leaderboard */}
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              <h2 className="font-display font-bold text-base text-slate-900 dark:text-white">
                Destaques da Matéria
              </h2>
            </div>

            {subjectLeaderboard.length === 0 ? (
              <p className="text-xs text-slate-400">Nenhum aluno pontuou nesta matéria ainda.</p>
            ) : (
              <div className="space-y-2">
                {subjectLeaderboard.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-400 w-4 text-center">
                        {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}
                      </span>
                      <span>{item.av}</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{item.name}</span>
                    </div>
                    <span className="font-mono font-bold text-violet-600 dark:text-violet-400">{item.xp} XP</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Grid of all subjects
  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display font-extrabold text-xl text-slate-900 dark:text-white">
          Matérias & Áreas do Conhecimento
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Explore os módulos pedagógicos da sua turma, acompanhe seu aproveitamento e dispute o topo do ranking em cada disciplina!
        </p>
      </div>

      {subjects.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-400">
          <BookOpen className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700 mb-2" />
          <p className="font-semibold">Nenhuma matéria configurada ainda pelo professor para esta turma.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {subjects.map((sub) => {
            const st = subjectStats[sub.id] || { totalActs: 0, doneActs: 0, totalXP: 0, correct: 0, totalQ: 0 };
            const percent = st.totalActs > 0 ? Math.round((st.doneActs / st.totalActs) * 100) : 0;
            const pending = st.totalActs - st.doneActs;

            return (
              <button
                key={sub.id}
                onClick={() => {
                  sound.playClick();
                  setSelectedSubjectId(sub.id);
                }}
                className="p-5 rounded-3xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 hover:border-violet-500 text-left transition-all shadow-sm hover:shadow-md flex flex-col justify-between gap-4 group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-sm text-white"
                      style={{ backgroundColor: sub.color }}
                    >
                      {sub.icon || '📖'}
                    </div>
                    <span className="text-xs font-mono font-bold text-violet-600 dark:text-violet-400">
                      {st.totalXP} XP
                    </span>
                  </div>

                  <div>
                    <h3 className="font-display font-bold text-base text-slate-900 dark:text-white group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                      {sub.name}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {st.doneActs} de {st.totalActs} atividades finalizadas
                    </p>
                  </div>

                  <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${percent}%`,
                        backgroundColor: sub.color,
                      }}
                    />
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between text-xs font-semibold">
                  <span className={pending > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}>
                    {pending > 0 ? `${pending} pendente${pending > 1 ? 's' : ''}` : 'Tudo concluído! 🎉'}
                  </span>
                  <span className="text-violet-600 dark:text-violet-400 group-hover:translate-x-1 transition-transform">
                    Acessar →
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
});
