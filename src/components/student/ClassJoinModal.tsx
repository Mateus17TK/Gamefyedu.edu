import React, { useState } from 'react';
import { sound } from '../../services/audio';
import { fireConfetti } from '../../services/confetti';
import { ClassRoom } from '../../types';
import { Users, KeyRound, ArrowRight } from 'lucide-react';

export interface ClassJoinModalProps {
  classes: ClassRoom[];
  onJoinClass: (classCode: string) => Promise<boolean>;
  onSelectClass: (classId: string) => void;
  selectedClassId: string;
}

export const ClassJoinModal: React.FC<ClassJoinModalProps> = React.memo(({
  classes,
  onJoinClass,
  onSelectClass,
  selectedClassId,
}) => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) return;

    setLoading(true);
    setErrorMsg('');
    try {
      const ok = await onJoinClass(cleanCode);
      if (ok) {
        sound.playLevelUp();
        fireConfetti('medium');
        setCode('');
      } else {
        sound.playWrong();
        setErrorMsg('Código da turma não encontrado. Verifique com seu professor.');
      }
    } catch {
      sound.playWrong();
      setErrorMsg('Erro ao entrar na turma.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      
      {/* Join New Class Card */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-violet-100 dark:bg-violet-950/60 flex items-center justify-center text-violet-600 dark:text-violet-400">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-display font-bold text-lg text-slate-900 dark:text-white">
              Entrar em uma Nova Turma
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Digite o código de 5 ou 6 caracteres fornecido pelo seu professor (ex.: 7A2026).
            </p>
          </div>
        </div>

        <form onSubmit={handleJoin} className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="CÓDIGO DA TURMA"
              maxLength={10}
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold tracking-wider uppercase focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
            <button
              type="submit"
              disabled={loading || !code.trim()}
              className="py-2.5 px-5 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-md shadow-violet-600/20 transition-all flex items-center justify-center gap-2"
            >
              <span>{loading ? 'Entrando...' : 'Entrar na Turma'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {errorMsg && (
            <p className="text-xs text-rose-500 font-medium">
              {errorMsg}
            </p>
          )}
        </form>
      </div>

      {/* Enrolled Classes List */}
      <div className="space-y-3">
        <h3 className="font-display font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
          <Users className="w-4 h-4 text-violet-500" />
          <span>Suas Turmas Ativas</span>
        </h3>

        {classes.length === 0 ? (
          <div className="p-8 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-400">
            Você ainda não está matriculado em nenhuma turma. Utilize o código acima para ingressar!
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {classes.map((c) => {
              const isSelected = c.id === selectedClassId;
              return (
                <div
                  key={c.id}
                  onClick={() => {
                    sound.playClick();
                    onSelectClass(c.id);
                  }}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'border-violet-600 bg-violet-50/60 dark:bg-violet-950/40'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
                  }`}
                >
                  <div className="space-y-0.5">
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                      {c.name}
                    </h4>
                    <span className="text-xs text-slate-400 font-mono">
                      Código: {c.id}
                    </span>
                  </div>

                  {isSelected ? (
                    <span className="px-2.5 py-1 rounded-full bg-violet-600 text-white font-bold text-[11px]">
                      Ativa
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400 hover:text-violet-600">
                      Selecionar
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
});
