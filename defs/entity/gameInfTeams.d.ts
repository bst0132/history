/** サッカー固有の情報をまとめる */
interface GameTeamFootball {
  /** ユーザーID */
  userID: string;
  /** 役職(監督、選手) */
  teamPosition: string;
  /** 背番号 */
  uniNum?: string;
  /** ポジション */
  gamePosition?: string;
  /** 試合参加区分 */
  entrantStatus?: string;
  }

/** 管理するスポーツの型をここで集約する */
type GameInfTeams = GameTeamFootball;

export default GameInfTeams;
