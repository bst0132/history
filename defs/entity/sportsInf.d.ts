/** サッカー固有の情報をまとめる */
interface FootBall {
  /** 競技 */
  sport: 'Football';
  /** ポジション */
  position: string;
  /** 利き足 */
  dominantFoot: string;

}
/** 管理するスポーツの型をここで集約する */
type SportsInf = FootBall;

export default SportsInf;
