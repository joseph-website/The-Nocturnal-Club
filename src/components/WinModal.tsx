import React, { useEffect } from 'react';
import { SpinResult } from '../types/roulette';
import { getNumberColor } from '../utils/constants';
import { sound } from '../utils/audio';
import { Trophy, Frown, Sparkles, X } from 'lucide-react';

interface WinModalProps {
  result: SpinResult | null;
  onClose: () => void;
}

export const WinModal: React.FC<WinModalProps> = ({ result, onClose }) => {
  useEffect(() => {
    if (!result) return;
    if (result.totalWon > 0) {
      if (result.netProfit >= 5000) {
        sound.playBigWin();
      } else {
        sound.playWin();
      }
    } else {
      sound.playLoss();
    }
  }, [result]);

  if (!result) return null;

  const isWin = result.totalWon > 0;
  const isZero = result.number === 0;
  const color = getNumberColor(result.number);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md p-6 rounded-2xl bg-gradient-to-b from-[#161925] to-[#0d0e15] border-2 border-amber-500/40 shadow-[0_0_50px_rgba(245,158,11,0.3)] text-stone-100 flex flex-col items-center text-center">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3.5 right-3.5 p-1.5 rounded-full text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Big Number Badge */}
        <div className="relative my-2">
          <div
            className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full flex flex-col items-center justify-center border-4 shadow-2xl ${
              color === 'green'
                ? 'bg-emerald-600 border-emerald-300 shadow-[0_0_30px_rgba(16,185,129,0.7)]'
                : color === 'red'
                ? 'bg-rose-600 border-rose-300 shadow-[0_0_30px_rgba(244,63,94,0.7)]'
                : 'bg-zinc-900 border-zinc-500 shadow-[0_0_30px_rgba(255,255,255,0.3)]'
            }`}
          >
            <span className="text-3xl sm:text-4xl font-black font-mono text-white drop-shadow-md">
              {result.number}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-white/90">
              {color === 'green' ? 'GREEN' : color === 'red' ? 'RED' : 'BLACK'}
            </span>
          </div>

          {/* Icon Badge */}
          <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-stone-900 border border-amber-400 flex items-center justify-center shadow-lg">
            {isWin ? (
              <Trophy className="w-4 h-4 text-amber-400" />
            ) : (
              <Frown className="w-4 h-4 text-rose-400" />
            )}
          </div>
        </div>

        {/* Title */}
        <div className="mt-2">
          <h2 className="text-2xl font-black tracking-tight">
            {isWin ? (
              <span className="text-amber-300 drop-shadow-[0_0_12px_rgba(252,211,77,0.6)] flex items-center justify-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400 animate-spin" />
                恭喜中獎！
                <Sparkles className="w-5 h-5 text-amber-400 animate-spin" />
              </span>
            ) : (
              <span className="text-stone-300">本輪未中獎</span>
            )}
          </h2>
          <p className="text-xs text-stone-400 mt-1">
            開出號碼: <span className="font-bold text-white">{result.number}</span> (
            {color === 'green'
              ? '綠色 ZERO'
              : `${color === 'red' ? '紅' : '黑'} / ${
                  result.number % 2 === 0 ? '雙數' : '單數'
                } / ${result.number >= 19 ? '大 (19-36)' : '小 (1-18)'}`}
            )
          </p>
        </div>

        {/* Payout & Net summary */}
        <div className="w-full my-4 p-3.5 rounded-xl bg-stone-900/90 border border-stone-800 flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs text-stone-400">
            <span>總下注金額:</span>
            <span className="font-mono font-bold text-stone-200">
              ${result.totalBet.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs text-stone-400">
            <span>獲得彩金 (含本金):</span>
            <span className="font-mono font-bold text-emerald-400 text-sm">
              ${result.totalWon.toLocaleString()}
            </span>
          </div>
          <div className="pt-2 border-t border-stone-800 flex items-center justify-between font-bold">
            <span className="text-xs text-stone-300">淨利潤 (NET PROFIT):</span>
            <span
              className={`font-mono text-base ${
                result.netProfit > 0
                  ? 'text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.6)]'
                  : result.netProfit < 0
                  ? 'text-rose-400'
                  : 'text-stone-400'
              }`}
            >
              {result.netProfit > 0 ? `+$${result.netProfit.toLocaleString()}` : `$${result.netProfit.toLocaleString()}`}
            </span>
          </div>
        </div>

        {/* Winning bets list */}
        {isWin && result.winningBets.length > 0 && (
          <div className="w-full mb-4 max-h-36 overflow-y-auto pr-1 text-left space-y-1.5">
            <div className="text-[11px] font-semibold text-stone-400">中獎項目明細:</div>
            {result.winningBets.map((wb, i) => (
              <div
                key={`wb-${i}`}
                className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-emerald-950/40 border border-emerald-800/40 text-xs"
              >
                <div className="flex flex-col">
                  <span className="font-bold text-emerald-200">{wb.label}</span>
                  <span className="text-[10px] text-emerald-400/80">{wb.multiplier}</span>
                </div>
                <span className="font-mono font-bold text-emerald-300">
                  +${wb.payout.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}

        {isZero && !isWin && (
          <div className="w-full mb-4 p-2 rounded-lg bg-emerald-950/30 border border-emerald-800/40 text-xs text-emerald-300">
            提示：開出 0 (綠色)，所有外圍注（紅/黑、單/雙、大/小）皆判定未中獎。
          </div>
        )}

        {/* Continue Button */}
        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-black text-sm tracking-wider uppercase shadow-[0_0_20px_rgba(245,158,11,0.5)] cursor-pointer active:scale-95 transition-all"
        >
          繼續遊戲
        </button>
      </div>
    </div>
  );
};
