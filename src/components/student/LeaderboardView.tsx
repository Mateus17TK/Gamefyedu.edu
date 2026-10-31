import React, { useState, useMemo, useCallback } from 'react';
import { Result, StudentLeaderboardEntry, User } from '../../types';
import { buildLeaderboard, getTitle, getLevel } from '../../utils/gamification';
import { VirtualList } from '../common/VirtualList';
import { sound } from '../../services/audio';
import { Trophy, Search, Sparkles, Medal } from 'lucide-react';

export interface LeaderboardViewProps {
  results: Result[];
  user: User;
}

export const LeaderboardView: React.FC<LeaderboardViewProps> = React.memo(({
  results,
  user,
}) => {
  const [period, setPeriod] = useState<'all' | 'weekly'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter results by period
  const filteredResults = useMemo(() => {
    if (period === 'all') return results;
    const sevenDaysAgo = Date.now() - 7 * 86_400_000;
    return results.filter(r => r.at >= sevenDaysAgo);
  }, [results, period]);

  // Build full leaderboard with memoization
  const fullLeaderboard = useMemo(() => {
    return buildLeaderboard(filteredResults);
  }, [filteredResults]);

  // Apply search query
  const displayLeaderboard = useMemo(() => {
    if (!searchQuery.trim()) return fullLeaderboard;
    const q = searchQuery.toLowerCase();
    return fullLeaderboard.filter(item => item.name.toLowerCase().includes(q));
  }, [fullLeaderboard, searchQuery]);

  // Top 3 for Podium preview
  const topThree = useMemo(() => {
    return fullLeaderboard.slice(0, 3);
  }, [fullLeaderboard]);

  const renderLeaderboardRow = useCallback((entry: StudentLeaderboardEntry) => {
    const isMe = entry.uid === user.id;
    const rank = entry.rank || 1;
    const level = getLevel(entry.xp);

    return (
      <div
        className={`flex items-center justify-between px-4 py-2.5 mx-1 my-1 rounded-2xl border transition-all h-[56px] box-border ${
          isMe
            ? 'bg-violet-50/90 dark:bg-violet-950/40 border-violet-400 dark:border-violet-600 shadow-sm ring-1 ring-violet-400/40'
            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
        }`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-7 text-center font-bold text-sm shrink-0">
            {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : (
              <span className="text-slate-400 font-mono text-xs">{rank}</span>
            )}
          </div>

          <span className="text-xl shrink-0 select-none" role="img" aria-label="Avatar">
            {entry.av}
          </span>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm text-slate-900 dark:text-white truncate">
                {entry.name}
              </span>
              {isMe && (
                <span className="px-1.5 py-0.5 rounded-md bg-violet-600 text-[10px] font-bold text-white shrink-0">
                  VOCÊ
                </span>
              )}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 whitespace-nowrap truncate">
              <span>Nv.{level}</span>
              <span className="hidden sm:inline">· {getTitle(entry.xp)}</span>
              <span>·</span>
              <span>{entry.accuracy}% acerto</span>
              <span className="hidden sm:inline">({entry.acts} ativ.)</span>
            </div>
          </div>
        </div>

        <div className="text-right shrink-0">
          <span className="font-mono font-extrabold text-sm text-violet-600 dark:text-violet-400 tabular-nums">
            {entry.xp}
          </span>
          <span className="text-[11px] text-slate-400 ml-1">XP</span>
        </div>
      </div>
    );
  }, [user.id]);

  const getItemKey = useCallback((entry: StudentLeaderboardEntry) => entry.uid, []);

  return (
    <div className="space-y-6">
      
      {/* Header with Period Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-display font-extrabold text-xl text-slate-900 dark:text-white flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            <span>Hall da Fama & Ranking Escolar</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Pontuação calculada com base na precisão, agilidade e vitórias contra chefes.
          </p>
        </div>

        {/* Period Selector */}
        <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
          <button
            onClick={() => {
              sound.playClick();
              setPeriod('all');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              period === 'all'
                ? 'bg-white dark:bg-slate-700 text-violet-700 dark:text-violet-300 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Geral (Todo o ano)
          </button>
          <button
            onClick={() => {
              sound.playClick();
              setPeriod('weekly');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              period === 'weekly'
                ? 'bg-white dark:bg-slate-700 text-violet-700 dark:text-violet-300 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Semanal
          </button>
        </div>
      </div>

      {/* Podium Top 3 Cards */}
      {topThree.length > 0 && !searchQuery && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {topThree.map((item, idx) => {
            const isFirst = idx === 0;
            const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉';
            const borderCol = idx === 0 ? 'border-amber-400/80' : idx === 1 ? 'border-slate-300 dark:border-slate-700' : 'border-amber-700/50';

            return (
              <div
                key={item.uid}
                className={`p-4 rounded-3xl bg-white dark:bg-slate-900 border-2 ${borderCol} shadow-sm text-center relative overflow-hidden flex flex-col items-center justify-between`}
              >
                {isFirst && (
                  <div className="absolute top-2 right-2">
                    <Sparkles className="w-4 h-4 text-amber-500 fill-amber-500" />
                  </div>
                )}
                <div className="text-2xl mb-1">{medal}</div>
                <div className="text-3xl my-1">{item.av}</div>
                <h3 className="font-display font-bold text-sm text-slate-900 dark:text-white truncate max-w-full">
                  {item.name}
                </h3>
                <span className="text-[11px] text-slate-400">
                  {item.accuracy}% precisão
                </span>
                <div className="mt-2 py-1 px-3 bg-violet-50 dark:bg-violet-950/40 rounded-full font-mono font-bold text-xs text-violet-600 dark:text-violet-400">
                  {item.xp} XP
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar colega pelo nome..."
          className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
        />
      </div>

      {/* Virtualized Leaderboard List Container */}
      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 p-2 shadow-inner">
        <VirtualList<StudentLeaderboardEntry>
          items={displayLeaderboard}
          itemHeight={64}
          height={420}
          renderItem={renderLeaderboardRow}
          getItemKey={getItemKey}
          overscan={5}
          emptyMessage="Nenhum estudante encontrado no ranking."
        />
      </div>

    </div>
  );
});
