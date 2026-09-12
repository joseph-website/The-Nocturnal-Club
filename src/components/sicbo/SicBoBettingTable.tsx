import React from 'react';
import { SicBoBetItem, SicBoBetType } from '../../types/sicbo';
import { TOTAL_PAYOUT_RATIOS } from '../../utils/sicbo';
import { sound } from '../../utils/audio';
import { Dice } from './Dice';
import { CasinoChip } from '../common/CasinoChip';
import { renderBetChipBadge } from '../common/TableBetsOverlay';
import { Layers, Zap } from 'lucide-react';

interface SicBoBettingTableProps {
  currentBets: SicBoBetItem[];
  selectedChip: number;
  onPlaceBet: (type: SicBoBetType, label: string, payoutRatioText: string) => void;
  onRemoveBetSpot: (id: string) => void;
  disabled: boolean;
}

export const SicBoBettingTable: React.FC<SicBoBettingTableProps> = ({
  currentBets,
  onPlaceBet,
  onRemoveBetSpot,
  disabled,
}) => {
  const getBetAmount = (id: string): number => {
    const found = currentBets.find((b) => b.id === id);
    return found ? found.amount : 0;
  };

  const handleCellClick = (
    e: React.MouseEvent,
    type: SicBoBetType,
    id: string,
    label: string,
    payoutRatioText: string
  ) => {
    e.preventDefault();
    if (disabled) return;
    if (e.button === 2) {
      // Right click to clear bet spot
      if (getBetAmount(id) > 0) {
        sound.playClick();
        onRemoveBetSpot(id);
      }
      return;
    }
    sound.playChip();
    onPlaceBet(type, label, payoutRatioText);
  };

  const handleContextMenu = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    if (disabled) return;
    if (getBetAmount(id) > 0) {
      sound.playClick();
      onRemoveBetSpot(id);
    }
  };

  const renderChip = (amount: number) => {
    return renderBetChipBadge(amount, {
      size: 'xs',
      positionClass: 'absolute z-20 -top-2.5 -right-2 pointer-events-none drop-shadow-md',
      showLabel: true,
    });
  };

  return (
    <div className="w-full flex flex-col gap-1.5 p-2 rounded-2xl bg-gradient-to-b from-[#0e121a] to-[#07090e] border-2 border-amber-500/30 shadow-2xl backdrop-blur select-none">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-stone-800 pb-1">
        <div className="flex items-center gap-1.5 font-bold text-amber-300 text-xs sm:text-sm">
          <Layers className="w-4 h-4 text-amber-400" />
          <span>骰寶下注盤 (SIC BO FELT TABLE)</span>
        </div>
        <span className="text-xs text-stone-400 font-mono">
          左鍵下注 &bull; 右鍵退注
        </span>
      </div>

      {/* ================= 1. BIG / SMALL & ODD / EVEN ================= */}
      <div className="grid grid-cols-4 gap-1.5">
        {/* 小 (Small 4-10) */}
        {(() => {
          const id = 'bet-small';
          const amount = getBetAmount(id);
          return (
            <button
              id={id}
              disabled={disabled}
              onClick={(e) => handleCellClick(e, 'small', id, '小 (4-10)', '1:1')}
              onContextMenu={(e) => handleContextMenu(e, id)}
              className={`bet-cell bet-option relative min-h-[58px] py-2 px-1.5 rounded-xl border-2 transition-all flex flex-col items-center justify-center bg-gradient-to-b from-blue-900/50 to-blue-950/80 hover:from-blue-800/70 hover:to-blue-900/90 border-blue-500/50 text-blue-100 shadow-md ${
                amount > 0 ? 'ring-2 ring-amber-400 font-black border-amber-400' : ''
              } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-95'}`}
            >
              <span className="text-sm sm:text-base font-black tracking-wider text-blue-300">
                小 (SMALL)
              </span>
              <span className="text-xs text-blue-200/80 font-bold font-mono">4 ~ 10 點</span>
              <span className="text-xs sm:text-sm text-amber-300 font-black">1:1</span>
              {renderChip(amount)}
            </button>
          );
        })()}

        {/* 單 (ODD) */}
        {(() => {
          const id = 'bet-odd';
          const amount = getBetAmount(id);
          return (
            <button
              id={id}
              disabled={disabled}
              onClick={(e) => handleCellClick(e, 'odd', id, '單 (ODD)', '1:1')}
              onContextMenu={(e) => handleContextMenu(e, id)}
              className={`bet-cell bet-option relative min-h-[58px] py-2 px-1.5 rounded-xl border-2 transition-all flex flex-col items-center justify-center bg-stone-900/90 hover:bg-stone-800 border-purple-500/40 text-purple-200 shadow-md ${
                amount > 0 ? 'ring-2 ring-amber-400 font-black border-amber-400' : ''
              } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-95'}`}
            >
              <span className="text-sm sm:text-base font-black tracking-wider text-purple-300">
                單 (ODD)
              </span>
              <span className="text-xs text-stone-300 font-bold font-mono">奇數點</span>
              <span className="text-xs sm:text-sm text-amber-300 font-black">1:1</span>
              {renderChip(amount)}
            </button>
          );
        })()}

        {/* 雙 (EVEN) */}
        {(() => {
          const id = 'bet-even';
          const amount = getBetAmount(id);
          return (
            <button
              id={id}
              disabled={disabled}
              onClick={(e) => handleCellClick(e, 'even', id, '雙 (EVEN)', '1:1')}
              onContextMenu={(e) => handleContextMenu(e, id)}
              className={`bet-cell bet-option relative min-h-[58px] py-2 px-1.5 rounded-xl border-2 transition-all flex flex-col items-center justify-center bg-stone-900/90 hover:bg-stone-800 border-emerald-500/40 text-emerald-200 shadow-md ${
                amount > 0 ? 'ring-2 ring-amber-400 font-black border-amber-400' : ''
              } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-95'}`}
            >
              <span className="text-sm sm:text-base font-black tracking-wider text-emerald-300">
                雙 (EVEN)
              </span>
              <span className="text-xs text-stone-300 font-bold font-mono">偶數點</span>
              <span className="text-xs sm:text-sm text-amber-300 font-black">1:1</span>
              {renderChip(amount)}
            </button>
          );
        })()}

        {/* 大 (Big 11-17) */}
        {(() => {
          const id = 'bet-big';
          const amount = getBetAmount(id);
          return (
            <button
              id={id}
              disabled={disabled}
              onClick={(e) => handleCellClick(e, 'big', id, '大 (11-17)', '1:1')}
              onContextMenu={(e) => handleContextMenu(e, id)}
              className={`bet-cell bet-option relative min-h-[58px] py-2 px-1.5 rounded-xl border-2 transition-all flex flex-col items-center justify-center bg-gradient-to-b from-amber-900/50 to-amber-950/80 hover:from-amber-800/70 hover:to-amber-900/90 border-amber-500/50 text-amber-100 shadow-md ${
                amount > 0 ? 'ring-2 ring-amber-400 font-black border-amber-400' : ''
              } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-95'}`}
            >
              <span className="text-sm sm:text-base font-black tracking-wider text-amber-300">
                大 (BIG)
              </span>
              <span className="text-xs text-amber-200/80 font-bold font-mono">11 ~ 17 點</span>
              <span className="text-xs sm:text-sm text-amber-300 font-black">1:1</span>
              {renderChip(amount)}
            </button>
          );
        })()}
      </div>

      {/* ================= 2. SINGLE DICE NUMBER SECTION (1~6) ================= */}
      <div className="flex flex-col gap-0.5">
        <div className="flex items-center justify-between text-xs font-bold text-amber-300">
          <span>單骰點數注 (SINGLE DICE 1~6)</span>
          <span className="text-xs text-stone-400 font-mono">
            1顆 1:1 &bull; 2顆 1:2 &bull; 3顆 1:3
          </span>
        </div>

        <div className="grid grid-cols-6 gap-1">
          {[1, 2, 3, 4, 5, 6].map((num) => {
            const id = `single_${num}`;
            const amount = getBetAmount(id);
            return (
              <button
                key={id}
                id={id}
                disabled={disabled}
                onClick={(e) =>
                  handleCellClick(
                    e,
                    `single_${num}` as SicBoBetType,
                    id,
                    `單骰 ${num} 點`,
                    '1:1 ~ 1:3'
                  )
                }
                onContextMenu={(e) => handleContextMenu(e, id)}
                className={`bet-cell relative min-h-[64px] py-1.5 px-1 rounded-xl border flex flex-col items-center justify-center gap-0.5 transition-all bg-gradient-to-b from-stone-900 to-stone-950 hover:from-stone-800 hover:to-stone-900 border-amber-500/30 text-stone-200 shadow ${
                  amount > 0 ? 'ring-2 ring-amber-400 font-black border-amber-400' : ''
                } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-95'}`}
              >
                <Dice value={num} size="sm" />
                <span className="font-mono font-black text-xs sm:text-sm text-amber-300">
                  {num} 點
                </span>
                {renderChip(amount)}
              </button>
            );
          })}
        </div>
      </div>

      {/* ================= 3. ANY TRIPLE (全圍) & TOTAL SUMS ================= */}
      <div className="flex flex-col gap-0.5">
        <div className="flex items-center justify-between text-xs font-bold text-amber-300">
          <span>全圍 (ANY TRIPLE) & 點數總和 (SUM TOTALS)</span>
          <span className="text-xs text-stone-400 font-mono">特別彩金</span>
        </div>

        {/* Any Triple Big Banner */}
        {(() => {
          const id = 'any_triple';
          const amount = getBetAmount(id);
          return (
            <button
              id={id}
              disabled={disabled}
              onClick={(e) =>
                handleCellClick(
                  e,
                  'any_triple',
                  id,
                  '全圍 (任意三同號)',
                  '1:24'
                )
              }
              onContextMenu={(e) => handleContextMenu(e, id)}
              className={`bet-cell relative w-full min-h-[40px] py-1.5 px-3 rounded-xl border transition-all flex items-center justify-between bg-gradient-to-r from-amber-950/80 via-yellow-900/80 to-amber-950/80 hover:from-amber-900 hover:to-yellow-800 border-amber-400/60 text-amber-100 shadow-md ${
                amount > 0 ? 'ring-2 ring-amber-400 font-black' : ''
              } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-98'}`}
            >
              <div className="flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-400" />
                <span className="text-xs sm:text-sm font-black text-amber-300">
                  全圍 / 豹子 (ANY TRIPLE 111~666)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-black text-xs sm:text-sm text-amber-400">
                  賠率 1:24
                </span>
                {renderChip(amount)}
              </div>
            </button>
          );
        })()}

        {/* Total Points 4 ~ 17 Grid (14 choices) */}
        <div className="grid grid-cols-7 gap-1 mt-0.5">
          {[4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17].map((sumVal) => {
            const id = `total_${sumVal}`;
            const amount = getBetAmount(id);
            const ratio = TOTAL_PAYOUT_RATIOS[sumVal] || 6;

            return (
              <button
                key={id}
                id={id}
                disabled={disabled}
                onClick={(e) =>
                  handleCellClick(
                    e,
                    `total_${sumVal}` as SicBoBetType,
                    id,
                    `總點數 ${sumVal}`,
                    `1:${ratio}`
                  )
                }
                onContextMenu={(e) => handleContextMenu(e, id)}
                className={`bet-cell relative min-h-[38px] py-1 px-0.5 rounded-lg border flex flex-col items-center justify-center transition-all bg-stone-900/90 hover:bg-stone-800 border-stone-800 text-stone-300 ${
                  amount > 0 ? 'ring-2 ring-amber-400 font-black border-amber-400' : ''
                } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-95'}`}
              >
                <span className="font-mono font-black text-xs sm:text-sm text-stone-100 leading-none">
                  {sumVal}
                </span>
                <span className="text-[9px] sm:text-[10px] font-mono font-bold text-amber-400 leading-none mt-0.5">
                  1:{ratio}
                </span>
                {renderChip(amount)}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
