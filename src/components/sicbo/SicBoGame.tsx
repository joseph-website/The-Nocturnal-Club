import React, { useState, useEffect, useCallback } from 'react';
import {
  SicBoBetItem,
  SicBoBetType,
  SicBoRollResult,
  SicBoStats,
} from '../../types/sicbo';
import { rollDice, calculateSicBoResult } from '../../utils/sicbo';
import { sound } from '../../utils/audio';
import { toastService } from '../../utils/toast';
import { checkHouseBonus, notifyHouseBonus, isAuraActive } from '../../utils/aura';
import { recordCareerRound } from '../../utils/careerStats';
import { isTurboMode } from '../../utils/turbo';
import { DiceCup } from './DiceCup';
import { SicBoBettingTable } from './SicBoBettingTable';
import { WinToast, WinToastData } from '../common/WinToast';
import { TableBetsOverlay } from '../common/TableBetsOverlay';
import { CasinoChip } from '../common/CasinoChip';
import { ToastAuraIndicator } from '../common/ToastAuraIndicator';
import {
  Dices,
  Trophy,
  History,
  TrendingUp,
  Flame,
  XCircle,
  Copy,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Shield,
  Layers,
  BarChart3,
} from 'lucide-react';
import { ChipSelector } from '../ChipSelector';

interface SicBoGameProps {
  balance: number;
  onUpdateBalance: (newBalance: number) => void;
  soundEnabled: boolean;
}

const STORAGE_KEY_SICBO_STATS = 'casino_sicbo_stats_v1';
const CHIP_VALUES = [100, 500, 1000, 5000, 10000, 25000];

export const SicBoGame: React.FC<SicBoGameProps> = ({
  balance,
  onUpdateBalance,
}) => {
  // Current 3 dice
  const [dice, setDice] = useState<[number, number, number]>([4, 5, 6]);

  // Dice Cup shaker state
  const [isShaking, setIsShaking] = useState<boolean>(false);
  const [isCovered, setIsCovered] = useState<boolean>(false);

  // Active bets placed on felt table
  const [currentBets, setCurrentBets] = useState<SicBoBetItem[]>([]);
  const [lastBets, setLastBets] = useState<SicBoBetItem[]>([]);

  // Selected chip value
  const [selectedChip, setSelectedChip] = useState<number>(1000);

  // Mobile layout state: tab selection between cup shaker view and betting table
  const [sicboMobileTab, setSicboMobileTab] = useState<'cup' | 'table'>('cup');
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);

  // Last round result
  const [lastResult, setLastResult] = useState<SicBoRollResult | null>(null);

  // History road
  const [history, setHistory] = useState<SicBoRollResult[]>([]);

  // Auto-fading Win Toast
  const [winToast, setWinToast] = useState<WinToastData | null>(null);

  // Toast Aura state
  const [auraActive, setAuraActive] = useState<boolean>(() => isAuraActive());
  useEffect(() => {
    const handleAura = () => setAuraActive(isAuraActive());
    window.addEventListener('casino_aura_updated', handleAura);
    return () => window.removeEventListener('casino_aura_updated', handleAura);
  }, []);

  // Stats
  const [stats, setStats] = useState<SicBoStats>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_SICBO_STATS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // ignore
      }
    }
    return {
      rolls: 0,
      wins: 0,
      totalBet: 0,
      totalWon: 0,
      triplesCount: 0,
      highestWin: 0,
    };
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_SICBO_STATS, JSON.stringify(stats));
  }, [stats]);

  // Listen to global casino full reset
  useEffect(() => {
    const handleFullReset = () => {
      setStats({
        rolls: 0,
        wins: 0,
        totalBet: 0,
        totalWon: 0,
        triplesCount: 0,
        highestWin: 0,
      });
      setHistory([]);
      setCurrentBets([]);
      setLastBets([]);
      setLastResult(null);
      setIsShaking(false);
      setIsCovered(false);
    };
    window.addEventListener('casino_full_reset', handleFullReset);
    return () => {
      window.removeEventListener('casino_full_reset', handleFullReset);
    };
  }, []);

  const totalBetAmount = currentBets.reduce((acc, b) => acc + b.amount, 0);

  // Add or increment bet on a specific betting spot
  const handlePlaceBet = (
    type: SicBoBetType,
    label: string,
    payoutRatioText: string
  ) => {
    if (isShaking) return;

    if (balance < selectedChip) {
      sound.playLoss();
      toastService.warn('籌碼餘額不足，請選擇較低面額或重置籌碼！');
      return;
    }

    // Deduct chip from balance immediately
    onUpdateBalance(balance - selectedChip);

    const betId = `bet-${type}`;
    setCurrentBets((prev) => {
      const existing = prev.find((b) => b.id === betId);
      if (existing) {
        return prev.map((b) =>
          b.id === betId ? { ...b, amount: b.amount + selectedChip } : b
        );
      } else {
        return [
          ...prev,
          {
            id: betId,
            type,
            amount: selectedChip,
            label,
            payoutRatioText,
          },
        ];
      }
    });
  };

  // Remove bet on single spot (refund to user balance)
  const handleRemoveBetSpot = (id: string) => {
    if (isShaking) return;
    const betToRemove = currentBets.find((b) => b.id === id);
    if (betToRemove) {
      onUpdateBalance(balance + betToRemove.amount);
      setCurrentBets((prev) => prev.filter((b) => b.id !== id));
    }
  };

  // Clear all bets
  const handleClearBets = () => {
    if (isShaking || currentBets.length === 0) return;
    sound.playClick();
    onUpdateBalance(balance + totalBetAmount);
    setCurrentBets([]);
  };

  // Double all bets
  const handleDoubleBets = () => {
    if (isShaking || currentBets.length === 0) return;
    if (balance < totalBetAmount) {
      sound.playLoss();
      toastService.warn('籌碼餘額不足以進行雙倍加注！');
      return;
    }
    sound.playChip();
    onUpdateBalance(balance - totalBetAmount);
    setCurrentBets((prev) =>
      prev.map((b) => ({ ...b, amount: b.amount * 2 }))
    );
  };

  // Rebet previous round's bets
  const handleRebet = () => {
    if (isShaking || lastBets.length === 0) return;
    const needed = lastBets.reduce((acc, b) => acc + b.amount, 0);
    if (balance < needed) {
      sound.playLoss();
      toastService.warn('籌碼餘額不足以重複上一局下注！');
      return;
    }
    sound.playChip();
    onUpdateBalance(balance - needed);
    setCurrentBets(lastBets);
  };

  // Roll Dice Action (2-second Shake sequence)
  const handleRollDice = useCallback(() => {
    if (isShaking) return;
    if (currentBets.length === 0) {
      toastService.warn('請先在骰寶下注盤上下注（例如：大、小、單、雙或單骰號碼）！');
      return;
    }

    // Save bets to lastBets
    setLastBets(currentBets);
    setLastResult(null);

    // Begin 2.5-second Shake sequence
    setIsCovered(true);
    setIsShaking(true);
    sound.playDiceShake();

    // Shake animation then reveal (Turbo: 800ms; Standard: 2500ms)
    const shakeDuration = isTurboMode() ? 800 : 2500;
    setTimeout(() => {
      const finalDice = rollDice();
      setDice(finalDice);
      setIsShaking(false);
      setIsCovered(false); // Uncover the cup lid
      sound.playDiceReveal();

      // Settle bets
      const result = calculateSicBoResult(finalDice, currentBets);
      setLastResult(result);

      if (result.totalWon > 0) {
        // Credit win amount back to balance & check house bonus
        let finalPayout = result.totalWon;
        let bonusWon = 0;
        const bonus = checkHouseBonus(result.totalBet);
        if (bonus.triggered) {
          bonusWon = bonus.bonusAmount;
          finalPayout += bonusWon;
          notifyHouseBonus(bonus, '骰寶');
        }
        onUpdateBalance(balance + finalPayout);

        // Show 2-second Auto-fading Win Toast inside #game-visual-area
        const isBigProfit = result.netProfit >= 5000 || result.isTriple;
        const mainWonDesc =
          result.winningBets.length > 0
            ? result.winningBets.map((wb) => `${wb.label} (+$${wb.payout.toLocaleString()})`).join(' · ')
            : undefined;

        const combinedSubtitle = mainWonDesc
          ? `${mainWonDesc}${bonusWon > 0 ? ` · 莊家加碼 +$${bonusWon.toLocaleString()}` : ''}`
          : bonusWon > 0
          ? `莊家加碼 +$${bonusWon.toLocaleString()}`
          : undefined;

        setWinToast({
          id: Date.now(),
          title: result.isTriple
            ? '🔥 圍骰通吃大獎！'
            : result.winningBets.length > 1
            ? '🎉 骰寶多項連中！'
            : '🎉 恭喜中獎！',
          amount: finalPayout,
          extraBonusAmount: bonusWon > 0 ? bonusWon : undefined,
          subtitle: combinedSubtitle,
          isJackpot: isBigProfit,
        });

        if (isBigProfit) {
          sound.playBigWin();
        } else {
          sound.playWin();
        }
      } else {
        sound.playLoss();
      }

      // Update history & stats
      setHistory((prev) => [result, ...prev.slice(0, 19)]);
      setStats((prev) => ({
        rolls: prev.rolls + 1,
        wins: result.totalWon > 0 ? prev.wins + 1 : prev.wins,
        totalBet: prev.totalBet + result.totalBet,
        totalWon: prev.totalWon + result.totalWon,
        triplesCount: result.isTriple ? prev.triplesCount + 1 : prev.triplesCount,
        highestWin: Math.max(prev.highestWin, result.totalWon),
      }));

      // Record career stats and dispatch round event
      const safeMultiplier = result.totalBet > 0 ? Number((result.totalWon / result.totalBet).toFixed(2)) : 1;
      recordCareerRound({
        gameId: 'sicbo',
        betAmount: result.totalBet,
        winAmount: result.totalWon,
        multiplier: safeMultiplier,
      });

      // Clear current bets for next round
      setCurrentBets([]);
    }, shakeDuration);
  }, [balance, currentBets, isShaking, onUpdateBalance]);

  // Keyboard shortcut Space to shake/roll, C to clear, X to double, R to rebet
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }
      if (e.code === 'Space') {
        e.preventDefault();
        if (!isShaking && currentBets.length > 0) {
          handleRollDice();
        }
      } else if (e.key.toUpperCase() === 'C') {
        e.preventDefault();
        if (!isShaking && currentBets.length > 0) {
          handleClearBets();
        }
      } else if (e.key.toUpperCase() === 'X') {
        e.preventDefault();
        if (!isShaking && currentBets.length > 0) {
          handleDoubleBets();
        }
      } else if (e.key.toUpperCase() === 'R') {
        e.preventDefault();
        if (!isShaking && lastBets.length > 0) {
          handleRebet();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isShaking, currentBets, lastBets, handleRollDice, handleClearBets, handleDoubleBets, handleRebet]);

  const currentSum = dice[0] + dice[1] + dice[2];
  const isTriple = dice[0] === dice[1] && dice[1] === dice[2];
  const isSmall = currentSum >= 4 && currentSum <= 10 && !isTriple;
  const isBig = currentSum >= 11 && currentSum <= 17 && !isTriple;
  const isOdd = currentSum % 2 !== 0 && !isTriple;
  const isEven = currentSum % 2 === 0 && !isTriple;

  return (
    <div className="w-full h-full flex flex-col lg:flex-row gap-2 lg:gap-3 overflow-hidden select-none animate-fade-in relative">
      {/* MOBILE TAB CONTROLS (手機版頂部切換鈕) */}
      <div className="lg:hidden flex items-center justify-between p-1 bg-stone-900/90 rounded-xl border border-stone-800 shrink-0 gap-1">
        <div className="flex items-center gap-1 flex-1">
          <button
            id="btn-sicbo-mobile-tab-cup"
            onClick={() => setSicboMobileTab('cup')}
            className={`flex-1 py-1.5 px-2 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              sicboMobileTab === 'cup'
                ? 'bg-amber-500 text-stone-950 shadow-md font-black'
                : 'text-stone-400 hover:text-stone-200 bg-stone-950/60'
            }`}
          >
            <Dices className="w-3.5 h-3.5" />
            <span>搖骰盅 (CUP)</span>
          </button>
          <button
            id="btn-sicbo-mobile-tab-table"
            onClick={() => setSicboMobileTab('table')}
            className={`flex-1 py-1.5 px-2 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all relative cursor-pointer ${
              sicboMobileTab === 'table'
                ? 'bg-amber-500 text-stone-950 shadow-md font-black'
                : 'text-stone-400 hover:text-stone-200 bg-stone-950/60'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>下注檯面 (TABLE)</span>
            {currentBets.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-black">
                {currentBets.length}
              </span>
            )}
          </button>
        </div>

        <button
          onClick={() => setIsDrawerOpen(true)}
          className="py-1.5 px-2.5 rounded-lg bg-stone-950 border border-stone-700 text-stone-300 hover:text-amber-400 text-xs font-bold flex items-center gap-1 cursor-pointer shrink-0 active:scale-95"
          title="開啟籌碼安全選單"
        >
          <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden sm:inline">籌碼選單</span>
          <span className="font-mono text-amber-300">${selectedChip >= 1000 ? `${selectedChip / 1000}k` : selectedChip}</span>
        </button>
      </div>

      {/* LEFT COLUMN: Dice Cup Shaker Stage & History Road */}
      <div
        id="game-visual-area"
        className={`w-full lg:w-1/2 h-full flex-col justify-between rounded-2xl bg-gradient-to-b from-[#121620] via-[#0d1017] to-[#08090d] border-3 border-amber-500/80 shadow-[0_0_40px_rgba(0,0,0,0.9)] p-2.5 sm:p-3 relative overflow-hidden transition-all duration-700 ${
          sicboMobileTab === 'table' ? 'hidden lg:flex' : 'flex'
        }`}
      >
        {/* Floating 2-Second Auto-Fading Win Toast located internally inside #game-visual-area */}
        <WinToast toast={winToast} onDismiss={() => setWinToast(null)} />

        {/* Background corner ornaments */}
        <div className="absolute top-2 left-2 w-8 h-8 border-t-2 border-l-2 border-amber-400/30 rounded-tl-xl pointer-events-none" />
        <div className="absolute top-2 right-2 w-8 h-8 border-t-2 border-r-2 border-amber-400/30 rounded-tr-xl pointer-events-none" />
        <div className="absolute bottom-2 left-2 w-8 h-8 border-b-2 border-l-2 border-amber-400/30 rounded-bl-xl pointer-events-none" />
        <div className="absolute bottom-2 right-2 w-8 h-8 border-b-2 border-r-2 border-amber-400/30 rounded-br-xl pointer-events-none" />

        {/* 1. TOP HEADER STATUS */}
        <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-stone-950/90 border border-amber-500/40">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-amber-300">
              <Dices className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="text-xs sm:text-sm font-black font-serif tracking-widest text-amber-300">
                ROYAL SIC BO (富貴骰寶)
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {totalBetAmount > 0 && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-950/80 border border-amber-400/80 shadow-[0_0_10px_rgba(245,158,11,0.4)] animate-in zoom-in-95">
                <CasinoChip amount={totalBetAmount} size="xs" />
                <div className="flex flex-col items-start leading-tight">
                  <span className="text-[8px] text-amber-300 font-bold uppercase">本局下注總額</span>
                  <span className="font-mono font-black text-xs text-amber-300">
                    ${totalBetAmount.toLocaleString()} ({currentBets.length}區)
                  </span>
                </div>
              </div>
            )}

            <div className="flex flex-col items-end">
              <span className="text-[9px] text-stone-400 font-bold uppercase">
                當前可用籌碼
              </span>
              <span className="font-mono font-black text-amber-300 text-xs sm:text-sm">
                ${balance.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* 2. CENTER DICE CUP SHAKER STAGE */}
        <div className="my-auto flex flex-col items-center justify-center py-2">
          <DiceCup
            dice={dice}
            isShaking={isShaking}
            isCovered={isCovered}
            sum={currentSum}
            isSmall={isSmall}
            isBig={isBig}
            isOdd={isOdd}
            isEven={isEven}
            isTriple={isTriple}
          />
        </div>

        {/* 3. MOBILE QUICK BETTING STRIP (手機專屬快捷下注與操作條) */}
        <div className="lg:hidden flex flex-col gap-1.5 my-1 p-2 rounded-xl bg-black/85 border border-amber-500/30">
          <div className="flex items-center justify-between text-[11px] font-bold text-stone-300">
            <span className="flex items-center gap-1 text-amber-400">
              <Flame className="w-3.5 h-3.5" />
              <span>快速下注區 (點擊即下注 ${selectedChip.toLocaleString()})</span>
            </span>
            <button
              onClick={() => setSicboMobileTab('table')}
              className="text-[10px] text-amber-300 hover:underline flex items-center gap-0.5"
            >
              <span>完整檯面</span>
              <ChevronUp className="w-3 h-3 rotate-90" />
            </button>
          </div>

          <div className="grid grid-cols-5 gap-1 text-center">
            <button
              disabled={isShaking}
              onClick={() => {
                sound.playChip();
                handlePlaceBet('big', '大 (11-17)', '1:1');
              }}
              className="py-1.5 px-1 rounded-lg bg-stone-900 border border-amber-500/40 hover:bg-amber-950/60 active:scale-95 disabled:opacity-50 flex flex-col items-center justify-center"
            >
              <span className="font-black text-amber-300 text-xs">大 (Big)</span>
              <span className="text-[9px] text-stone-400 font-mono">1:1</span>
            </button>

            <button
              disabled={isShaking}
              onClick={() => {
                sound.playChip();
                handlePlaceBet('small', '小 (4-10)', '1:1');
              }}
              className="py-1.5 px-1 rounded-lg bg-stone-900 border border-blue-500/40 hover:bg-blue-950/60 active:scale-95 disabled:opacity-50 flex flex-col items-center justify-center"
            >
              <span className="font-black text-blue-300 text-xs">小 (Small)</span>
              <span className="text-[9px] text-stone-400 font-mono">1:1</span>
            </button>

            <button
              disabled={isShaking}
              onClick={() => {
                sound.playChip();
                handlePlaceBet('odd', '單數', '1:1');
              }}
              className="py-1.5 px-1 rounded-lg bg-stone-900 border border-stone-700 hover:bg-stone-800 active:scale-95 disabled:opacity-50 flex flex-col items-center justify-center"
            >
              <span className="font-black text-stone-200 text-xs">單 (Odd)</span>
              <span className="text-[9px] text-stone-400 font-mono">1:1</span>
            </button>

            <button
              disabled={isShaking}
              onClick={() => {
                sound.playChip();
                handlePlaceBet('even', '雙數', '1:1');
              }}
              className="py-1.5 px-1 rounded-lg bg-stone-900 border border-stone-700 hover:bg-stone-800 active:scale-95 disabled:opacity-50 flex flex-col items-center justify-center"
            >
              <span className="font-black text-stone-200 text-xs">雙 (Even)</span>
              <span className="text-[9px] text-stone-400 font-mono">1:1</span>
            </button>

            <button
              disabled={isShaking}
              onClick={() => {
                sound.playChip();
                handlePlaceBet('any_triple', '全圍 (任意圍骰)', '1:30');
              }}
              className="py-1.5 px-1 rounded-lg bg-stone-900 border border-rose-500/40 hover:bg-rose-950/60 active:scale-95 disabled:opacity-50 flex flex-col items-center justify-center"
            >
              <span className="font-black text-rose-300 text-xs">全圍</span>
              <span className="text-[9px] text-stone-400 font-mono">1:30</span>
            </button>
          </div>

          {/* Mobile Direct Roll Button */}
          <button
            id="btn-sicbo-mobile-roll"
            disabled={isShaking || currentBets.length === 0}
            onClick={handleRollDice}
            className={`w-full py-2.5 rounded-xl font-black text-sm tracking-wider uppercase shadow-lg transition-all flex items-center justify-center gap-1.5 ${
              isShaking
                ? 'bg-stone-800 text-amber-300 border border-amber-500/40 cursor-wait animate-pulse'
                : currentBets.length > 0
                ? 'bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 text-stone-950 shadow-[0_0_15px_rgba(245,158,11,0.6)] active:scale-98 cursor-pointer'
                : 'bg-stone-800 text-stone-500 border border-stone-700 cursor-not-allowed'
            }`}
          >
            <Dices className="w-4 h-4" />
            <span>
              {isShaking
                ? '🎲 搖骰中...'
                : currentBets.length > 0
                ? `搖骰開獎 ($${totalBetAmount.toLocaleString()})`
                : '請先快捷下注或進檯面'}
            </span>
          </button>
        </div>

        {/* 4. BOTTOM: RECENT ROADS / HISTORY ROAD (開獎紀錄路單) */}
        <div className="game-log flex flex-col gap-1 p-2 rounded-xl bg-black/75 border border-stone-800 shrink-0">
          <div className="flex items-center justify-between text-xs sm:text-sm font-bold text-stone-300">
            <div className="flex items-center gap-1.5 text-amber-300">
              <History className="w-4 h-4 text-amber-400" />
              <span>開獎歷史路單 (RECENT ROADS)</span>
            </div>
            <span className="text-xs font-mono text-stone-400 font-bold">
              近 {history.length} 局
            </span>
          </div>

          {/* Road Bead Matrix */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-1 px-0.5 max-w-full">
            {history.length === 0 ? (
              <div className="text-xs text-stone-400 py-1 font-mono">
                尚無開獎紀錄，請下注並點擊「開始搖骰」！
              </div>
            ) : (
              history.map((h, i) => (
                <div
                  key={i}
                  className={`flex flex-col items-center justify-center min-w-[42px] py-1 px-1.5 rounded-lg border text-xs font-mono shrink-0 shadow ${
                    h.isTriple
                      ? 'bg-rose-950/80 border-rose-500 text-rose-200'
                      : h.isBig
                      ? 'bg-amber-950/80 border-amber-500 text-amber-200'
                      : 'bg-blue-950/80 border-blue-500 text-blue-200'
                  }`}
                >
                  <span className="font-black text-sm leading-none">{h.sum}</span>
                  <span className="text-[10px] font-bold leading-none mt-1">
                    {h.isTriple ? '圍' : h.isBig ? '大' : '小'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Betting Table, Chip Selection, Action Buttons, Stats */}
      <div
        className={`w-full lg:w-1/2 h-full flex-col justify-between gap-1.5 overflow-hidden ${
          sicboMobileTab === 'cup' ? 'hidden lg:flex' : 'flex'
        }`}
      >
        {/* 1. INTERACTIVE BETTING FELT TABLE */}
        <SicBoBettingTable
          currentBets={currentBets}
          selectedChip={selectedChip}
          onPlaceBet={handlePlaceBet}
          onRemoveBetSpot={handleRemoveBetSpot}
          disabled={isShaking}
        />

        {/* 2. CHIP SELECTOR & ACTIONS BAR */}
        <div className="p-2 rounded-xl bg-[#0c0e15] border border-amber-500/20 shadow-xl flex flex-col gap-1.5 shrink-0">
          <div className="flex items-center justify-between text-xs sm:text-sm font-bold">
            <div className="flex items-center gap-1.5 text-stone-300">
              <Flame className="w-4 h-4 text-amber-400" />
              <span>選擇面額:</span>
            </div>
            <div className="flex items-center gap-2 font-mono">
              <span className="text-stone-400 text-xs">本局已下注:</span>
              <span className="text-amber-400 font-black text-sm sm:text-base">
                ${totalBetAmount.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Chip Buttons */}
          <div className="grid grid-cols-6 gap-1.5">
            {CHIP_VALUES.map((val) => {
              const isSelected = selectedChip === val;
              return (
                <button
                  key={val}
                  disabled={isShaking}
                  onClick={() => {
                    sound.playClick();
                    setSelectedChip(val);
                  }}
                  className={`chip-btn min-h-[38px] py-1.5 px-1 rounded-xl border font-mono font-bold text-sm sm:text-base transition-all cursor-pointer select-none flex items-center justify-center ${
                    isSelected
                      ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 border-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.6)] scale-105 font-black'
                      : 'bg-stone-900/90 text-stone-200 border-stone-800 hover:border-amber-500/40 hover:bg-stone-800'
                  } ${isShaking ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  ${val >= 1000 ? `${val / 1000}k` : val}
                </button>
              );
            })}
          </div>

          {/* Quick Bet Modifiers (Double, Clear, Rebet) */}
          <div className="flex items-center gap-1.5 mt-0.5">
            <button
              disabled={isShaking || currentBets.length === 0}
              onClick={handleClearBets}
              className="flex-1 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-300 border border-stone-700 text-xs sm:text-sm font-bold flex items-center justify-center gap-1 cursor-pointer disabled:opacity-40"
            >
              <XCircle className="w-4 h-4 text-rose-400" />
              <span>清空注金</span>
            </button>

            <button
              disabled={isShaking || currentBets.length === 0 || balance < totalBetAmount}
              onClick={handleDoubleBets}
              className="flex-1 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-300 border border-stone-700 text-xs sm:text-sm font-bold flex items-center justify-center gap-1 cursor-pointer disabled:opacity-40"
            >
              <TrendingUp className="w-4 h-4 text-amber-400" />
              <span>雙倍 2X</span>
            </button>

            <button
              disabled={isShaking || lastBets.length === 0}
              onClick={handleRebet}
              className="flex-1 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-300 border border-stone-700 text-xs sm:text-sm font-bold flex items-center justify-center gap-1 cursor-pointer disabled:opacity-40"
            >
              <Copy className="w-4 h-4 text-blue-400" />
              <span>同額續注</span>
            </button>
          </div>
        </div>

        {/* 3. PRIMARY ACTION: ROLL DICE (搖骰開獎) BUTTON */}
        <div className="p-2 rounded-xl bg-[#0c0e17] border border-amber-500/30 shadow-xl flex flex-col gap-1 shrink-0">
          <button
            id="btn-sicbo-roll"
            disabled={isShaking || currentBets.length === 0}
            onClick={handleRollDice}
            className={`w-full min-h-[50px] py-3 rounded-xl font-black text-base sm:text-lg tracking-wider uppercase shadow-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
              isShaking
                ? 'bg-stone-800 text-amber-300 border border-amber-500/40 cursor-wait animate-pulse'
                : currentBets.length > 0
                ? 'bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 shadow-[0_0_25px_rgba(245,158,11,0.6)] active:scale-[0.98]'
                : 'bg-stone-800 text-stone-500 border border-stone-700 cursor-not-allowed'
            }`}
          >
            <Dices className="w-5 h-5" />
            <span>
              {isShaking
                ? '🎲 3D 搖骰中 (2秒)...'
                : currentBets.length > 0
                ? `開始搖骰 (下注 $${totalBetAmount.toLocaleString()})`
                : '請先在盤上下注'}
            </span>
          </button>
        </div>

        {/* 4. SIC BO STATS SUMMARY CARD */}
        <div className="p-2 rounded-xl bg-[#0c0e14] border border-amber-500/20 shadow-xl flex flex-col gap-1 shrink-0">
          <div className="flex items-center justify-between border-b border-stone-800 pb-0.5">
            <div className="flex items-center gap-1 text-stone-300 font-bold text-xs">
              <Trophy className="w-3 h-3 text-amber-400" />
              <span>骰寶戰績 (STATS)</span>
            </div>
            <button
              onClick={() => {
                setStats({
                  rolls: 0,
                  wins: 0,
                  totalBet: 0,
                  totalWon: 0,
                  triplesCount: 0,
                  highestWin: 0,
                });
              }}
              className="text-[10px] text-stone-500 hover:text-stone-300 transition-colors"
            >
              清空
            </button>
          </div>

          <div className="grid grid-cols-3 gap-1 text-center text-xs">
            <div className="p-1 rounded-lg bg-stone-900/80 border border-stone-800">
              <div className="text-[9px] text-stone-400">總局數</div>
              <div className="font-mono font-black text-xs text-stone-100">{stats.rolls}</div>
            </div>
            <div className="p-1 rounded-lg bg-stone-900/80 border border-stone-800">
              <div className="text-[9px] text-emerald-400">獲勝局數</div>
              <div className="font-mono font-black text-xs text-emerald-400">{stats.wins}</div>
            </div>
            <div className="p-1 rounded-lg bg-stone-900/80 border border-stone-800">
              <div className="text-[9px] text-amber-400">開出全圍</div>
              <div className="font-mono font-black text-xs text-amber-400">{stats.triplesCount}</div>
            </div>
          </div>
        </div>
      </div>

      {/* MOBILE SAFE-MODE SLIDE-UP DRAWER (手機籌碼安全模式選單) */}
      {isDrawerOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-h-[85vh] rounded-t-3xl bg-[#0c0e14] border-t-2 border-amber-500/60 p-4 shadow-2xl flex flex-col gap-3 overflow-hidden animate-in slide-in-from-bottom duration-300">
            {/* Drawer Header */}
            <div className="flex items-center justify-between pb-3 border-b border-stone-800 shrink-0">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-amber-400" />
                <span className="font-bold text-sm text-stone-200">骰寶籌碼與分析選單</span>
                <span className="text-xs font-mono text-amber-400">
                  當前下注: ${totalBetAmount.toLocaleString()}
                </span>
              </div>
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="p-1.5 rounded-full bg-stone-900 text-stone-400 hover:text-white cursor-pointer"
              >
                <ChevronDown className="w-5 h-5" />
              </button>
            </div>

            {/* Safe Mode Chip Selector */}
            <div className="flex-1 overflow-y-auto flex flex-col gap-3 py-1">
              <div className="rounded-xl bg-[#080a0f] border border-amber-500/30 p-3 shadow-xl flex flex-col gap-2.5">
                <div className="flex items-center justify-between text-xs font-bold text-stone-300 pb-2 border-b border-stone-800">
                  <span className="flex items-center gap-1.5 text-amber-300">
                    <Shield className="w-4 h-4 text-amber-400" />
                    <span>安全防誤觸模式已啟用</span>
                  </span>
                  <span className="font-mono text-emerald-400 font-bold">
                    目前籌碼: ${selectedChip.toLocaleString()}
                  </span>
                </div>

                <p className="text-[11px] text-stone-400 leading-relaxed">
                  此選單僅供切換籌碼幣值與查看賠率統計。選定欲使用的籌碼面額後，請點擊下方「確定退出」按鈕，返回檯面即可點擊下注區進行押注與搖骰。
                </p>

                <div className="w-full">
                  <ChipSelector
                    selectedChip={selectedChip}
                    onSelectChip={(val) => {
                      setSelectedChip(val);
                      sound.playChip();
                    }}
                    disabled={isShaking}
                    balance={balance}
                  />
                </div>

                <button
                  id="btn-sicbo-drawer-confirm"
                  onClick={() => {
                    sound.playChip();
                    setIsDrawerOpen(false);
                    toastService.info(`已設定骰寶籌碼面額：$${selectedChip.toLocaleString()}`);
                  }}
                  className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-black text-sm sm:text-base tracking-wide shadow-[0_0_20px_rgba(245,158,11,0.5)] active:scale-98 flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  <CheckCircle2 className="w-5 h-5 text-stone-950" />
                  <span>確定退出 (使用 ${selectedChip.toLocaleString()} 籌碼)</span>
                </button>
              </div>

              {/* Statistics & Probabilities in Drawer */}
              <div className="p-3 rounded-xl bg-[#080a0f] border border-stone-800 flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs font-bold text-stone-300">
                  <span className="flex items-center gap-1.5 text-amber-400">
                    <BarChart3 className="w-4 h-4" />
                    <span>賠率速查表</span>
                  </span>
                  <span className="text-[10px] text-stone-400">公平莊家賠率</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 rounded-lg bg-stone-900/90 border border-stone-800">
                    <span className="text-stone-400">大 / 小 / 單 / 雙</span>
                    <div className="font-mono font-bold text-amber-300 text-sm">1 : 1 (圍骰通殺)</div>
                  </div>
                  <div className="p-2 rounded-lg bg-stone-900/90 border border-stone-800">
                    <span className="text-stone-400">任意全圍 (Any Triple)</span>
                    <div className="font-mono font-bold text-amber-300 text-sm">1 : 30</div>
                  </div>
                  <div className="p-2 rounded-lg bg-stone-900/90 border border-stone-800">
                    <span className="text-stone-400">單骰 (Single 1~6)</span>
                    <div className="font-mono font-bold text-amber-300 text-sm">1:1 / 2:1 / 3:1</div>
                  </div>
                  <div className="p-2 rounded-lg bg-stone-900/90 border border-stone-800">
                    <span className="text-stone-400">指定點數總和</span>
                    <div className="font-mono font-bold text-amber-300 text-sm">1:6 至 1:60</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
