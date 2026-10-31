import React, { useState } from 'react';
import { ClassRoom, Member } from '../../types';
import { sound } from '../../services/audio';
import { Users, Plus, Copy, Trash2, Check, BookOpen } from 'lucide-react';

export interface TeacherClassesProps {
  classes: ClassRoom[];
  members: Member[];
  currentClassId: string;
  onSelectClass: (id: string) => void;
  onCreateClass: (name: string) => Promise<void>;
  onDeleteClass: (id: string) => Promise<void>;
}

export const TeacherClasses: React.FC<TeacherClassesProps> = React.memo(({
  classes,
  members,
  currentClassId,
  onSelectClass,
  onCreateClass,
  onDeleteClass,
}) => {
  const [newClassName, setNewClassName] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newClassName.trim();
    if (!name) return;

    setLoading(true);
    try {
      await onCreateClass(name);
      sound.playLevelUp();
      setNewClassName('');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = (code: string) => {
    sound.playClick();
    navigator.clipboard?.writeText(code);
    setCopiedId(code);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      
      {/* Create New Class */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-violet-100 dark:bg-violet-950/60 flex items-center justify-center text-violet-600 dark:text-violet-400">
            <Plus className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-display font-bold text-lg text-slate-900 dark:text-white">
              Criar Nova Turma
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Um código de acesso único será gerado para seus alunos entrarem na turma.
            </p>
          </div>
        </div>

        <form onSubmit={handleCreate} className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={newClassName}
            onChange={(e) => setNewClassName(e.target.value)}
            placeholder="Nome da turma (ex.: 8º Ano B - Matutino)"
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
          <button
            type="submit"
            disabled={loading || !newClassName.trim()}
            className="py-2.5 px-5 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-md shadow-violet-600/20 transition-all flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>{loading ? 'Criando...' : 'Criar Turma'}</span>
          </button>
        </form>
      </div>

      {/* Class List */}
      <div className="space-y-3">
        <h3 className="font-display font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
          <Users className="w-4 h-4 text-violet-500" />
          <span>Suas Turmas Gerenciadas</span>
        </h3>

        {classes.length === 0 ? (
          <div className="p-8 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-400">
            Você ainda não criou nenhuma turma. Crie sua primeira turma acima!
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {classes.map((c) => {
              const studentCount = members.filter(m => m.classId === c.id).length;
              const isSelected = c.id === currentClassId;

              return (
                <div
                  key={c.id}
                  className={`p-5 rounded-3xl border-2 transition-all flex flex-col justify-between gap-4 ${
                    isSelected
                      ? 'border-violet-600 bg-violet-50/50 dark:bg-violet-950/30'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-display font-bold text-base text-slate-900 dark:text-white">
                        {c.name}
                      </h4>
                      {isSelected && (
                        <span className="px-2 py-0.5 rounded-md bg-violet-600 text-white font-bold text-[10px]">
                          TURMA ATIVA
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span>{studentCount} aluno{studentCount === 1 ? '' : 's'}</span>
                      <span>·</span>
                      <span>{c.subjects?.length || 0} matérias</span>
                    </div>

                    {/* Class Code Box */}
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-semibold uppercase">
                          Código de Entrada
                        </span>
                        <span className="font-mono font-extrabold text-sm text-violet-600 dark:text-violet-400 tracking-wider">
                          {c.id}
                        </span>
                      </div>

                      <button
                        onClick={() => handleCopyCode(c.id)}
                        className="flex items-center gap-1 py-1 px-2.5 rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold shadow-sm hover:bg-slate-50 transition-colors"
                        title="Copiar código"
                      >
                        {copiedId === c.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                            <span className="text-emerald-600">Copiado!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copiar</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                    <button
                      onClick={() => {
                        sound.playClick();
                        onSelectClass(c.id);
                      }}
                      disabled={isSelected}
                      className={`text-xs font-bold py-1.5 px-3 rounded-xl transition-all ${
                        isSelected
                          ? 'text-slate-400 cursor-default'
                          : 'bg-violet-600 text-white hover:bg-violet-700 shadow-sm'
                      }`}
                    >
                      {isSelected ? 'Selecionada' : 'Tornar Ativa'}
                    </button>

                    <button
                      onClick={() => {
                        if (confirm(`Deseja realmente excluir a turma "${c.name}"?`)) {
                          sound.playClick();
                          onDeleteClass(c.id);
                        }
                      }}
                      className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors"
                      title="Excluir turma"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
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
