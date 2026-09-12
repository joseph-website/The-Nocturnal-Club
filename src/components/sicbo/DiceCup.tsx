import React from 'react';
import { Dice } from './Dice';
import { Sparkles, Zap } from 'lucide-react';

interface DiceCupProps {
  dice: [number, number, number];
  isShaking: boolean;
  isCovered: boolean;
  sum: number;
  isSmall: boolean;
  isBig: boolean;
  isOdd: boolean;
  isEven: boolean;
  isTriple: boolean;
}

export const DiceCup: React.FC<DiceCupProps> = ({
  dice,
  isShaking,
  isCovered,
  sum,
  isSmall,
  isBig,
  isOdd,
  isEven,
  isTriple,
}) => {
  return (
    <div className="relative w-full flex flex-col items-center justify-center select-none py-1">
      {/* 1. Main Dice Stage Tray */}
      <div className="relative w-72 sm:w-84 h-52 sm:h-58 rounded-full bg-gradient-to-b from-[#1a1205] via-[#2a1d08] to-[#120a02] border-4 border-amber-500/80 shadow-[0_0_50px_rgba(0,0,0,0.9),inset_0_0_30px_rgba(245,158,11,0.2)] flex flex-col items-center justify-center p-4">
        {/* Outer Golden Flange with Rivets */}
        <div className="absolute inset-1.5 rounded-full border-2 border-dashed border-amber-400/40 pointer-events-none" />

        {/* Inner Emerald Velvet Felt Plate for 3 Dice */}
        <div className="relative w-56 sm:w-64 h-36 sm:h-42 rounded-full bg-gradient-to-b from-[#0b3823] via-[#062416] to-[#04170e] border-3 border-emerald-500/60 shadow-[inset_0_0_25px_rgba(0,0,0,0.95)] flex items-center justify-center overflow-hidden">
          {/* Decorative Felt Gold Logo Stamp */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
            <div className="text-center font-serif text-amber-300">
              <div className="text-xs tracking-widest uppercase">NOCTURNAL SIC BO</div>
              <div className="text-[10px]">VIP CLUB TABLE</div>
            </div>
          </div>

          {/* 3 Physical Dice (shown when not covered or tumbling when rolling) */}
          <div
            className={`flex items-center justify-center gap-3 sm:gap-4.5 z-10 transition-transform duration-500 ${
              isShaking ? 'scale-75 blur-[0.5px] dice-tumble-3d' : 'scale-100 animate-in fade-in zoom-in-75'
            }`}
          >
            <Dice value={dice[0]} isRolling={isShaking} size="md" />
            <Dice value={dice[1]} isRolling={isShaking} size="md" />
            <Dice value={dice[2]} isRolling={isShaking} size="md" />
          </div>

          {/* 2. THE METALLIC GOLDEN DICE CUP (DOME LID) WITH 3D SHAKING */}
          <div
            className={`absolute inset-0 z-20 flex flex-col items-center justify-center transition-all duration-700 ease-out ${
              isCovered || isShaking
                ? 'opacity-100 translate-y-0 scale-100'
                : 'opacity-0 -translate-y-36 scale-110 pointer-events-none'
            }`}
          >
            <div
              className={`w-48 sm:w-54 h-34 sm:h-38 rounded-t-[100px] rounded-b-2xl bg-gradient-to-b from-amber-300 via-amber-600 to-amber-900 border-4 border-amber-200 shadow-[0_15px_40px_rgba(0,0,0,0.9),inset_0_4px_10px_rgba(255,255,255,0.8)] flex flex-col items-center justify-between p-3 relative ${
                isShaking ? 'cup-shake-3d' : ''
              }`}
            >
              {/* Cup Top Knob (Golden Handle) */}
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-200 via-amber-400 to-amber-700 border-2 border-amber-100 shadow-md -mt-6 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-stone-900" />
              </div>

              {/* Chinese Engraving / Logo on Cup */}
              <div className="flex flex-col items-center justify-center text-center">
                <span className="font-serif font-black text-lg sm:text-xl text-amber-950 drop-shadow-[0_1px_1px_rgba(255,255,255,0.6)] tracking-wider">
                  富貴骰寶
                </span>
                <span className="text-[9px] font-bold text-amber-900/90 tracking-widest uppercase">
                  {isShaking ? '🎲 3D 搖骰中...' : '夜行俱樂部'}
                </span>
              </div>

              {/* Bottom Gold Trim */}
              <div className="w-full h-3 rounded-full bg-amber-950/40 border-t border-amber-300/60" />
            </div>
          </div>
        </div>
      </div>

      {/* 2. OUTCOME BADGES & SUMMARY DISPLAY (Below Cup) */}
      <div className="mt-3 flex items-center gap-2">
        {/* Total Points Badge */}
        <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-stone-950/90 border border-amber-500/40 shadow-lg">
          <span className="text-xs text-stone-400 font-bold">總點數:</span>
          <span className="font-mono font-black text-base sm:text-lg text-amber-300">
            {sum} 點
          </span>
          <span className="text-xs font-mono text-stone-400">
            ({dice[0]} + {dice[1]} + {dice[2]})
          </span>
        </div>

        {/* Big / Small Badge */}
        <div
          className={`px-3 py-1 rounded-xl border text-xs font-black transition-all ${
            isTriple
              ? 'bg-rose-950/80 border-rose-500 text-rose-300 shadow-[0_0_10px_rgba(244,63,94,0.5)]'
              : isBig
              ? 'bg-amber-500 text-stone-950 border-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.6)]'
              : 'bg-blue-600 text-white border-blue-300 shadow-[0_0_12px_rgba(59,130,246,0.6)]'
          }`}
        >
          {isTriple ? '圍骰 (莊通吃)' : isBig ? '大 (11-17)' : '小 (4-10)'}
        </div>

        {/* Odd / Even Badge */}
        <div
          className={`px-2.5 py-1 rounded-xl border text-xs font-bold transition-all ${
            isTriple
              ? 'bg-stone-900 border-stone-700 text-stone-500'
              : isOdd
              ? 'bg-purple-900/80 text-purple-200 border-purple-400'
              : 'bg-emerald-900/80 text-emerald-200 border-emerald-400'
          }`}
        >
          {isOdd ? '單數' : '雙數'}
        </div>

        {/* Triple Notice */}
        {isTriple && (
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-400 text-stone-950 font-black text-xs animate-bounce shadow-[0_0_15px_rgba(245,158,11,0.8)]">
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span>全圍 {dice[0]}x3!</span>
          </div>
        )}
      </div>
    </div>
  );
};
