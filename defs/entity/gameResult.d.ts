import DocumentBase from './documentBase';
import GameResultGame from './gameResultGame';
import PlayerResult from './playerResult';

interface GameResult extends DocumentBase {
  /** 試合ID */
  gameID: string;
  /** グループ区分 */
  groupFlg: string;
  /** グループID */
  groupID: string;
  /** 試合結果 試合(スポーツ固有) */
  gameResult?: GameResultGame;
  /** 試合結果 個人(スポーツ固有) */
  gameResultPlayer?: PlayerResult[];
}

export default GameResult;
