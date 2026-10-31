import React, { useState } from 'react';
import { Activity, ClassRoom, Subject } from '../../types';
import { sound } from '../../services/audio';
import { BookOpen, Plus, Trash2 } from 'lucide-react';

export interface TeacherSubjectsProps {
  currentClass: ClassRoom | null;
  activities: Activity[];
  onAddSubject: (name: string, color: string, icon: string) => Promise<void>;
  onDeleteSubject: (subjectId: string) => Promise<void>;
}

const PALETTE = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#3b82f6', '#8b5cf6', '#14b8a6', '#f43f5e'];
const SUGGESTIONS = [
  { name: 'Matemática', icon: '📐', color: '#6366f1' },
  { name: 'Ciências da Natureza', icon: '🔬', color: '#10b981' },
  { name: 'Língua Portuguesa', icon: '📖', color: '#f59e0b' },
  { name: 'História', icon: '🏛️', color: '#ec4899' },
  { name: 'Geografia', icon: '🌍', color: '#3b82f6' },
  { name: 'Língua Inglesa', icon: '💬', color: '#8b5cf6' },
  { name: 'Artes & Criatividade', icon: '🎨', color: '#14b8a6' },
  { name: 'Filosofia & Sociologia', icon: '🧠', color: '#f43f5e' },
];

export const TeacherSubjects: React.FC<TeacherSubjectsProps> = React.memo(({
  currentClass,
  activities,
  onAddSubject,
  onDeleteSubject,
}) => {
  const [subjectName, setSubjectName] = useState('');
  const [selectedColor, setSelectedColor] = useState(PALETTE[0]);
  const [selectedIcon, setSelectedIcon] = useState('📖');
  const [loading, setLoading] = useState(false);

  const subjects = currentClass?.subjects || [];

  const handleAdd = async (name: string, color: string, icon: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;

    setLoading(true);
    try {
      await onAddSubject(trimmed, color, icon);
      sound.playLevelUp();
      setSubjectName('');
    } finally {
      setLoading(false);
    }
  };

  if (!currentClass) {
    return (
      <div className="p-12 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-400">
        Selecione uma turma para gerenciar suas matérias.
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      
      {/* Add New Subject */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-violet-100 dark:bg-violet-950/60 flex items-center justify-center text-violet-600 dark:text-violet-400">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-display font-bold text-lg text-slate-900 dark:text-white">
              Cadastrar Matéria ou Disciplina
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Cada matéria adicionada criará uma trilha gamificada com ranking para seus alunos.
            </p>
          </div>
        </div>

        {/* Quick Suggestion Chips */}
        <div>
          <span className="text-xs font-semibold text-slate-400 block mb-2">
            Sugestões rápidas de disciplinas:
          </span>
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((sug) => (
              <button
                key={sug.name}
                type="button"
                onClick={() => handleAdd(sug.name, sug.color, sug.icon)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-violet-50 dark:hover:bg-violet-950/40 hover:border-violet-400 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-all"
              >
                <span>{sug.icon}</span>
                <span>{sug.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Custom Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAdd(subjectName, selectedColor, selectedIcon);
          }}
          className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800"
        >
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={subjectName}
              onChange={(e) => setSubjectName(e.target.value)}
              placeholder="Ou digite o nome de uma disciplina personalizada..."
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
            
            <div className="flex items-center gap-2">
              {PALETTE.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setSelectedColor(c)}
                  className={`w-7 h-7 rounded-full transition-transform ${
                    selectedColor === c ? 'scale-125 ring-2 ring-offset-2 ring-violet-500' : 'hover:scale-110'
                  }`}
                  style={{ backgroundColor: c }}
                  aria-label={`Cor ${c}`}
                />
              ))}
            </div>

            <button
              type="submit"
              disabled={loading || !subjectName.trim()}
              className="py-2.5 px-5 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-md shadow-violet-600/20 transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Adicionar</span>
            </button>
          </div>
        </form>
      </div>

      {/* Active Subjects Table */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <h3 className="font-display font-bold text-base text-slate-900 dark:text-white">
          Matérias Configuradas em {currentClass.name}
        </h3>

        {subjects.length === 0 ? (
          <p className="text-xs text-slate-400 py-4 text-center">
            Nenhuma matéria criada para esta turma. Utilize as sugestões acima para começar!
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {subjects.map((sub) => {
              const actCount = activities.filter(a => a.sub === sub.id).length;
              return (
                <div
                  key={sub.id}
                  className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-lg text-white"
                      style={{ backgroundColor: sub.color }}
                    >
                      {sub.icon || '📖'}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                        {sub.name}
                      </h4>
                      <span className="text-xs text-slate-400">
                        {actCount} atividade{actCount === 1 ? '' : 's'}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      if (actCount > 0) {
                        alert('Exclua ou mova as atividades desta matéria antes de removê-la.');
                        return;
                      }
                      if (confirm(`Excluir a matéria "${sub.name}"?`)) {
                        sound.playClick();
                        onDeleteSubject(sub.id);
                      }
                    }}
                    className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors"
                    title="Excluir Matéria"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
});
