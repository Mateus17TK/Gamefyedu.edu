import React, { useState } from 'react';
import { User, UserRole } from '../../types';
import { sound } from '../../services/audio';
import { Sparkles, ArrowRight, UserCheck, GraduationCap, Lock, Mail, User as UserIcon } from 'lucide-react';

export interface AuthScreenProps {
  onLogin: (email: string, pass: string) => Promise<User>;
  onRegister: (data: { name: string; email: string; pass: string; role: UserRole; avatar: string }) => Promise<User>;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

const AVATARS = ['🦊', '🐼', '🐸', '🦄', '🐙', '🚀', '🤖', '🐯', '🦉', '🦁', '🐬', '🦅'];

export const AuthScreen: React.FC<AuthScreenProps> = ({
  onLogin,
  onRegister,
  theme,
  onToggleTheme,
}) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [role, setRole] = useState<UserRole>('student');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [avatar, setAvatar] = useState('🦊');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      if (mode === 'login') {
        await onLogin(email, password);
      } else {
        if (!name.trim()) {
          throw new Error('Informe seu nome.');
        }
        await onRegister({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          pass: password,
          role,
          avatar: role === 'teacher' ? '👩‍🏫' : avatar,
        });
      }
      sound.playLevelUp();
    } catch (err: unknown) {
      sound.playWrong();
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(msg || 'Erro na autenticação.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (demoRole: 'student' | 'teacher') => {
    sound.playClick();
    setLoading(true);
    setErrorMsg('');
    try {
      const demoEmail = demoRole === 'student' ? 'aluno@escola.com' : 'prof@escola.com';
      await onLogin(demoEmail, '1234');
      sound.playLevelUp();
    } catch {
      setErrorMsg('Falha ao autenticar com a conta demo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] flex items-center justify-center p-3 sm:p-4 bg-gradient-to-br from-violet-50/80 via-slate-50 to-amber-50/80 dark:from-[#05030a] dark:via-[#0c081c] dark:to-[#05030a] text-slate-900 dark:text-slate-100 transition-colors relative overflow-hidden">
      
      {/* Playful background glowing orbs */}
      <div className="absolute top-10 left-10 w-72 h-72 bg-violet-400/20 dark:bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-amber-400/20 dark:bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md bg-white dark:bg-[#0f0a1c] border-2 border-slate-200 dark:border-violet-900/40 rounded-3xl p-5 sm:p-8 shadow-2xl transition-colors">
        
        {/* Top Controls: Theme Switcher */}
        <div className="absolute top-4 right-4 flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              onToggleTheme();
            }}
            className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-slate-200/60 dark:border-slate-800"
            title={theme === 'dark' ? 'Mudar para tema claro' : 'Mudar para tema preto/escuro'}
            aria-label="Alternar tema"
          >
            <span className="text-sm">{theme === 'dark' ? '☀️' : '🌙'}</span>
          </button>
        </div>

        {/* Brand Lockup */}
        <div className="text-center space-y-1 mb-5 sm:mb-6 pt-1">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-3xl shadow-lg shadow-violet-600/30 mb-2">
            🎮
          </div>
          <h1 className="font-display font-extrabold text-2xl text-slate-900 dark:text-white tracking-tight">
            GAMIFY EDU
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Ambiente gamificado de aprendizagem para Fundamental e Médio
          </p>
        </div>

        {/* Tab Toggle: Login vs Register */}
        <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl mb-5">
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              setMode('login');
              setErrorMsg('');
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              mode === 'login'
                ? 'bg-white dark:bg-slate-700 text-violet-700 dark:text-violet-300 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
            }`}
          >
            Entrar
          </button>
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              setMode('register');
              setErrorMsg('');
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              mode === 'register'
                ? 'bg-white dark:bg-slate-700 text-violet-700 dark:text-violet-300 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
            }`}
          >
            Cadastrar Conta
          </button>
        </div>

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {mode === 'register' && (
            <>
              {/* Role Selector */}
              <div>
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">
                  Eu sou:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      sound.playClick();
                      setRole('student');
                    }}
                    className={`py-2 px-3 rounded-xl border-2 text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      role === 'student'
                        ? 'border-violet-600 bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <span>👩‍🎓</span>
                    <span>Estudante</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      sound.playClick();
                      setRole('teacher');
                    }}
                    className={`py-2 px-3 rounded-xl border-2 text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      role === 'teacher'
                        ? 'border-violet-600 bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <span>👩‍🏫</span>
                    <span>Professor(a)</span>
                  </button>
                </div>
              </div>

              {/* Avatar Selector for Students */}
              {role === 'student' && (
                <div>
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">
                    Escolha seu Mascote:
                  </label>
                  <div className="flex gap-2 overflow-x-auto py-1 scrollbar-thin">
                    {AVATARS.map((av) => (
                      <button
                        key={av}
                        type="button"
                        onClick={() => {
                          sound.playClick();
                          setAvatar(av);
                        }}
                        className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center shrink-0 border-2 transition-transform ${
                          avatar === av
                            ? 'border-violet-600 bg-violet-100 dark:bg-violet-950/50 scale-110 shadow-sm'
                            : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 hover:scale-105'
                        }`}
                      >
                        {av}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Name */}
              <div>
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">
                  Nome Completo
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Seu nome ou apelido escolar"
                    className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
              </div>
            </>
          )}

          {/* Email */}
          <div>
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">
              E-mail
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu.email@escola.com"
                className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">
              Senha (mínimo 4 caracteres)
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                minLength={4}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
          </div>

          {errorMsg && (
            <p className="text-xs text-rose-500 font-semibold text-center">
              {errorMsg}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 disabled:opacity-50 text-white font-bold text-sm rounded-2xl shadow-lg shadow-violet-600/30 transition-all flex items-center justify-center gap-2"
          >
            <span>{loading ? 'Processando...' : mode === 'login' ? 'Entrar na Plataforma' : 'Criar Minha Conta'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Demo Fast Logins Strip */}
        <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 space-y-2">
          <span className="text-[11px] font-semibold text-slate-400 text-center block uppercase tracking-wider">
            Acesso Rápido para Avaliação (1 Clique)
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleDemoLogin('student')}
              className="py-2 px-3 rounded-xl border border-violet-200 dark:border-violet-800/80 bg-violet-50/70 dark:bg-violet-950/30 text-violet-700 dark:text-violet-300 font-bold text-xs hover:bg-violet-100 transition-all flex items-center justify-center gap-1.5"
            >
              <span>🦊</span>
              <span>Aluno Demo</span>
            </button>
            <button
              type="button"
              onClick={() => handleDemoLogin('teacher')}
              className="py-2 px-3 rounded-xl border border-indigo-200 dark:border-indigo-800/80 bg-indigo-50/70 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300 font-bold text-xs hover:bg-indigo-100 transition-all flex items-center justify-center gap-1.5"
            >
              <span>👩‍🏫</span>
              <span>Professor Demo</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
