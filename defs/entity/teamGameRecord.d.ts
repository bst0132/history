import DocumentBase from './documentBase';
import type { ObjectId } from 'mongodb';

/** (新)チーム別試合記録 */
interface TeamGameRecord extends DocumentBase {
  /** 大会ID */
  compId: string;
  /** チームID */
  teamId?: ObjectId;
  /** チーム名 */
  teamName?: string;
  /** 試合記録 */
  gameRecord?: {
    /** 試合グループID */
    gameGroupId: string;
    /** 順位 */
    rank?: number;
    /** 各試合情報 */
    perGameInf: {
      /** 試合ID */
      gameId: number;
      /** 勝ち */
      isWon?: number;
      /** 負け */
      isLost?: number;
      /** 引き分け */
      isDrew?: number;
      /** 得点 */
      score?: number;
      /** 失点 */
      loss?: number;
    }[];
  }[];
}

export default TeamGameRecord;
