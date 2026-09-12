export type SicBoBetType =
  | 'small'       // 小 (4~10)
  | 'big'         // 大 (11~17)
  | 'odd'         // 單 (Odd)
  | 'even'        // 雙 (Even)
  | 'single_1'    // 單骰 1
  | 'single_2'    // 單骰 2
  | 'single_3'    // 單骰 3
  | 'single_4'    // 單骰 4
  | 'single_5'    // 單骰 5
  | 'single_6'    // 單骰 6
  | 'any_triple'  // 全圍 (Any Triple)
  | 'total_4'     // 總和 4
  | 'total_5'
  | 'total_6'
  | 'total_7'
  | 'total_8'
  | 'total_9'
  | 'total_10'
  | 'total_11'
  | 'total_12'
  | 'total_13'
  | 'total_14'
  | 'total_15'
  | 'total_16'
  | 'total_17';

export interface SicBoBetItem {
  id: string;
  type: SicBoBetType;
  amount: number;
  label: string;
  payoutRatioText: string;
}

export interface WinningBetDetail {
  id: string;
  label: string;
  betAmount: number;
  multiplier: number; // e.g. 1 means 1:1 profit (return 2x bet)
  payout: number;     // total return (bet + profit)
  profit: number;     // net profit
}

export interface SicBoRollResult {
  dice: [number, number, number];
  sum: number;
  isSmall: boolean;
  isBig: boolean;
  isOdd: boolean;
  isEven: boolean;
  isTriple: boolean;
  tripleValue?: number;
  totalBet: number;
  totalWon: number;
  netProfit: number;
  winningBets: WinningBetDetail[];
  timestamp: number;
}

export interface SicBoStats {
  rolls: number;
  wins: number;
  totalBet: number;
  totalWon: number;
  triplesCount: number;
  highestWin: number;
}
