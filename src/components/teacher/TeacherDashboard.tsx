import React, { useMemo } from 'react';
import { Activity, ClassRoom, Member, Result, User } from '../../types';
import { sound } from '../../services/audio';
import { buildLeaderboard } from '../../utils/gamification';
import { BarChart3, Users, CheckCircle, AlertTriangle, BookOpen, Trash2, TrendingUp, Award } from 'lucide-react';

export interface TeacherDashboardProps {
  currentClass: ClassRoom | null;
  activities: Activity[];
  results: Result[];
  members: Member[];
  onDeleteActivity: (id: string) => void;
  onNavigateTab: (tab: string) => void;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = React.memo(({
  currentClass,
  activities,
  results,
  members,
  onDeleteActivity,
  onNavigateTab,
}) => {
  const classMembers = useMemo(() => {
    if (!currentClass) return [];
    return members.filter(m => m.classId === currentClass.id);
  }, [members, currentClass]);

  const classActivities = useMemo(() => {
    if (!currentClass) return [];
    return activities.filter(a => a.classId === currentClass.id);
  }, [activities, currentClass]);

  const classResults = useMemo(() => {
    if (!currentClass) return [];
    return results.filter(r => r.classId === currentClass.id);
  }, [results, currentClass]);

  // Overall accuracy
  const overallAccuracy = useMemo(() => {
    const totalCorrect = classResults.reduce((sum, r) => sum + (r.correct || 0), 0);
    const totalQuestions = classResults.reduce((sum, r) => sum + (r.total || 0), 0);
    return totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
  }, [classResults]);

  // Diagnostic: Toughest Questions (Lowest accuracy)
  const difficultQuestions = useMemo(() => {
    const qStats: { questionText: string; correct: number; total: number; pct: number }[] = [];

    classActivities.forEach(act => {
      act.questions.forEach((q, qIndex) => {
        const actRes = classResults.filter(r => r.actId === act.id && r.per);
        if (actRes.length > 0) {
          const correctAttempts = actRes.filter(r => r.per && r.per[qIndex] === true).length;
          const pct = Math.round((correctAttempts / actRes.length) * 100);
          qStats.push({
            questionText: q.q,
            correct: correctAttempts,
            total: actRes.length,
            pct,
          });
        }
      });
    });

    // Sort ascending by accuracy (toughest first)
    return qStats.sort((a, b) => a.pct - b.pct).slice(0, 5);
  }, [classActivities, classResults]);

  // Diagnostic: Students needing support (<60% accuracy)
  const studentsNeedingSupport = useMemo(() => {
    const leaderboard = buildLeaderboard(classResults);
    return leaderboard.filter(s => s.accuracy < 60 && s.acts >= 1);
  }, [classResults]);

  if (!currentClass) {
    return (
      <div className="p-12 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white mb-2">
          Nenhuma Turma Selecionada
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          Crie ou selecione uma turma na aba Turmas para visualizar as métricas pedagógicas.
        </p>
        <button
          onClick={() => onNavigateTab('turmas')}
          className="py-2.5 px-5 bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
        >
          Ir para Turmas
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="font-display font-extrabold text-2xl text-slate-900 dark:text-white">
            Painel Pedagógico: {currentClass.name}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Código de Acesso da Turma: <span className="font-mono font-bold text-violet-600 dark:text-violet-400">{currentClass.id}</span>
          </p>
        </div>
        <button
          onClick={() => {
            sound.playClick();
            onNavigateTab('new');
          }}
          className="py-2.5 px-4 bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs rounded-xl shadow-md shadow-violet-600/20 transition-all"
        >
          + Nova Atividade
        </button>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Estudantes</span>
          <div className="font-display font-extrabold text-2xl sm:text-3xl text-violet-600 dark:text-violet-400 mt-1 tabular-nums">
            {classMembers.length}
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 block">matriculados</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Acerto Médio</span>
          <div className="font-display font-extrabold text-2xl sm:text-3xl text-emerald-600 dark:text-emerald-400 mt-1 tabular-nums">
            {overallAccuracy}%
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 block">desempenho da turma</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Entregas</span>
          <div className="font-display font-extrabold text-2xl sm:text-3xl text-amber-500 mt-1 tabular-nums">
            {classResults.length}
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 block">tentativas computadas</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Atividades</span>
          <div className="font-display font-extrabold text-2xl sm:text-3xl text-indigo-600 dark:text-indigo-400 mt-1 tabular-nums">
            {classActivities.length}
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 block">publicadas</span>
        </div>
      </div>

      {/* Pedagogical Diagnostics (Questions with lowest scores & support alerts) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Toughest Questions */}
        <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <h3 className="font-display font-bold text-base text-slate-900 dark:text-white">
              Questões com Maior Índice de Erros
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Identifique tópicos críticos que demandam retomada ou revisão em sala de aula.
          </p>

          {difficultQuestions.length === 0 ? (
            <p className="text-xs text-slate-400 py-4 text-center">
              Ainda não há dados de respostas suficientes.
            </p>
          ) : (
            <div className="space-y-3">
              {difficultQuestions.map((q, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-800 dark:text-slate-200 truncate max-w-[70%]">
                      {q.questionText}
                    </span>
                    <span className={`font-mono ${q.pct < 50 ? 'text-rose-500 font-bold' : 'text-amber-500'}`}>
                      {q.pct}% acertos ({q.correct}/{q.total})
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${q.pct < 50 ? 'bg-rose-500' : 'bg-amber-500'}`}
                      style={{ width: `${q.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Students needing academic intervention */}
        <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-rose-500" />
            <h3 className="font-display font-bold text-base text-slate-900 dark:text-white">
              Alunos que Precisam de Apoio Pedagógico
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Estudantes com taxa de aproveitamento abaixo de 60%.
          </p>

          {studentsNeedingSupport.length === 0 ? (
            <div className="p-6 text-center text-xs text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/20 rounded-2xl border border-emerald-200 dark:border-emerald-900/40">
              ✨ Nenhum aluno abaixo de 60%! A turma está com ótimo rendimento.
            </div>
          ) : (
            <div className="space-y-2">
              {studentsNeedingSupport.map((st) => (
                <div
                  key={st.uid}
                  className="flex items-center justify-between p-3 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span>{st.av}</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{st.name}</span>
                  </div>
                  <div className="flex items-center gap-2 font-mono">
                    <span className="text-rose-600 dark:text-rose-400 font-bold">{st.accuracy}% acerto</span>
                    <span className="text-slate-400">({st.acts} ativ.)</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Published Activities Table */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <h3 className="font-display font-bold text-base text-slate-900 dark:text-white">
          Atividades Ativas da Turma
        </h3>

        {classActivities.length === 0 ? (
          <p className="text-xs text-slate-400 py-4 text-center">
            Nenhuma atividade cadastrada. Crie uma na aba "Criar Atividade"!
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                  <th className="pb-3 pl-2">Título</th>
                  <th className="pb-3">Tipo</th>
                  <th className="pb-3">Recompensa</th>
                  <th className="pb-3">Entregas</th>
                  <th className="pb-3 pr-2 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {classActivities.map(act => {
                  const actRes = classResults.filter(r => r.actId === act.id);
                  return (
                    <tr key={act.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-3 pl-2 font-semibold text-slate-900 dark:text-white">
                        {act.title}
                      </td>
                      <td className="py-3 capitalize text-slate-600 dark:text-slate-400">
                        {act.kind === 'boss' ? 'Batalha Chefe' : act.kind === 'pairs' ? 'Ligar Pares' : act.kind === 'vf' ? 'Relâmpago V/F' : 'Quiz'}
                      </td>
                      <td className="py-3 font-mono text-violet-600 dark:text-violet-400 font-bold">
                        {act.xp} XP
                      </td>
                      <td className="py-3 text-slate-600 dark:text-slate-400">
                        {actRes.length} de {classMembers.length}
                      </td>
                      <td className="py-3 pr-2 text-right">
                        <button
                          onClick={() => {
                            if (confirm(`Excluir a atividade "${act.title}"?`)) {
                              sound.playClick();
                              onDeleteActivity(act.id);
                            }
                          }}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors"
                          title="Excluir Atividade"
                          aria-label="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
});
