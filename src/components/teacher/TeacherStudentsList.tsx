import React, { useState, useMemo, useCallback } from 'react';
import { ClassRoom, Member, Result } from '../../types';
import { buildLeaderboard, getTitle, getLevel } from '../../utils/gamification';
import { VirtualList } from '../common/VirtualList';
import { sound } from '../../services/audio';
import { Users, Search, Download, CheckCircle2, TrendingUp } from 'lucide-react';

export interface TeacherStudentsListProps {
  currentClass: ClassRoom | null;
  members: Member[];
  results: Result[];
}

export const TeacherStudentsList: React.FC<TeacherStudentsListProps> = React.memo(({
  currentClass,
  members,
  results,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const classMembers = useMemo(() => {
    if (!currentClass) return [];
    return members.filter(m => m.classId === currentClass.id);
  }, [members, currentClass]);

  const classResults = useMemo(() => {
    if (!currentClass) return [];
    return results.filter(r => r.classId === currentClass.id);
  }, [results, currentClass]);

  const leaderboardMap = useMemo(() => {
    const list = buildLeaderboard(classResults);
    const map = new Map<string, typeof list[0]>();
    list.forEach(item => map.set(item.uid, item));
    return map;
  }, [classResults]);

  // Combined student performance records
  const studentRows = useMemo(() => {
    return classMembers.map(m => {
      const stats = leaderboardMap.get(m.uid) || {
        uid: m.uid,
        name: m.name,
        av: m.avatar || '👩‍🎓',
        xp: 0,
        correct: 0,
        total: 0,
        acts: 0,
        accuracy: 0,
      };
      return {
        ...m,
        ...stats,
        name: m.name,
        av: m.avatar || stats.av,
      };
    });
  }, [classMembers, leaderboardMap]);

  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return studentRows;
    const q = searchQuery.toLowerCase();
    return studentRows.filter(s => s.name.toLowerCase().includes(q));
  }, [studentRows, searchQuery]);

  const handleExportCSV = () => {
    sound.playClick();
    const headers = 'Nome,Avatar,XP Total,Atividades Concluidas,Acertos,Questoes Totais,Precisao %\n';
    const rows = studentRows.map(s => (
      `"${s.name}","${s.av}",${s.xp},${s.acts},${s.correct},${s.total},${s.accuracy}`
    )).join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio_turma_${currentClass?.id || 'classe'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const renderStudentRow = useCallback((student: typeof studentRows[0]) => {
    const level = getLevel(student.xp);
    return (
      <div
        className="flex items-center justify-between px-3.5 sm:px-4 py-2.5 mx-1 my-1 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 transition-all h-[64px] box-border"
      >
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <span className="text-xl sm:text-2xl shrink-0 select-none">
            {student.av}
          </span>
          <div className="min-w-0">
            <h4 className="font-semibold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
              {student.name}
            </h4>
            <div className="text-[11px] text-slate-400 flex items-center gap-1.5 whitespace-nowrap truncate">
              <span>Nv.{level}</span>
              <span className="hidden sm:inline">({getTitle(student.xp)})</span>
              <span>·</span>
              <span>{student.acts} entrega{student.acts === 1 ? '' : 's'}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 sm:gap-4 shrink-0 text-right pl-2">
          <div>
            <span className={`font-mono font-bold text-xs ${
              student.accuracy < 60 && student.acts > 0
                ? 'text-rose-500'
                : 'text-emerald-600 dark:text-emerald-400'
            }`}>
              {student.accuracy}%
            </span>
            <span className="text-[10px] text-slate-400 block">precisão</span>
          </div>

          <div className="w-14 sm:w-16">
            <span className="font-mono font-extrabold text-xs sm:text-sm text-violet-600 dark:text-violet-400">
              {student.xp}
            </span>
            <span className="text-[10px] text-slate-400 ml-0.5">XP</span>
          </div>
        </div>
      </div>
    );
  }, []);

  const getItemKey = useCallback((item: typeof studentRows[0]) => item.uid, []);

  if (!currentClass) {
    return (
      <div className="p-12 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-400">
        Selecione uma turma para ver a lista de estudantes.
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      
      {/* Header & CSV Download */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-display font-extrabold text-xl text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-violet-500" />
            <span>Alunos Matriculados: {currentClass.name}</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Total de {classMembers.length} estudantes inscritos através do código {currentClass.id}.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="flex items-center gap-1.5 py-2 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold hover:bg-slate-50 transition-colors shadow-sm"
        >
          <Download className="w-4 h-4" />
          <span>Exportar Planilha CSV</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filtrar aluno por nome..."
          className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
        />
      </div>

      {/* Virtualized Student List */}
      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 p-2 shadow-inner">
        <VirtualList
          items={filteredStudents}
          itemHeight={68}
          height={460}
          renderItem={renderStudentRow}
          getItemKey={getItemKey}
          overscan={4}
          emptyMessage="Nenhum estudante encontrado com o filtro pesquisado."
        />
      </div>

    </div>
  );
});
