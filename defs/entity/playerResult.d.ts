interface FootballResult{
  /** 競技 */
  sports: 'Football';
  /** ユーザーID */
  userID: string;
  /** チームID */
  teamID: string;
  /** 成績種類 */
  recordType?: string;
  /** 時間 */
  resultTime?: string;
}

type PlayerResult = FootballResult;

export default PlayerResult;
