import React, { useState } from 'react';
import { sound } from '../../services/audio';
import { fireConfetti } from '../../services/confetti';
import { Sparkles, Shield, X, Gift } from 'lucide-react';

export interface RewardChestModalProps {
  onClose: () => void;
  onClaim: (bonusXP: number, shieldAdded: boolean) => void;
  canClaim: boolean;
}

export const RewardChestModal: React.FC<RewardChestModalProps> = ({
  onClose,
  onClaim,
  canClaim,
}) => {
  const [opened, setOpened] = useState(false);
  const [reward, setReward] = useState<{ xp: number; shield: boolean } | null>(null);

  const handleOpenChest = () => {
    if (!canClaim || opened) return;
    sound.playChestOpen();
    fireConfetti('large');

    // Generate playful rewards (30 to 75 XP + possible streak shield)
    const earnedXP = Math.floor(Math.random() * 45) + 30;
    const gotShield = Math.random() > 0.5;

    setReward({ xp: earnedXP, shield: gotShield });
    setOpened(true);
    onClaim(earnedXP, gotShield);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-sm max-h-[90dvh] overflow-y-auto bg-white dark:bg-[#0f0a1c] border-2 border-amber-300 dark:border-amber-600/50 rounded-3xl p-5 sm:p-6 text-center shadow-2xl scrollbar-thin">
        
        {/* Background glow */}
        <div className="absolute -top-16 -left-16 w-48 h-48 bg-amber-400/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -right-16 w-48 h-48 bg-violet-400/20 rounded-full blur-3xl pointer-events-none" />

        <button
          onClick={() => {
            sound.playClick();
            onClose();
          }}
          className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Fechar"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="font-display font-extrabold text-xl text-slate-900 dark:text-white mt-1">
          {opened ? '🎉 Recompensa Desbloqueada!' : '🎁 Baú Diário de Conquistas'}
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-5">
          {opened
            ? 'Seus bônus foram adicionados ao seu perfil de estudante!'
            : canClaim
            ? 'Toque no baú místico para coletar seu bônus diário de XP e itens!'
            : 'Complete suas missões diárias para destrancar este baú amanhã!'}
        </p>

        {/* Chest Illustration with interactive animation */}
        <div className="my-4">
          <button
            disabled={!canClaim || opened}
            onClick={handleOpenChest}
            className={`text-7xl sm:text-8xl p-3 inline-block transition-transform focus:outline-none ${
              !opened && canClaim ? 'cursor-pointer animate-chest-wiggle hover:scale-110 active:scale-95' : ''
            }`}
            title={canClaim ? 'Clique para abrir o baú!' : 'Baú trancado'}
          >
            {opened ? '✨💎✨' : canClaim ? '🎁' : '🔒'}
          </button>
        </div>

        {/* Unlocked Reward Reveal */}
        {opened && reward && (
          <div className="space-y-3 animate-pop-in">
            <div className="flex items-center justify-center gap-2 p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl text-amber-700 dark:text-amber-300 font-bold text-sm">
              <Sparkles className="w-5 h-5 fill-amber-500 text-amber-500" />
              <span>+{reward.xp} Pontos de XP</span>
            </div>

            {reward.shield && (
              <div className="flex items-center justify-center gap-2 p-3 bg-violet-50 dark:bg-violet-950/40 border border-violet-200 dark:border-violet-800 rounded-2xl text-violet-700 dark:text-violet-300 font-bold text-sm">
                <Shield className="w-5 h-5 text-violet-500" />
                <span>+1 Escudo de Ofensiva (Protege sua chama)</span>
              </div>
            )}

            <button
              onClick={() => {
                sound.playClick();
                onClose();
              }}
              className="w-full mt-4 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-bold rounded-2xl shadow-lg shadow-violet-600/30 transition-all"
            >
              Continuar Aprendendo
            </button>
          </div>
        )}

        {!opened && (
          <button
            disabled={!canClaim}
            onClick={handleOpenChest}
            className="w-full py-3 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 disabled:opacity-50 text-white font-bold rounded-2xl shadow-lg shadow-amber-500/25 transition-all"
          >
            {canClaim ? 'Abrir Baú Mágico' : 'Baú Trancado'}
          </button>
        )}

      </div>
    </div>
  );
};
