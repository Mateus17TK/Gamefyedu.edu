import React, { useState } from 'react';
import { db } from '../../services/db';
import { sound } from '../../services/audio';
import { Database, Download, Upload, AlertCircle, CheckCircle2 } from 'lucide-react';

export const TeacherDataBackup: React.FC = React.memo(() => {
  const [statusMsg, setStatusMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const handleDownloadBackup = async () => {
    sound.playClick();
    try {
      const dump = await db.exportDump();
      const jsonStr = JSON.stringify(dump, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `gamify_edu_backup_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setStatusMsg({ text: 'Backup baixado com sucesso!', type: 'success' });
    } catch {
      setStatusMsg({ text: 'Falha ao gerar backup.', type: 'error' });
    }
  };

  const handleRestoreFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    sound.playClick();
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      await db.importDump(parsed);
      setStatusMsg({ text: 'Backup restaurado com sucesso! Recarregando sistema...', type: 'success' });
      setTimeout(() => {
        window.location.reload();
      }, 1200);
    } catch {
      setStatusMsg({ text: 'Arquivo de backup inválido ou corrompido.', type: 'error' });
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-violet-100 dark:bg-violet-950/60 flex items-center justify-center text-violet-600 dark:text-violet-400">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-display font-bold text-lg text-slate-900 dark:text-white">
              Armazenamento Local & Backup de Segurança
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Todos os dados e resultados pedagógicos são guardados no navegador (IndexedDB). Exporte cópias para transferir para outros computadores.
            </p>
          </div>
        </div>

        {statusMsg && (
          <div className={`p-3 rounded-2xl flex items-center gap-2 text-xs font-semibold ${
            statusMsg.type === 'success'
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
              : 'bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
          }`}>
            {statusMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            )}
            <span>{statusMsg.text}</span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={handleDownloadBackup}
            className="flex-1 py-3 px-5 bg-violet-600 hover:bg-violet-700 text-white font-bold text-sm rounded-2xl shadow-md shadow-violet-600/20 transition-all flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>Baixar Backup Completo (.json)</span>
          </button>

          <label className="flex-1 py-3 px-5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-sm rounded-2xl transition-all cursor-pointer flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-700">
            <Upload className="w-4 h-4" />
            <span>Restaurar de Arquivo</span>
            <input
              type="file"
              accept=".json"
              onChange={handleRestoreFile}
              className="hidden"
            />
          </label>
        </div>
      </div>
    </div>
  );
});
