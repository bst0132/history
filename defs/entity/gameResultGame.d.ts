interface GameResultTFootball {
  /** チームID */
  teamID: string;
  /** 得点：前半 */
  score1stHalf?: number;
  /** 得点：後半 */
  score2ndHalf?: number;
  /** 得点：延長戦前半 */
  scoreEX1stHalf?: number;
  /** 得点：延長戦後半 */
  scoreEX2ndHalf?: number;
  /** 得点：試合結果 */
  scoreResult?: number;
  /** 得点：ＰＫ戦 */
  scorePK?: number;
  /** シュート数 */
  cntShoot?: number;
  /** 直接ＦＫ数 */
  cntDiredtFK?: number;
  /** 間接ＦＫ数 */
  cntIndiredtFK?: number;
  /** ＣＫ数 */
  cntCornerKick?: number;
  /** オフサイド数 */
  cntOffside?: number;
}

type GameResultGame = GameResultTFootball;

export default GameResultGame;
