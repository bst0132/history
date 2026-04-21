import DocumentBase from './documentBase';
import GameInfCom from './gameInfCom';
import GameInfSports from './gameInfSports';
import GameInfTeams from './gameInfTeams';

interface Game extends DocumentBase {
  /** 大会ID */
  competitionID: string;
  /** 試合情報(共通) */
  gameInfCom: GameInfCom;
  /** 試合情報(スポーツ固有) */
  gameInfSports: GameInfSports;
  /** チーム情報 */
  teamInfo?: {
    /** チームID */
    teamID: string;
    /** 試合チーム情報(スポーツ固有) */
    entrantInfo?: GameInfTeams[];
  }[];
}

export default Game;
