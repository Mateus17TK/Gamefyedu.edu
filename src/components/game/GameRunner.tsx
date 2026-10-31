import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Activity, Question, Result, User } from '../../types';
import { calculateQuestionXP, checkTypedAnswer } from '../../utils/gamification';
import { sound } from '../../services/audio';
import { fireConfetti } from '../../services/confetti';
import { Heart, Sparkles, Clock, Flame, Scissors, ArrowRight, ShieldAlert, Award, RefreshCw, X } from 'lucide-react';

export interface GameRunnerProps {
  activity: Activity;
  user: User;
  onFinish: (result: Result) => void;
  onClose: () => void;
}

export const GameRunner: React.FC<GameRunnerProps> = ({
  activity,
  user,
  onFinish,
  onClose,
}) => {
  const isPairs = activity.kind === 'pairs';
  const isBoss = activity.kind === 'boss';
  const isTyped = activity.kind === 'type';
  const isVF = activity.kind === 'vf';

  const questionsCount = isPairs ? (activity.pairs?.length || 0) : activity.questions.length;

  // Session state
  const [currentIdx, setCurrentIdx] = useState(0);
  const [sessionXP, setSessionXP] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [performance, setPerformance] = useState<boolean[]>([]);
  const [selectedAns, setSelectedAns] = useState<number | string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(activity.time);
  const [hiddenOptions, setHiddenOptions] = useState<number[]>([]);
  const [fiftyRemaining, setFiftyRemaining] = useState(2);
  const [typedInput, setTypedInput] = useState('');
  const [floatingXP, setFloatingXP] = useState<{ id: number; amount: number; x: number; y: number } | null>(null);

  // Boss fight state
  const [bossHP, setBossHP] = useState(questionsCount);
  const [bossHit, setBossHit] = useState(false);
  const [playerHearts, setPlayerHearts] = useState(3);

  // Pairs Matching state
  const [leftSelected, setLeftSelected] = useState<number | null>(null);
  const [pairsDone, setPairsDone] = useState<number[]>([]);
  const [wrongRight, setWrongRight] = useState<number | null>(null);
  const [pairHint, setPairHint] = useState<string>('');

  // Shuffled right pairs for matching
  const shuffledRightIndices = useMemo(() => {
    if (!activity.pairs) return [];
    return activity.pairs.map((_, i) => i).sort(() => Math.random() - 0.5);
  }, [activity.pairs]);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Timer loop for standard/boss/typed questions
  useEffect(() => {
    if (isPairs || isAnswered) return;

    setTimeRemaining(activity.time);
    const startTime = Date.now();
    const durationMs = activity.time * 1000;

    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remainingSec = Math.max(0, (durationMs - elapsed) / 1000);
      setTimeRemaining(remainingSec);

      if (remainingSec <= 0) {
        clearInterval(timerRef.current!);
        handleTimeout();
      }
    }, 100);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentIdx, isAnswered, isPairs, activity.time]);

  const triggerFloatXP = useCallback((amount: number, clientX: number, clientY: number) => {
    if (amount <= 0) return;
    setFloatingXP({ id: Date.now(), amount, x: clientX, y: clientY });
    setTimeout(() => setFloatingXP(null), 950);
  }, []);

  const handleTimeout = () => {
    if (isAnswered) return;
    setIsAnswered(true);
    setSelectedAns(-1); // -1 indicates timeout
    setCombo(0);
    sound.playWrong();

    if (isBoss) {
      setPlayerHearts(h => Math.max(0, h - 1));
    }

    setPerformance(prev => [...prev, false]);
  };

  const handleSelectOption = (idx: number, e: React.MouseEvent) => {
    if (isAnswered) return;
    if (timerRef.current) clearInterval(timerRef.current);

    const question = activity.questions[currentIdx];
    const isCorrect = idx === Number(question.a);
    setIsAnswered(true);
    setSelectedAns(idx);

    if (isCorrect) {
      sound.playCorrect();
      const newCombo = combo + 1;
      setCombo(newCombo);
      setMaxCombo(prev => Math.max(prev, newCombo));
      setCorrectCount(prev => prev + 1);

      const earnedXP = calculateQuestionXP(activity.xp, timeRemaining, activity.time, newCombo, true);
      setSessionXP(prev => prev + earnedXP);
      triggerFloatXP(earnedXP, e.clientX || window.innerWidth / 2, e.clientY || window.innerHeight / 2);

      if (newCombo >= 3) {
        sound.playCombo();
      }

      if (isBoss) {
        setBossHP(hp => Math.max(0, hp - 1));
        setBossHit(true);
        setTimeout(() => setBossHit(false), 500);
        sound.playBossHit();
      }

      setPerformance(prev => [...prev, true]);
    } else {
      sound.playWrong();
      setCombo(0);
      if (isBoss) {
        setPlayerHearts(h => Math.max(0, h - 1));
      }
      setPerformance(prev => [...prev, false]);
    }
  };

  const handleTypedSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isAnswered) return;
    const input = typedInput.trim();
    if (!input) return;

    if (timerRef.current) clearInterval(timerRef.current);

    const question = activity.questions[currentIdx];
    const isCorrect = checkTypedAnswer(input, question.ans || []);
    setIsAnswered(true);
    setSelectedAns(input);

    if (isCorrect) {
      sound.playCorrect();
      const newCombo = combo + 1;
      setCombo(newCombo);
      setMaxCombo(prev => Math.max(prev, newCombo));
      setCorrectCount(prev => prev + 1);

      const earnedXP = calculateQuestionXP(activity.xp, timeRemaining, activity.time, newCombo, true);
      setSessionXP(prev => prev + earnedXP);
      triggerFloatXP(earnedXP, window.innerWidth / 2, window.innerHeight / 2);

      if (newCombo >= 3) {
        sound.playCombo();
      }

      setPerformance(prev => [...prev, true]);
    } else {
      sound.playWrong();
      setCombo(0);
      setPerformance(prev => [...prev, false]);
    }
  };

  const handleApplyFifty = () => {
    if (fiftyRemaining <= 0 || isAnswered) return;
    const question = activity.questions[currentIdx];
    if (!question.o || question.o.length <= 2) return;

    sound.playClick();
    setFiftyRemaining(f => f - 1);
    const correctVal = Number(question.a);
    const incorrectIndices = question.o
      .map((_, i) => i)
      .filter(i => i !== correctVal);
    
    // Pick two incorrect to hide
    const toHide = incorrectIndices.sort(() => Math.random() - 0.5).slice(0, 2);
    setHiddenOptions(toHide);
  };

  const handlePairClickLeft = (idx: number) => {
    if (pairsDone.includes(idx)) return;
    sound.playClick();
    setLeftSelected(idx);
    setWrongRight(null);
    setPairHint('');
  };

  const handlePairClickRight = (idx: number, e: React.MouseEvent) => {
    if (pairsDone.includes(idx)) return;
    
    if (leftSelected === null) {
      sound.playWrong();
      setPairHint('Selecione primeiro um conceito na coluna da esquerda!');
      setTimeout(() => setPairHint(''), 2500);
      return;
    }

    if (leftSelected === idx) {
      // Correct pair!
      sound.playCorrect();
      const newDone = [...pairsDone, idx];
      setPairsDone(newDone);
      const newCombo = combo + 1;
      setCombo(newCombo);
      setMaxCombo(prev => Math.max(prev, newCombo));
      setCorrectCount(prev => prev + 1);

      const earnedXP = activity.xp + (newCombo >= 3 ? 5 : 0);
      setSessionXP(prev => prev + earnedXP);
      triggerFloatXP(earnedXP, e.clientX, e.clientY);

      setLeftSelected(null);
      setWrongRight(null);
      setPairHint('');

      // Check if all pairs are solved
      if (newDone.length === (activity.pairs?.length || 0)) {
        setTimeout(() => handleFinishGame(newDone.length, sessionXP + earnedXP, maxCombo, true), 600);
      }
    } else {
      // Wrong pair
      sound.playWrong();
      setCombo(0);
      setWrongRight(idx);
      setTimeout(() => setWrongRight(null), 600);
    }
  };

  const handleNext = () => {
    sound.playClick();
    const nextIdx = currentIdx + 1;
    const isGameOver = (isBoss && (playerHearts <= 0 || bossHP <= 0)) || nextIdx >= questionsCount;

    if (isGameOver) {
      handleFinishGame(correctCount, sessionXP, maxCombo, isBoss ? bossHP <= 0 : true);
    } else {
      setCurrentIdx(nextIdx);
      setIsAnswered(false);
      setSelectedAns(null);
      setHiddenOptions([]);
      setTypedInput('');
    }
  };

  const handleFinishGame = (finalCorrect: number, currentXP: number, bestCombo: number, winState: boolean) => {
    if (timerRef.current) clearInterval(timerRef.current);

    let totalEarned = currentXP;
    if (isBoss && winState) {
      // Boss victory bonus: x3 on base!
      totalEarned += activity.xp * 3;
    }

    const isPerfect = finalCorrect === questionsCount && questionsCount > 0;
    if (winState || isPerfect) {
      sound.playLevelUp();
      fireConfetti(isBoss || isPerfect ? 'large' : 'medium');
    } else {
      sound.playCorrect();
    }

    const finalResult: Result = {
      id: `${activity.id}_${user.id}_${Date.now()}`,
      actId: activity.id,
      classId: activity.classId,
      uid: user.id,
      name: user.name,
      av: user.avatar,
      kind: activity.kind,
      win: winState,
      correct: finalCorrect,
      total: questionsCount,
      xp: totalEarned,
      best: bestCombo,
      per: performance,
      at: Date.now(),
    };

    onFinish(finalResult);
  };

  const currentQ: Question | undefined = !isPairs ? activity.questions[currentIdx] : undefined;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-fade-in overflow-y-auto">
      
      {/* Floating XP element */}
      {floatingXP && (
        <div
          className="fixed z-50 font-black text-2xl text-emerald-400 drop-shadow-[0_2px_8px_rgba(16,185,129,0.8)] pointer-events-none animate-float-up"
          style={{ left: floatingXP.x, top: floatingXP.y }}
        >
          +{floatingXP.amount} XP
        </div>
      )}

      <div className="relative w-full max-w-2xl max-h-[92dvh] overflow-y-auto bg-white dark:bg-[#0f0a1c] border-2 border-slate-200 dark:border-violet-900/40 rounded-3xl shadow-2xl p-4 sm:p-7 scrollbar-thin">
        
        {/* Header Strip */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-xl">
              {activity.kind === 'boss' ? '👹' : activity.kind === 'pairs' ? '🧩' : activity.kind === 'vf' ? '⚡' : '🎯'}
            </span>
            <div>
              <h2 className="font-display font-bold text-base sm:text-lg text-slate-900 dark:text-white leading-tight">
                {activity.title}
              </h2>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {isPairs
                  ? `${pairsDone.length}/${questionsCount} pares conectados`
                  : `Questão ${currentIdx + 1} de ${questionsCount}`}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {combo > 1 && (
              <div className="flex items-center gap-1 px-2.5 py-1 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-600 dark:text-amber-400 font-black text-xs animate-pulse">
                <Flame className="w-3.5 h-3.5 fill-amber-500" />
                <span>Combo x{combo}</span>
              </div>
            )}
            <div className="flex items-center gap-1 px-2.5 py-1 bg-violet-500/10 border border-violet-500/30 rounded-xl text-violet-600 dark:text-violet-400 font-bold text-xs tabular-nums">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{sessionXP} XP</span>
            </div>
            <button
              onClick={() => {
                sound.playClick();
                onClose();
              }}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Sair do jogo"
              aria-label="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Boss Stage Header */}
        {isBoss && (
          <div className="my-3 p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-2xl flex flex-col items-center">
            <div className="flex items-center justify-between w-full mb-1 text-xs font-bold text-rose-700 dark:text-rose-300">
              <div className="flex items-center gap-1">
                <span>Vidas:</span>
                {Array.from({ length: 3 }).map((_, i) => (
                  <Heart
                    key={i}
                    className={`w-4 h-4 ${
                      i < playerHearts
                        ? 'text-rose-500 fill-rose-500 animate-pulse'
                        : 'text-slate-300 dark:text-slate-700'
                    }`}
                  />
                ))}
              </div>
              <span>Chefe: {bossHP} / {questionsCount} HP</span>
            </div>

            <div className="w-full h-3 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden mb-2">
              <div
                className="h-full bg-gradient-to-r from-rose-500 to-amber-500 transition-all duration-300"
                style={{ width: `${(bossHP / questionsCount) * 100}%` }}
              />
            </div>

            <div className={`text-4xl sm:text-5xl my-1 transition-transform ${bossHit ? 'animate-boss-shake scale-125' : ''}`}>
              {bossHP <= 0 ? '💥' : playerHearts <= 0 ? '💀' : '👹'}
            </div>
            <p className="text-xs text-rose-600 dark:text-rose-400 italic">
              {bossHP <= 0
                ? 'Você subjugou o Titã! Bônus de XP desbloqueado!'
                : playerHearts <= 0
                ? 'Suas vidas se esgotaram...'
                : 'Acerte para desferir golpes no chefe e desviar de ataques!'}
            </p>
          </div>
        )}

        {/* Question Progress Bar & Countdown Timer */}
        {!isPairs && (
          <div className="mt-3 space-y-1">
            <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-violet-600 transition-all duration-300"
                style={{ width: `${((currentIdx) / questionsCount) * 100}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1 pt-1">
              <div className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                <span className="font-mono font-medium">{Math.ceil(timeRemaining)}s</span>
              </div>
              {activity.xp > 0 && <span>Valor base: {activity.xp} XP</span>}
            </div>
            {/* Smooth time depleting bar */}
            <div className="w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-100 linear ${
                  timeRemaining < 5 ? 'bg-rose-500 animate-pulse' : 'bg-amber-500'
                }`}
                style={{ width: `${Math.max(0, (timeRemaining / activity.time) * 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Content Zone */}
        <div className="py-4">
          
          {/* PAIRS MATCHING VIEW */}
          {isPairs && activity.pairs && (
            <div className="space-y-4">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-300 text-center">
                Toque no conceito à esquerda e depois em sua definição correspondente à direita:
              </p>
              {pairHint && (
                <div className="p-2.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/60 rounded-xl text-center text-xs font-bold text-amber-700 dark:text-amber-300 animate-pop-in">
                  👉 {pairHint}
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Left column */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Conceitos
                  </span>
                  {activity.pairs.map((pair, idx) => {
                    const isDone = pairsDone.includes(idx);
                    const isSelected = leftSelected === idx;
                    return (
                      <button
                        key={idx}
                        disabled={isDone}
                        onClick={() => handlePairClickLeft(idx)}
                        className={`w-full p-3 rounded-2xl text-left font-semibold text-sm transition-all border-2 ${
                          isDone
                            ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-500/50 text-emerald-700 dark:text-emerald-300 opacity-60'
                            : isSelected
                            ? 'bg-violet-50 dark:bg-violet-950/50 border-violet-600 text-violet-700 dark:text-violet-300 scale-[1.02] shadow-sm'
                            : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-violet-400'
                        }`}
                      >
                        {pair[0]}
                      </button>
                    );
                  })}
                </div>

                {/* Right column (shuffled) */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Definições
                  </span>
                  {shuffledRightIndices.map((origIdx) => {
                    const pair = activity.pairs![origIdx];
                    const isDone = pairsDone.includes(origIdx);
                    const isWrong = wrongRight === origIdx;
                    return (
                      <button
                        key={origIdx}
                        disabled={isDone}
                        onClick={(e) => handlePairClickRight(origIdx, e)}
                        className={`w-full p-3 rounded-2xl text-left font-medium text-sm transition-all border-2 ${
                          isDone
                            ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-500/50 text-emerald-700 dark:text-emerald-300 opacity-60'
                            : isWrong
                            ? 'bg-rose-50 dark:bg-rose-950/50 border-rose-500 text-rose-700 dark:text-rose-300 animate-shake'
                            : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-violet-400'
                        }`}
                      >
                        {pair[1]}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* QUESTION PROSE (Quiz, Boss, VF, Typed) */}
          {!isPairs && currentQ && (
            <div className="space-y-4">
              <h3 className="font-display text-lg sm:text-xl font-bold text-slate-900 dark:text-white leading-snug">
                {currentQ.q}
              </h3>

              {/* Typed Answer Mode */}
              {isTyped && (
                <form onSubmit={handleTypedSubmit} className="space-y-3">
                  <input
                    type="text"
                    value={typedInput}
                    disabled={isAnswered}
                    onChange={(e) => setTypedInput(e.target.value)}
                    placeholder="Digite sua resposta..."
                    className="w-full px-4 py-3 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium text-base focus:outline-none focus:border-violet-600 transition-colors"
                    autoFocus
                  />
                  {!isAnswered && (
                    <button
                      type="submit"
                      disabled={!typedInput.trim()}
                      className="w-full py-3 px-4 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-bold rounded-2xl shadow-md shadow-violet-600/20 transition-all"
                    >
                      Confirmar Resposta
                    </button>
                  )}
                </form>
              )}

              {/* Multiple Choice & V/F Options */}
              {!isTyped && currentQ.o && (
                <div className="space-y-2.5">
                  {currentQ.o.map((opt, idx) => {
                    const isHidden = hiddenOptions.includes(idx);
                    if (isHidden) return null;

                    const isCorrectChoice = idx === currentQ.a;
                    const isUserChoice = selectedAns === idx;

                    let btnStyle = 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:border-violet-500 hover:bg-violet-50/50 dark:hover:bg-slate-700/60 text-slate-800 dark:text-slate-200';

                    if (isAnswered) {
                      if (isCorrectChoice) {
                        btnStyle = 'bg-emerald-500 text-white border-emerald-600 font-bold shadow-md shadow-emerald-500/20';
                      } else if (isUserChoice) {
                        btnStyle = 'bg-rose-500 text-white border-rose-600 font-bold';
                      } else {
                        btnStyle = 'opacity-40 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500';
                      }
                    }

                    return (
                      <button
                        key={idx}
                        disabled={isAnswered}
                        onClick={(e) => handleSelectOption(idx, e)}
                        className={`w-full p-3.5 sm:p-4 rounded-2xl text-left font-medium text-sm sm:text-base border-2 transition-all flex items-center justify-between ${btnStyle}`}
                      >
                        <span>{opt}</span>
                        {isAnswered && isCorrectChoice && (
                          <span className="text-lg">✓</span>
                        )}
                        {isAnswered && isUserChoice && !isCorrectChoice && (
                          <span className="text-lg">✗</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* 50/50 Power-Up */}
              {!isAnswered && !isTyped && !isVF && currentQ.o && currentQ.o.length > 2 && (
                <div className="pt-1 flex items-center justify-end">
                  <button
                    onClick={handleApplyFifty}
                    disabled={fiftyRemaining <= 0 || hiddenOptions.length > 0}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 text-xs font-bold hover:bg-violet-100 dark:hover:bg-violet-900/40 disabled:opacity-40 transition-all"
                  >
                    <Scissors className="w-3.5 h-3.5" />
                    <span>Poder 50/50 ({fiftyRemaining})</span>
                  </button>
                </div>
              )}

              {/* Explanation & Feedback Card */}
              {isAnswered && (
                <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-1.5 animate-pop-in">
                  <div className="flex items-center gap-2 text-sm font-bold">
                    {selectedAns === currentQ.a || (isTyped && checkTypedAnswer(String(selectedAns), currentQ.ans || [])) ? (
                      <span className="text-emerald-600 dark:text-emerald-400">✨ Excelente! Resposta correta!</span>
                    ) : selectedAns === -1 ? (
                      <span className="text-amber-600 dark:text-amber-400">⏰ O tempo esgotou!</span>
                    ) : (
                      <span className="text-rose-600 dark:text-rose-400">
                        {isTyped ? `Resposta esperada: ${currentQ.ans?.[0] || ''}` : 'Não foi dessa vez!'}
                      </span>
                    )}
                  </div>
                  {currentQ.e && (
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      💡 <b>Explicação pedagógica:</b> {currentQ.e}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {!isPairs && isAnswered && (
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
            <button
              onClick={handleNext}
              className="flex items-center gap-2 py-3 px-6 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-2xl shadow-lg shadow-violet-600/30 transition-all"
            >
              <span>
                {currentIdx + 1 >= questionsCount || (isBoss && (playerHearts <= 0 || bossHP <= 0))
                  ? 'Ver Resultado Final'
                  : 'Próxima Questão'}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
