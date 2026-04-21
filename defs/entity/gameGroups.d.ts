import DocumentBase from './documentBase';
import type { ObjectId } from 'mongodb';

/** (新)試合情報 */
interface GameGroups extends DocumentBase {
  /** 大会ID */
  compId: string;
  /** 試合方式 */
  gameSystem: string;
  /** 試合グループ名 */
  gameGroupTitle: string;
  /** チーム数 */
  teamCount: number;
  /** 試合グループ配置番号 */
  groupPlaceNum: number;
  /* 試合開始フラグ */
  gameStartedFlg: boolean;
  /** 試合情報 */
  gameGroupInf: {
    /** 試合年月日 */
    gameDate?: string;
    /** 試合会場 */
    gamePlace?: string;
    /** 試合開始時間 */
    gameStartTime?: number;
    /** 試合ID */
    gameId: number;
    /** 基準チーム記録ID */
    criteriaRecordId?: ObjectId;
    /** 基準チーム得点 */
    criteriaScore?: number;
    /** 基準チームID */
    criteriaTeamId?: ObjectId;
    /** 基準チーム参加・不参加判定 */
    criteriaNoEntry?: boolean;
    /** 基準チーム勝利判定 */
    criteriaWinFlg?: boolean;
    /** 対戦チーム記録ID */
    opponentRecordId?: ObjectId;
    /** 対戦チーム得点 */
    opponentScore?: number;
    /** 対戦チームID */
    opponentTeamId?: ObjectId;
    /** 対戦チーム参加・不参加判定 */
    opponentNoEntry?: boolean;
    /** 試合詳細 */
    freeText?: string;
    /* 試合経過状況 */
    gameProgressStatus?: '1' | '2' | '3';
  }[];
}

export default GameGroups;
