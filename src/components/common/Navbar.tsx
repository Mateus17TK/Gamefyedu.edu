import React, { useMemo } from 'react';
import { User, ClassRoom } from '../../types';
import { getLevel, getTitle, getLevelProgress } from '../../utils/gamification';
import { Volume2, VolumeX, Sun, Moon, LogOut, Flame, Sparkles, BookOpen, Trophy, Compass, BarChart3, Users, PlusCircle, Database, Shield } from 'lucide-react';
import { sound } from '../../services/audio';

export interface NavbarProps {
  user: User;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
  classes: ClassRoom[];
  selectedClassId: string;
  onSelectClass: (id: string) => void;
  totalXP: number;
  streakDays: number;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  isSoundMuted: boolean;
  onToggleSound: () => void;
  onOpenChest?: () => void;
  canClaimChest?: boolean;
}

export const Navbar: React.FC<NavbarProps> = React.memo(({
  user,
  activeTab,
  onTabChange,
  onLogout,
  classes,
  selectedClassId,
  onSelectClass,
  totalXP,
  streakDays,
  theme,
  onToggleTheme,
  isSoundMuted,
  onToggleSound,
  onOpenChest,
  canClaimChest,
}) => {
  const isTeacher = user.role === 'teacher';

  const level = useMemo(() => getLevel(totalXP), [totalXP]);
  const title = useMemo(() => getTitle(totalXP), [totalXP]);
  const progress = useMemo(() => getLevelProgress(totalXP), [totalXP]);

  const studentTabs = useMemo(() => [
    { id: 'home', label: 'Início', icon: Compass },
    { id: 'play', label: 'Atividades', icon: Sparkles },
    { id: 'mat', label: 'Matérias', icon: BookOpen },
    { id: 'rank', label: 'Ranking', icon: Trophy },
    { id: 'prog', label: 'Progresso', icon: BarChart3 },
    { id: 'turmas', label: 'Turmas', icon: Users },
  ], []);

  const teacherTabs = useMemo(() => [
    { id: 'dash', label: 'Painel', icon: BarChart3 },
    { id: 'turmas', label: 'Turmas', icon: Users },
    { id: 'mat', label: 'Matérias', icon: BookOpen },
    { id: 'new', label: 'Criar Atividade', icon: PlusCircle },
    { id: 'alunos', label: 'Alunos', icon: Trophy },
    { id: 'data', label: 'Backup & Dados', icon: Database },
  ], []);

  const currentTabs = isTeacher ? teacherTabs : studentTabs;

  return (
    <>
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#070412]/95 backdrop-blur-md border-b border-slate-200 dark:border-violet-950/60 transition-colors pt-[env(safe-area-inset-top,0px)] shadow-xs">
        <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8">
          <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 sm:gap-4 h-16">
            
            {/* Zone 1: Brand & Current Class */}
            <div className="flex items-center gap-1.5 sm:gap-3 shrink-0 min-w-0">
              <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                <span className="text-lg sm:text-2xl select-none" role="img" aria-label="Logo">🎮</span>
                <span className="font-display font-extrabold text-sm sm:text-xl tracking-tight bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent truncate max-w-[85px] sm:max-w-none">
                  GAMIFY EDU
                </span>
              </div>

              {classes.length > 0 && (
                <div className="flex items-center pl-1 sm:pl-3 border-l border-slate-200 dark:border-slate-800 shrink min-w-0">
                  <select
                    value={selectedClassId}
                    onChange={(e) => {
                      sound.playClick();
                      onSelectClass(e.target.value);
                    }}
                    className="text-[10px] sm:text-xs font-semibold py-1 px-1.5 sm:px-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#120d24] text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-violet-500 max-w-[75px] sm:max-w-[200px] truncate"
                    aria-label="Selecionar Turma"
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Zone 2: Navigation Links (Desktop) */}
            <nav className="hidden md:flex items-center justify-start gap-1 min-w-0 overflow-x-auto py-1 scrollbar-thin">
              {currentTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      sound.playClick();
                      onTabChange(tab.id);
                    }}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${
                      isActive
                        ? 'bg-violet-600 text-white shadow-sm shadow-violet-500/20'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Zone 3: Status & Controls */}
            <div className="flex items-center justify-end gap-1 sm:gap-2 shrink-0">
              
              {/* Student Gamification HUD badge in navbar */}
              {!isTeacher && (
                <div className="flex items-center gap-1">
                  {/* Streak Flame */}
                  <div
                    title={`Ofensiva de ${streakDays} dia(s) consecutivos!`}
                    className="flex items-center gap-0.5 sm:gap-1 px-1.5 py-1 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-lg text-amber-700 dark:text-amber-400 font-bold text-[11px] sm:text-xs tabular-nums"
                  >
                    <Flame className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-amber-500 text-amber-500" />
                    <span>{streakDays}d</span>
                  </div>

                  {/* Level & XP Capsule */}
                  <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 bg-violet-50 dark:bg-violet-950/40 border border-violet-200 dark:border-violet-800/60 rounded-lg text-xs">
                    <span className="font-bold text-violet-700 dark:text-violet-300">
                      Nv.{level}
                    </span>
                    <div className="w-16 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 transition-all duration-500"
                        style={{ width: `${progress.percent}%` }}
                      />
                    </div>
                    <span className="text-violet-600 dark:text-violet-400 font-mono font-medium">
                      {totalXP} XP
                    </span>
                  </div>

                  {/* Daily Reward Chest Button */}
                  {onOpenChest && (
                    <button
                      onClick={() => {
                        sound.playClick();
                        onOpenChest();
                      }}
                      className={`relative p-1.5 sm:p-2 rounded-lg transition-transform ${
                        canClaimChest
                          ? 'bg-amber-500 text-white shadow-md shadow-amber-500/30 animate-bounce'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:scale-105'
                      }`}
                      title={canClaimChest ? 'Baú pronto para abrir!' : 'Baú de recompensas diárias'}
                      aria-label="Baú de Recompensas"
                    >
                      <span className="text-sm sm:text-base" role="img" aria-label="Chest">🎁</span>
                      {canClaimChest && (
                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-white dark:ring-slate-900" />
                      )}
                    </button>
                  )}
                </div>
              )}

              {/* User Avatar & Role */}
              <div className="hidden sm:flex items-center gap-1.5 pl-1">
                <span className="text-lg sm:text-xl select-none" role="img" aria-label="Avatar">
                  {user.avatar}
                </span>
                <span className="hidden xl:inline text-xs font-semibold text-slate-700 dark:text-slate-300 max-w-[100px] truncate">
                  {user.name}
                </span>
              </div>

              {/* Sound toggle */}
              <button
                onClick={() => {
                  onToggleSound();
                  sound.playClick();
                }}
                className="p-1.5 sm:p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title={isSoundMuted ? 'Ativar som' : 'Silenciar som'}
                aria-label="Alternar som"
              >
                {isSoundMuted ? <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
              </button>

              {/* Theme toggle (Light & Black mode) */}
              <button
                onClick={() => {
                  sound.playClick();
                  onToggleTheme();
                }}
                className="p-1.5 sm:p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title={theme === 'dark' ? 'Mudar para tema claro' : 'Mudar para tema preto/escuro'}
                aria-label="Alternar tema"
              >
                {theme === 'dark' ? <Sun className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" /> : <Moon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-700" />}
              </button>

              {/* Logout button */}
              <button
                onClick={() => {
                  sound.playClick();
                  onLogout();
                }}
                className="p-1.5 sm:p-2 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                title="Sair da conta"
                aria-label="Sair"
              >
                <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>

            </div>
          </div>
        </div>
      </header>

      {/* Mobile Sticky Bottom Bar */}
      <nav className="md:hidden fixed bottom-[calc(0.5rem+env(safe-area-inset-bottom,0px))] left-2.5 right-2.5 z-40 bg-white/95 dark:bg-[#0c081c]/95 backdrop-blur-xl border border-slate-200/90 dark:border-violet-900/50 shadow-2xl rounded-2xl px-1.5 py-1.5 flex items-center justify-around gap-1 transition-colors">
        {currentTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                sound.playClick();
                onTabChange(tab.id);
              }}
              className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-xl transition-all ${
                isActive
                  ? 'text-violet-600 dark:text-violet-300 font-extrabold scale-105 bg-violet-50 dark:bg-violet-950/50'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Icon className="w-4 h-4 sm:w-5 sm:h-5 mb-0.5" />
              <span className="text-[10px] leading-tight truncate max-w-[54px]">{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
});

