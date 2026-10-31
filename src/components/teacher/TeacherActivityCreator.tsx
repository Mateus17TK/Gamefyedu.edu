import React, { useState } from 'react';
import { Activity, ActivityKind, ClassRoom, Pair, Question } from '../../types';
import { sound } from '../../services/audio';
import { fireConfetti } from '../../services/confetti';
import { PlusCircle, Sparkles, Trash2, HelpCircle, Swords, ArrowRight } from 'lucide-react';

export interface TeacherActivityCreatorProps {
  currentClass: ClassRoom | null;
  onPublishActivity: (act: Activity) => Promise<void>;
  onLoadSampleActivities: () => Promise<void>;
}

export const TeacherActivityCreator: React.FC<TeacherActivityCreatorProps> = React.memo(({
  currentClass,
  onPublishActivity,
  onLoadSampleActivities,
}) => {
  const [kind, setKind] = useState<ActivityKind>('quiz');
  const [title, setTitle] = useState('');
  const [subId, setSubId] = useState(currentClass?.subjects?.[0]?.id || '');
  const [xpPerCorrect, setXpPerCorrect] = useState(15);
  const [timeSec, setTimeSec] = useState(25);
  const [dueDate, setDueDate] = useState('');

  // Draft questions for Quiz, VF, Typed, Boss
  const [draftQuestions, setDraftQuestions] = useState<Question[]>([]);
  const [currentQText, setCurrentQText] = useState('');
  const [currentOptions, setCurrentOptions] = useState<string>('Opção A\nOpção B\nOpção C\nOpção D');
  const [currentCorrectIdx, setCurrentCorrectIdx] = useState(0);
  const [currentVfAnswer, setCurrentVfAnswer] = useState(0); // 0=V, 1=F
  const [currentTypedAnswers, setCurrentTypedAnswers] = useState('Resposta esperada\nOutra variação aceita');
  const [currentExplanation, setCurrentExplanation] = useState('');

  // Pairs text area: termo = definicao
  const [pairsRaw, setPairsRaw] = useState(
    'Fotossíntese = Produção de glicose e oxigênio pela luz\nMitocôndria = Usina de energia da célula (ATP)\nRibossomo = Síntese de proteínas celulares\nClorofila = Pigmento verde receptor de luz'
  );

  const [loading, setLoading] = useState(false);

  const subjects = currentClass?.subjects || [];

  const handleAddQuestion = () => {
    const q = currentQText.trim();
    if (!q) {
      alert('Por favor, informe o enunciado da questão.');
      return;
    }

    sound.playClick();

    if (kind === 'vf') {
      const newQ: Question = {
        q,
        o: ['Verdadeiro', 'Falso'],
        a: currentVfAnswer,
        e: currentExplanation.trim(),
      };
      setDraftQuestions(prev => [...prev, newQ]);
    } else if (kind === 'type') {
      const accepted = currentTypedAnswers.split('\n').map(s => s.trim()).filter(Boolean);
      if (accepted.length === 0) {
        alert('Informe ao menos uma resposta aceita.');
        return;
      }
      const newQ: Question = {
        q,
        ans: accepted,
        e: currentExplanation.trim(),
      };
      setDraftQuestions(prev => [...prev, newQ]);
    } else {
      // Quiz or Boss
      const opts = currentOptions.split('\n').map(s => s.trim()).filter(Boolean);
      if (opts.length < 2) {
        alert('Informe pelo menos 2 alternativas.');
        return;
      }
      const safeCorrectIdx = Math.max(0, Math.min(currentCorrectIdx, opts.length - 1));
      const newQ: Question = {
        q,
        o: opts,
        a: safeCorrectIdx,
        e: currentExplanation.trim(),
      };
      setDraftQuestions(prev => [...prev, newQ]);
    }

    // Reset current question inputs
    setCurrentQText('');
    setCurrentExplanation('');
  };

  const handlePublish = async () => {
    if (!currentClass) {
      alert('Selecione uma turma primeiro.');
      return;
    }
    const cleanTitle = title.trim();
    if (!cleanTitle) {
      alert('Informe o título da atividade.');
      return;
    }

    let pairs: Pair[] = [];
    if (kind === 'pairs') {
      pairs = pairsRaw
        .split('\n')
        .map(line => line.split('=').map(s => s.trim()))
        .filter(parts => parts.length >= 2 && parts[0] && parts[1])
        .map(parts => [parts[0], parts.slice(1).join('=')] as Pair);

      if (pairs.length < 2) {
        alert('Informe pelo menos 2 pares no formato: Conceito = Definição.');
        return;
      }
    } else {
      if (draftQuestions.length === 0) {
        alert('Adicione pelo menos 1 questão antes de publicar.');
        return;
      }
    }

    setLoading(true);
    try {
      const newAct: Activity = {
        id: `act_${Date.now()}`,
        classId: currentClass.id,
        sub: subId || subjects[0]?.id || '',
        kind,
        title: cleanTitle,
        xp: xpPerCorrect,
        time: timeSec,
        due: dueDate,
        questions: kind === 'pairs' ? [] : draftQuestions,
        pairs: kind === 'pairs' ? pairs : undefined,
        created: Date.now(),
      };

      await onPublishActivity(newAct);
      sound.playLevelUp();
      fireConfetti('medium');

      // Reset form
      setTitle('');
      setDraftQuestions([]);
    } finally {
      setLoading(false);
    }
  };

  if (!currentClass) {
    return (
      <div className="p-12 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-400">
        Selecione uma turma para criar atividades.
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-violet-100 dark:bg-violet-950/60 flex items-center justify-center text-violet-600 dark:text-violet-400">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display font-bold text-lg text-slate-900 dark:text-white">
                Criar Nova Atividade Pedagógica
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Configure quizzes com cronômetro, relâmpagos V/F, ligar pares ou batalhas contra chefes.
              </p>
            </div>
          </div>

          {/* Quick Samples Button */}
          <button
            type="button"
            onClick={async () => {
              if (confirm('Deseja carregar exemplos prontos de atividades (Matemática, Ciências, Português, Chefes)?')) {
                await onLoadSampleActivities();
                sound.playLevelUp();
                fireConfetti('medium');
              }
            }}
            className="flex items-center gap-1.5 py-2 px-3.5 rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 text-xs font-bold hover:bg-amber-100 transition-colors shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            <span>Carregar Exemplos Prontos</span>
          </button>
        </div>

        {/* Format Selector */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2">
          {[
            { id: 'quiz', label: 'Quiz Múltipla Escolha', icon: '🎯' },
            { id: 'boss', label: 'Batalha de Chefe', icon: '👹' },
            { id: 'vf', label: 'Relâmpago V/F', icon: '⚡' },
            { id: 'pairs', label: 'Ligar Pares', icon: '🧩' },
            { id: 'type', label: 'Resposta Digitada', icon: '⌨️' },
          ].map(fmt => (
            <button
              key={fmt.id}
              type="button"
              onClick={() => {
                sound.playClick();
                setKind(fmt.id as ActivityKind);
              }}
              className={`p-3 rounded-2xl border-2 text-center transition-all flex flex-col items-center gap-1 ${
                kind === fmt.id
                  ? 'border-violet-600 bg-violet-50 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300 font-bold shadow-sm'
                  : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 hover:border-slate-300'
              }`}
            >
              <span className="text-xl">{fmt.icon}</span>
              <span className="text-xs leading-tight">{fmt.label}</span>
            </button>
          ))}
        </div>

        {/* Global Settings */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <div>
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">
              Matéria / Disciplina
            </label>
            <select
              value={subId}
              onChange={(e) => setSubId(e.target.value)}
              className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              {subjects.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">
              XP por Acerto
            </label>
            <input
              type="number"
              min={5}
              max={100}
              value={xpPerCorrect}
              onChange={(e) => setXpPerCorrect(Number(e.target.value))}
              className="w-full px-3 py-2 text-xs font-mono font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">
              Segundos / Questão
            </label>
            <input
              type="number"
              min={5}
              max={120}
              value={timeSec}
              onChange={(e) => setTimeSec(Number(e.target.value))}
              className="w-full px-3 py-2 text-xs font-mono font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">
              Prazo de Entrega (opcional)
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">
            Título da Atividade
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex.: Frações Equivalentes no Cotidiano"
            className="w-full px-4 py-2.5 text-sm font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>
      </div>

      {/* PAIRS SPECIFIC EDITOR */}
      {kind === 'pairs' ? (
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <h3 className="font-display font-bold text-base text-slate-900 dark:text-white">
            Pares Conceituais (Um par por linha: Conceito = Definição)
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            O aluno precisará associar cada termo da esquerda com a definição correspondente da direita.
          </p>
          <textarea
            rows={6}
            value={pairsRaw}
            onChange={(e) => setPairsRaw(e.target.value)}
            className="w-full p-4 text-xs font-mono rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>
      ) : (
        /* QUESTION BUILDER FOR QUIZ, BOSS, VF, TYPED */
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-base text-slate-900 dark:text-white">
              Adicionar Questão #{draftQuestions.length + 1}
            </h3>
            {kind === 'boss' && (
              <span className="text-xs font-bold text-rose-500 flex items-center gap-1">
                <Swords className="w-3.5 h-3.5" />
                <span>Modo Chefe: Cada acerto inflige dano!</span>
              </span>
            )}
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">
              Enunciado da Questão
            </label>
            <input
              type="text"
              value={currentQText}
              onChange={(e) => setCurrentQText(e.target.value)}
              placeholder="Digite o enunciado ou desafio..."
              className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>

          {kind === 'vf' && (
            <div>
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">
                Gabarito Correto
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentVfAnswer(0)}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
                    currentVfAnswer === 0
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  Verdadeiro
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentVfAnswer(1)}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
                    currentVfAnswer === 1
                      ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  Falso
                </button>
              </div>
            </div>
          )}

          {kind === 'type' && (
            <div>
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">
                Respostas Aceitas (Uma por linha)
              </label>
              <textarea
                rows={3}
                value={currentTypedAnswers}
                onChange={(e) => setCurrentTypedAnswers(e.target.value)}
                placeholder="Uma resposta correta por linha (o sistema ignora acentos e maiúsculas automaticamente)"
                className="w-full p-3 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
          )}

          {(kind === 'quiz' || kind === 'boss') && (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">
                  Alternativas (Uma por linha)
                </label>
                <textarea
                  rows={4}
                  value={currentOptions}
                  onChange={(e) => setCurrentOptions(e.target.value)}
                  className="w-full p-3 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">
                  Índice da Alternativa Correta
                </label>
                <select
                  value={currentCorrectIdx}
                  onChange={(e) => setCurrentCorrectIdx(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                >
                  {currentOptions.split('\n').filter(Boolean).map((opt, i) => (
                    <option key={i} value={i}>
                      Alternativa #{i + 1}: {opt.slice(0, 40)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">
              Explicação Pedagógica (Exibida ao aluno após a resposta)
            </label>
            <input
              type="text"
              value={currentExplanation}
              onChange={(e) => setCurrentExplanation(e.target.value)}
              placeholder="Ex.: Explicação passo a passo do porquê desta resposta..."
              className="w-full px-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={handleAddQuestion}
              className="py-2.5 px-5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-bold text-xs rounded-xl transition-all shadow-sm flex items-center gap-1.5"
            >
              <PlusCircle className="w-4 h-4 text-violet-500" />
              <span>Adicionar Questão à Lista</span>
            </button>
          </div>

          {/* Draft Questions List */}
          {draftQuestions.length > 0 && (
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Questões Prontas ({draftQuestions.length})
              </span>
              {draftQuestions.map((q, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs"
                >
                  <div className="space-y-0.5 max-w-[80%]">
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {idx + 1}. {q.q}
                    </span>
                    {q.e && (
                      <p className="text-[11px] text-slate-400 truncate">
                        💡 {q.e}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      sound.playClick();
                      setDraftQuestions(prev => prev.filter((_, i) => i !== idx));
                    }}
                    className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Publish Button */}
      <div className="flex justify-end pt-2">
        <button
          type="button"
          disabled={loading || !title.trim()}
          onClick={handlePublish}
          className="py-3 px-8 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-bold text-sm rounded-2xl shadow-lg shadow-violet-600/30 transition-all flex items-center gap-2"
        >
          <span>{loading ? 'Publicando...' : `Publicar Atividade`}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
});
