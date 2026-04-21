import DocumentBase from "./documentBase";
import PlayerResult from './playerResult';

interface PlayerHistory extends DocumentBase {
  /** ユーザーID */
  userID: string;
  /** 大会ID */
  competitionID?: string;
  /** 試合ID */
  gameID: string;
  /** 成績 */
  records?: PlayerResult[];
}

export default PlayerHistory;
