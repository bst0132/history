/** サッカー固有の情報をまとめる */
interface GameInfFootball {
  /** 競技 */
  sports: 'Football';
  /** 主審 */
  chiefUmpire?: string;
  /** 副審 */
  subUmpire?: string[];
  /** 第4の審判 */
  fourthUmpire?: string[];
}

/** 管理するスポーツの型をここで集約する */
type GameInfSports = GameInfFootball;

export default GameInfSports;
