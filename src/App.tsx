/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo, Suspense, lazy } from 'react';
import { Activity, ClassRoom, Member, Result, User, UserRole } from './types';
import { db } from './services/db';
import { sound } from './services/audio';
import { Navbar } from './components/common/Navbar';
import { AuthScreen } from './components/auth/AuthScreen';
import { RewardChestModal } from './components/student/RewardChestModal';
import { calculateStreak } from './utils/gamification';

// Lazy load route tab components for optimal bundle splitting and performance
const StudentHome = lazy(() => import('./components/student/StudentHome').then(m => ({ default: m.StudentHome })));
const ActivitiesList = lazy(() => import('./components/student/ActivitiesList').then(m => ({ default: m.ActivitiesList })));
const SubjectsHub = lazy(() => import('./components/student/SubjectsHub').then(m => ({ default: m.SubjectsHub })));
const LeaderboardView = lazy(() => import('./components/student/LeaderboardView').then(m => ({ default: m.LeaderboardView })));
const ProgressAndBadges = lazy(() => import('./components/student/ProgressAndBadges').then(m => ({ default: m.ProgressAndBadges })));
const ClassJoinModal = lazy(() => import('./components/student/ClassJoinModal').then(m => ({ default: m.ClassJoinModal })));

const TeacherDashboard = lazy(() => import('./components/teacher/TeacherDashboard').then(m => ({ default: m.TeacherDashboard })));
const TeacherClasses = lazy(() => import('./components/teacher/TeacherClasses').then(m => ({ default: m.TeacherClasses })));
const TeacherSubjects = lazy(() => import('./components/teacher/TeacherSubjects').then(m => ({ default: m.TeacherSubjects })));
const TeacherActivityCreator = lazy(() => import('./components/teacher/TeacherActivityCreator').then(m => ({ default: m.TeacherActivityCreator })));
const TeacherStudentsList = lazy(() => import('./components/teacher/TeacherStudentsList').then(m => ({ default: m.TeacherStudentsList })));
const TeacherDataBackup = lazy(() => import('./components/teacher/TeacherDataBackup').then(m => ({ default: m.TeacherDataBackup })));

const GameRunner = lazy(() => import('./components/game/GameRunner').then(m => ({ default: m.GameRunner })));

// Loading Skeleton Fallback for lazy routes
const RouteSkeleton = () => (
  <div className="space-y-4 animate-pulse">
    <div className="h-44 bg-slate-200 dark:bg-slate-800 rounded-3xl w-full" />
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-24 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
      ))}
    </div>
    <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-3xl w-full" />
  </div>
);

export default function App() {
  const [initialized, setInitialized] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [results, setResults] = useState<Result[]>([]);

  // UI state
  const [activeTab, setActiveTab] = useState<string>('home');
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [activeGame, setActiveGame] = useState<Activity | null>(null);
  const [chestModalOpen, setChestModalOpen] = useState(false);

  // Preference state
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      return (localStorage.getItem('ge_theme') as 'light' | 'dark') || 'light';
    } catch {
      return 'light';
    }
  });

  const [isSoundMuted, setIsSoundMuted] = useState(() => sound.isMuted());

  // Initialize DB and initial session
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        await db.init();
        const storedUsers = await db.getAll<User>('users');
        const storedClasses = await db.getAll<ClassRoom>('classes');
        const storedMembers = await db.getAll<Member>('members');
        const storedActivities = await db.getAll<Activity>('activities');
        const storedResults = await db.getAll<Result>('results');

        if (!isMounted) return;

        setClasses(storedClasses);
        setMembers(storedMembers);
        setActivities(storedActivities);
        setResults(storedResults);

        // Check active session
        const sessionUid = localStorage.getItem('ge_session_uid');
        if (sessionUid) {
          const found = storedUsers.find(u => u.id === sessionUid);
          if (found) {
            setUser(found);
            setActiveTab(found.role === 'teacher' ? 'dash' : 'home');
          }
        }

        setInitialized(true);
      } catch (e) {
        console.error('Failed to initialize applet database:', e);
        if (isMounted) setInitialized(true);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  // Update HTML dataset theme
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    try {
      localStorage.setItem('ge_theme', theme);
    } catch {
      // ignore
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme(t => (t === 'light' ? 'dark' : 'light'));
  }, []);

  const toggleSound = useCallback(() => {
    const muted = sound.toggleMute();
    setIsSoundMuted(muted);
  }, []);

  // Filter classes available for the current user
  const userClasses = useMemo(() => {
    if (!user) return [];
    if (user.role === 'teacher') {
      return classes.filter(c => c.owner === user.id);
    }
    return classes.filter(c => members.some(m => m.classId === c.id && m.uid === user.id));
  }, [classes, members, user]);

  // Current active class
  const currentClass = useMemo(() => {
    return userClasses.find(c => c.id === selectedClassId) || userClasses[0] || null;
  }, [userClasses, selectedClassId]);

  // Sync selectedClassId if invalid
  useEffect(() => {
    if (userClasses.length > 0) {
      if (!selectedClassId || !userClasses.some(c => c.id === selectedClassId)) {
        setSelectedClassId(userClasses[0].id);
      }
    }
  }, [userClasses, selectedClassId]);

  // Total XP and Streak calculated with memoization
  const myResults = useMemo(() => {
    if (!user) return [];
    return results.filter(r => r.uid === user.id);
  }, [results, user]);

  const totalXP = useMemo(() => {
    return myResults.reduce((acc, r) => acc + (r.xp || 0), 0);
  }, [myResults]);

  const streakDays = useMemo(() => {
    return calculateStreak(myResults);
  }, [myResults]);

  // Check if chest can be claimed today
  const canClaimChest = useMemo(() => {
    if (!user) return false;
    const today = new Date().toISOString().slice(0, 10);
    const lastClaim = user.lastDailyChestClaim ? new Date(user.lastDailyChestClaim).toISOString().slice(0, 10) : '';
    return today !== lastClaim;
  }, [user]);

  // Auth handlers
  const handleLogin = useCallback(async (email: string, pass: string): Promise<User> => {
    const allUsers = await db.getAll<User>('users');
    const cleanEmail = email.trim().toLowerCase();
    const found = allUsers.find(u => u.email === cleanEmail);

    if (!found) {
      throw new Error('E-mail não encontrado.');
    }

    const hashed = await db.hashPassword(pass, found.salt);
    if (found.pw !== hashed) {
      throw new Error('Senha incorreta.');
    }

    setUser(found);
    setActiveTab(found.role === 'teacher' ? 'dash' : 'home');
    try {
      localStorage.setItem('ge_session_uid', found.id);
    } catch {
      // ignore
    }
    return found;
  }, []);

  const handleRegister = useCallback(async (data: {
    name: string;
    email: string;
    pass: string;
    role: UserRole;
    avatar: string;
  }): Promise<User> => {
    const allUsers = await db.getAll<User>('users');
    if (allUsers.some(u => u.email === data.email)) {
      throw new Error('Este e-mail já está cadastrado.');
    }

    const salt = Math.random().toString(36).slice(2, 8);
    const pwHash = await db.hashPassword(data.pass, salt);

    const newUser: User = {
      id: `u_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
      name: data.name,
      email: data.email,
      role: data.role,
      avatar: data.avatar,
      salt,
      pw: pwHash,
      created: Date.now(),
      streakShields: 0,
    };

    await db.put('users', newUser);
    setUser(newUser);
    setActiveTab(newUser.role === 'teacher' ? 'dash' : 'home');
    try {
      localStorage.setItem('ge_session_uid', newUser.id);
    } catch {
      // ignore
    }
    return newUser;
  }, []);

  const handleLogout = useCallback(() => {
    try {
      localStorage.removeItem('ge_session_uid');
    } catch {
      // ignore
    }
    setUser(null);
    setActiveTab('home');
    setActiveGame(null);
  }, []);

  // Class & Student Actions
  const handleJoinClass = useCallback(async (classCode: string): Promise<boolean> => {
    if (!user) return false;
    const cleanCode = classCode.trim().toUpperCase();
    const allCls = await db.getAll<ClassRoom>('classes');
    const target = allCls.find(c => c.id.toUpperCase() === cleanCode);

    if (!target) return false;

    // Check if already a member
    const existing = members.find(m => m.classId === target.id && m.uid === user.id);
    if (!existing) {
      const newMember: Member = {
        id: `${target.id}_${user.id}`,
        classId: target.id,
        uid: user.id,
        name: user.name,
        avatar: user.avatar,
        joinedAt: Date.now(),
      };
      await db.put('members', newMember);
      setMembers(prev => [...prev, newMember]);
    }

    setSelectedClassId(target.id);
    return true;
  }, [user, members]);

  const handleCreateClass = useCallback(async (name: string) => {
    if (!user) return;
    const newId = Math.random().toString(36).slice(2, 7).toUpperCase();
    const newClass: ClassRoom = {
      id: newId,
      name,
      owner: user.id,
      created: Date.now(),
      subjects: [
        { id: `sub_${Date.now()}_1`, name: 'Matemática', color: '#6366f1', icon: '📐' },
        { id: `sub_${Date.now()}_2`, name: 'Ciências', color: '#10b981', icon: '🔬' },
        { id: `sub_${Date.now()}_3`, name: 'Português', color: '#f59e0b', icon: '📖' },
      ],
    };
    await db.put('classes', newClass);
    setClasses(prev => [...prev, newClass]);
    setSelectedClassId(newId);
  }, [user]);

  const handleDeleteClass = useCallback(async (classId: string) => {
    await db.delete('classes', classId);
    setClasses(prev => prev.filter(c => c.id !== classId));

    // Cascade delete members and activities
    const classMems = members.filter(m => m.classId === classId);
    for (const m of classMems) {
      await db.delete('members', m.id);
    }
    setMembers(prev => prev.filter(m => m.classId !== classId));

    const classActs = activities.filter(a => a.classId === classId);
    for (const a of classActs) {
      await db.delete('activities', a.id);
    }
    setActivities(prev => prev.filter(a => a.classId !== classId));
  }, [members, activities]);

  const handleAddSubject = useCallback(async (name: string, color: string, icon: string) => {
    if (!currentClass) return;
    const newSub = {
      id: `sub_${Date.now()}`,
      name,
      color,
      icon,
    };
    const updatedClass: ClassRoom = {
      ...currentClass,
      subjects: [...(currentClass.subjects || []), newSub],
    };
    await db.put('classes', updatedClass);
    setClasses(prev => prev.map(c => (c.id === updatedClass.id ? updatedClass : c)));
  }, [currentClass]);

  const handleDeleteSubject = useCallback(async (subjectId: string) => {
    if (!currentClass) return;
    const updatedClass: ClassRoom = {
      ...currentClass,
      subjects: (currentClass.subjects || []).filter(s => s.id !== subjectId),
    };
    await db.put('classes', updatedClass);
    setClasses(prev => prev.map(c => (c.id === updatedClass.id ? updatedClass : c)));
  }, [currentClass]);

  const handlePublishActivity = useCallback(async (newAct: Activity) => {
    await db.put('activities', newAct);
    setActivities(prev => [...prev, newAct]);
    setActiveTab('dash');
  }, []);

  const handleDeleteActivity = useCallback(async (actId: string) => {
    await db.delete('activities', actId);
    setActivities(prev => prev.filter(a => a.id !== actId));
  }, []);

  const handleFinishGame = useCallback(async (result: Result) => {
    // If student already has a result for this activity, keep their best score and avoid duplicates
    const existing = results.find(r => r.actId === result.actId && r.uid === result.uid);
    const toSave: Result = {
      ...result,
      id: `${result.actId}_${result.uid}`,
      xp: existing ? Math.max(existing.xp, result.xp) : result.xp,
      best: existing ? Math.max(existing.best, result.best) : result.best,
      correct: existing ? Math.max(existing.correct, result.correct) : result.correct,
      win: existing ? (existing.win || result.win) : result.win,
    };

    await db.put('results', toSave);
    setResults(prev => {
      const idx = prev.findIndex(r => r.id === toSave.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = toSave;
        return copy;
      }
      return [...prev, toSave];
    });
    setActiveGame(null);
    setActiveTab('prog');
  }, [results]);

  const handleClaimChest = useCallback(async (bonusXP: number, shieldAdded: boolean) => {
    if (!user) return;
    const updatedUser: User = {
      ...user,
      lastDailyChestClaim: Date.now(),
      streakShields: (user.streakShields || 0) + (shieldAdded ? 1 : 0),
    };
    await db.put('users', updatedUser);
    setUser(updatedUser);

    // Save chest XP reward as bonus result (without polluting academic question counts)
    const chestResult: Result = {
      id: `res_chest_${user.id}_${new Date().toISOString().slice(0, 10)}`,
      actId: 'chest_daily',
      classId: selectedClassId || 'general',
      uid: user.id,
      name: user.name,
      av: user.avatar,
      kind: 'quiz',
      correct: 0,
      total: 0,
      xp: bonusXP,
      best: 0,
      per: [],
      at: Date.now(),
    };
    await db.put('results', chestResult);
    setResults(prev => {
      const idx = prev.findIndex(r => r.id === chestResult.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = chestResult;
        return copy;
      }
      return [...prev, chestResult];
    });
  }, [user, selectedClassId]);

  const handleLoadSampleActivities = useCallback(async () => {
    if (!currentClass) return;
    const sampleActs: Activity[] = [
      {
        id: `act_sample_mat_${Date.now()}`,
        classId: currentClass.id,
        sub: currentClass.subjects?.[0]?.id,
        kind: 'quiz',
        title: 'Geometria: Áreas e Perímetros',
        xp: 15,
        time: 20,
        questions: [
          {
            q: 'Qual é o perímetro de um quadrado com lado medindo 6 cm?',
            o: ['24 cm', '36 cm', '18 cm', '12 cm'],
            a: 0,
            e: 'O perímetro é a soma dos 4 lados: 4 × 6 = 24 cm.',
          },
          {
            q: 'Qual é a área de um triângulo com base 8 cm e altura 5 cm?',
            o: ['40 cm²', '20 cm²', '13 cm²', '16 cm²'],
            a: 1,
            e: 'Área do triângulo = (base × altura) ÷ 2 = (8 × 5) ÷ 2 = 20 cm².',
          },
        ],
      },
      {
        id: `act_sample_boss_${Date.now()}`,
        classId: currentClass.id,
        sub: currentClass.subjects?.[0]?.id,
        kind: 'boss',
        title: 'Batalha do Chefe: O Dragão dos Polígonos',
        xp: 30,
        time: 25,
        questions: [
          {
            q: 'Quantos lados possui um hexágono regular?',
            o: ['5', '6', '7', '8'],
            a: 1,
            e: 'Um hexágono possui exatamente 6 lados.',
          },
          {
            q: 'Quanto vale a soma dos ângulos internos de qualquer triângulo?',
            o: ['90°', '180°', '360°', '270°'],
            a: 1,
            e: 'A soma dos ângulos internos de qualquer triângulo euclidiano é sempre 180°!',
          },
        ],
      },
      {
        id: `act_sample_pairs_${Date.now()}`,
        classId: currentClass.id,
        sub: currentClass.subjects?.[1]?.id,
        kind: 'pairs',
        title: 'Ligue o Reino Biológico aos Exemplos',
        xp: 20,
        time: 30,
        questions: [],
        pairs: [
          ['Reino Fungi', 'Cogumelos, leveduras e bolores'],
          ['Reino Plantae', 'Árvores, samambaias e musgos'],
          ['Reino Animalia', 'Mamíferos, aves, répteis e insetos'],
          ['Reino Monera', 'Bactérias e arqueias unicelulares'],
        ],
      },
    ];

    for (const act of sampleActs) {
      await db.put('activities', act);
    }
    setActivities(prev => [...prev, ...sampleActs]);
  }, [currentClass]);

  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="text-4xl animate-bounce">🎮</div>
          <span className="font-display font-bold text-slate-600 dark:text-slate-400">
            Carregando GAMIFY EDU...
          </span>
        </div>
      </div>
    );
  }

  // Not logged in -> Show Auth View
  if (!user) {
    return (
      <AuthScreen
        onLogin={handleLogin}
        onRegister={handleRegister}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
    );
  }

  const isTeacher = user.role === 'teacher';

  return (
    <div className="min-h-[100dvh] bg-slate-50 dark:bg-[#05030a] text-slate-900 dark:text-slate-100 transition-colors overflow-x-hidden flex flex-col w-full">
      
      {/* Top Navigation */}
      <Navbar
        user={user}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onLogout={handleLogout}
        classes={userClasses}
        selectedClassId={currentClass?.id || ''}
        onSelectClass={setSelectedClassId}
        totalXP={totalXP}
        streakDays={streakDays}
        theme={theme}
        onToggleTheme={toggleTheme}
        isSoundMuted={isSoundMuted}
        onToggleSound={toggleSound}
        onOpenChest={() => setChestModalOpen(true)}
        canClaimChest={canClaimChest}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3.5 sm:px-6 lg:px-8 py-5 sm:py-8 pb-28 md:pb-12">
        <Suspense fallback={<RouteSkeleton />}>
          
          {/* STUDENT ROUTES */}
          {!isTeacher && (
            <>
              {activeTab === 'home' && (
                <StudentHome
                  user={user}
                  totalXP={totalXP}
                  streakDays={streakDays}
                  results={myResults}
                  activities={activities.filter(a => a.classId === currentClass?.id)}
                  onStartActivity={setActiveGame}
                  onNavigateTab={setActiveTab}
                  onOpenChest={() => setChestModalOpen(true)}
                  canClaimChest={canClaimChest}
                />
              )}

              {activeTab === 'play' && (
                <ActivitiesList
                  activities={activities.filter(a => a.classId === currentClass?.id)}
                  currentClass={currentClass}
                  user={user}
                  results={results}
                  onStartActivity={setActiveGame}
                />
              )}

              {activeTab === 'mat' && (
                <SubjectsHub
                  currentClass={currentClass}
                  activities={activities.filter(a => a.classId === currentClass?.id)}
                  results={results}
                  user={user}
                  onStartActivity={setActiveGame}
                />
              )}

              {activeTab === 'rank' && (
                <LeaderboardView
                  results={results.filter(r => r.classId === currentClass?.id)}
                  user={user}
                />
              )}

              {activeTab === 'prog' && (
                <ProgressAndBadges
                  user={user}
                  results={results}
                  totalXP={totalXP}
                  streakDays={streakDays}
                  activities={activities}
                />
              )}

              {activeTab === 'turmas' && (
                <ClassJoinModal
                  classes={userClasses}
                  onJoinClass={handleJoinClass}
                  onSelectClass={setSelectedClassId}
                  selectedClassId={selectedClassId}
                />
              )}
            </>
          )}

          {/* TEACHER ROUTES */}
          {isTeacher && (
            <>
              {activeTab === 'dash' && (
                <TeacherDashboard
                  currentClass={currentClass}
                  activities={activities}
                  results={results}
                  members={members}
                  onDeleteActivity={handleDeleteActivity}
                  onNavigateTab={setActiveTab}
                />
              )}

              {activeTab === 'turmas' && (
                <TeacherClasses
                  classes={userClasses}
                  members={members}
                  currentClassId={currentClass?.id || ''}
                  onSelectClass={setSelectedClassId}
                  onCreateClass={handleCreateClass}
                  onDeleteClass={handleDeleteClass}
                />
              )}

              {activeTab === 'mat' && (
                <TeacherSubjects
                  currentClass={currentClass}
                  activities={activities}
                  onAddSubject={handleAddSubject}
                  onDeleteSubject={handleDeleteSubject}
                />
              )}

              {activeTab === 'new' && (
                <TeacherActivityCreator
                  currentClass={currentClass}
                  onPublishActivity={handlePublishActivity}
                  onLoadSampleActivities={handleLoadSampleActivities}
                />
              )}

              {activeTab === 'alunos' && (
                <TeacherStudentsList
                  currentClass={currentClass}
                  members={members}
                  results={results}
                />
              )}

              {activeTab === 'data' && (
                <TeacherDataBackup />
              )}
            </>
          )}

        </Suspense>
      </main>

      {/* Gamified Activity Game Runner Modal */}
      {activeGame && (
        <Suspense fallback={<div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center text-white">Carregando Desafio...</div>}>
          <GameRunner
            activity={activeGame}
            user={user}
            onFinish={handleFinishGame}
            onClose={() => setActiveGame(null)}
          />
        </Suspense>
      )}

      {/* Reward Loot Chest Modal */}
      {chestModalOpen && (
        <RewardChestModal
          onClose={() => setChestModalOpen(false)}
          onClaim={handleClaimChest}
          canClaim={canClaimChest}
        />
      )}

    </div>
  );
}
