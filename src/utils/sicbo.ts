import {
  SicBoBetItem,
  SicBoBetType,
  SicBoRollResult,
  WinningBetDetail,
} from '../types/sicbo';

// Roll 3 fair dice (1-6)
export const rollDice = (): [number, number, number] => {
  const d1 = Math.floor(Math.random() * 6) + 1;
  const d2 = Math.floor(Math.random() * 6) + 1;
  const d3 = Math.floor(Math.random() * 6) + 1;
  return [d1, d2, d3];
};

export const TOTAL_PAYOUT_RATIOS: Record<number, number> = {
  4: 50,
  5: 18,
  6: 14,
  7: 12,
  8: 8,
  9: 6,
  10: 6,
  11: 6,
  12: 6,
  13: 8,
  14: 12,
  15: 14,
  16: 18,
  17: 50,
};

export const calculateSicBoResult = (
  dice: [number, number, number],
  bets: SicBoBetItem[]
): SicBoRollResult => {
  const [d1, d2, d3] = dice;
  const sum = d1 + d2 + d3;
  const isTriple = d1 === d2 && d2 === d3;
  const tripleValue = isTriple ? d1 : undefined;

  // Small: 4 to 10 (except triples)
  // Big: 11 to 17 (except triples)
  const isSmall = sum >= 4 && sum <= 10 && !isTriple;
  const isBig = sum >= 11 && sum <= 17 && !isTriple;

  // Odd: Sum is odd (except triples)
  // Even: Sum is even (except triples)
  const isOdd = sum % 2 !== 0 && !isTriple;
  const isEven = sum % 2 === 0 && !isTriple;

  const totalBet = bets.reduce((acc, b) => acc + b.amount, 0);
  let totalWon = 0;
  const winningBets: WinningBetDetail[] = [];

  bets.forEach((bet) => {
    let multiplier = 0; // 0 means lost, >0 means won that multiple of bet as profit

    // 1. Big / Small (1:1)
    if (bet.type === 'small' && isSmall) {
      multiplier = 1;
    } else if (bet.type === 'big' && isBig) {
      multiplier = 1;
    }

    // 2. Odd / Even (1:1)
    else if (bet.type === 'odd' && isOdd) {
      multiplier = 1;
    } else if (bet.type === 'even' && isEven) {
      multiplier = 1;
    }

    // 3. Single Dice Points 1~6 (1x for 1 dice, 2x for 2 dice, 3x for 3 dice)
    else if (bet.type.startsWith('single_')) {
      const targetNum = parseInt(bet.type.replace('single_', ''), 10);
      const matchCount = dice.filter((d) => d === targetNum).length;
      if (matchCount > 0) {
        multiplier = matchCount; // 1 -> 1:1, 2 -> 1:2, 3 -> 1:3
      }
    }

    // 4. Any Triple (24:1)
    else if (bet.type === 'any_triple' && isTriple) {
      multiplier = 24;
    }

    // 5. Specific Sum Totals 4~17
    else if (bet.type.startsWith('total_')) {
      const targetSum = parseInt(bet.type.replace('total_', ''), 10);
      if (sum === targetSum) {
        multiplier = TOTAL_PAYOUT_RATIOS[targetSum] || 6;
      }
    }

    if (multiplier > 0) {
      const profit = bet.amount * multiplier;
      const payout = bet.amount + profit; // Return stake + profit
      totalWon += payout;
      winningBets.push({
        id: bet.id,
        label: bet.label,
        betAmount: bet.amount,
        multiplier,
        payout,
        profit,
      });
    }
  });

  const netProfit = totalWon - totalBet;

  return {
    dice,
    sum,
    isSmall,
    isBig,
    isOdd,
    isEven,
    isTriple,
    tripleValue,
    totalBet,
    totalWon,
    netProfit,
    winningBets,
    timestamp: Date.now(),
  };
};
