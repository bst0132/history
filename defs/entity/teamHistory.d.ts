import DocumentBase from './documentBase';
import TeamSportsHisInf from './teamSportsHisInf';

interface TeamHistory extends DocumentBase {
  /** チームID */
  teamID: string;
  /** ユーザーID */
  userID: string;
  /** 役職 */
  teamPosition: string;
  /** 所属開始年月 */
  teamStartDate: string;
  /** 所属終了年月 */
  teamEndDate?: string;
  /** スポーツ情報(スポーツ固有) */
  teamSportsHisInf: TeamSportsHisInf;
}

export default TeamHistory;
