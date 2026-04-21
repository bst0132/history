import DocumentBase from './documentBase';

interface PartTeamHistory extends DocumentBase {
  /** 主催団体情報 */
  organizerInf: {
    /** 主催団体区分 */
    organizerFlg: string;
    /** 主催団体ID */
    organizerID: string;
  };
  /** チームID */
  teamID: string;
}

export default PartTeamHistory;
