import React from 'react';

interface DiceProps {
  value: number; // 1 to 6
  isRolling?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const Dice: React.FC<DiceProps> = ({
  value,
  isRolling = false,
  size = 'md',
}) => {
  // Dimensions
  const sizeClasses = {
    sm: 'w-10 h-10 rounded-lg p-1 text-[10px]',
    md: 'w-14 h-14 sm:w-16 sm:h-16 rounded-xl p-1.5 text-xs',
    lg: 'w-18 h-18 sm:w-20 sm:h-20 rounded-2xl p-2 text-sm',
  }[size];

  const pipSize = {
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5 sm:w-3 sm:h-3',
    lg: 'w-3.5 h-3.5 sm:w-4 sm:h-4',
  }[size];

  // Pip colors: Casino standard -> 1 and 4 are RED, others (2,3,5,6) are DARK BLUE/BLACK
  const isRedPip = value === 1 || value === 4;
  const pipColor = isRedPip ? 'bg-rose-600 shadow-[0_0_4px_rgba(225,29,72,0.8)]' : 'bg-zinc-900 shadow-[0_0_3px_rgba(0,0,0,0.8)]';

  // Render dice pips based on standard 3x3 grid
  const renderPips = () => {
    if (value === 1) {
      return (
        <div className="w-full h-full flex items-center justify-center">
          <div
            className={`${
              size === 'sm' ? 'w-4 h-4' : size === 'md' ? 'w-6 h-6 sm:w-7 sm:h-7' : 'w-8 h-8 sm:w-9 sm:h-9'
            } rounded-full bg-rose-600 shadow-[0_0_8px_rgba(225,29,72,0.8)] animate-pulse`}
          />
        </div>
      );
    }

    if (value === 2) {
      return (
        <div className="w-full h-full flex flex-col justify-between p-0.5">
          <div className="flex justify-start">
            <div className={`${pipSize} rounded-full ${pipColor}`} />
          </div>
          <div className="flex justify-end">
            <div className={`${pipSize} rounded-full ${pipColor}`} />
          </div>
        </div>
      );
    }

    if (value === 3) {
      return (
        <div className="w-full h-full flex flex-col justify-between p-0.5">
          <div className="flex justify-start">
            <div className={`${pipSize} rounded-full ${pipColor}`} />
          </div>
          <div className="flex justify-center">
            <div className={`${pipSize} rounded-full ${pipColor}`} />
          </div>
          <div className="flex justify-end">
            <div className={`${pipSize} rounded-full ${pipColor}`} />
          </div>
        </div>
      );
    }

    if (value === 4) {
      return (
        <div className="w-full h-full flex flex-col justify-between p-0.5">
          <div className="flex justify-between">
            <div className={`${pipSize} rounded-full ${pipColor}`} />
            <div className={`${pipSize} rounded-full ${pipColor}`} />
          </div>
          <div className="flex justify-between">
            <div className={`${pipSize} rounded-full ${pipColor}`} />
            <div className={`${pipSize} rounded-full ${pipColor}`} />
          </div>
        </div>
      );
    }

    if (value === 5) {
      return (
        <div className="w-full h-full flex flex-col justify-between p-0.5">
          <div className="flex justify-between">
            <div className={`${pipSize} rounded-full ${pipColor}`} />
            <div className={`${pipSize} rounded-full ${pipColor}`} />
          </div>
          <div className="flex justify-center">
            <div className={`${pipSize} rounded-full ${pipColor}`} />
          </div>
          <div className="flex justify-between">
            <div className={`${pipSize} rounded-full ${pipColor}`} />
            <div className={`${pipSize} rounded-full ${pipColor}`} />
          </div>
        </div>
      );
    }

    // 6
    return (
      <div className="w-full h-full flex justify-between p-0.5">
        <div className="flex flex-col justify-between">
          <div className={`${pipSize} rounded-full ${pipColor}`} />
          <div className={`${pipSize} rounded-full ${pipColor}`} />
          <div className={`${pipSize} rounded-full ${pipColor}`} />
        </div>
        <div className="flex flex-col justify-between">
          <div className={`${pipSize} rounded-full ${pipColor}`} />
          <div className={`${pipSize} rounded-full ${pipColor}`} />
          <div className={`${pipSize} rounded-full ${pipColor}`} />
        </div>
      </div>
    );
  };

  return (
    <div
      className={`relative ${sizeClasses} bg-gradient-to-br from-stone-50 via-white to-stone-200 border-2 border-stone-300 shadow-[0_8px_20px_rgba(0,0,0,0.6),inset_0_2px_4px_rgba(255,255,255,0.9)] flex items-center justify-center transform transition-all duration-300 ${
        isRolling
          ? 'animate-bounce blur-[0.5px] rotate-12 scale-90'
          : 'hover:scale-105 shadow-[0_10px_25px_rgba(0,0,0,0.7)]'
      }`}
    >
      {renderPips()}
    </div>
  );
};
