import DocumentBase from './documentBase';
import AdminInf from './adminInf';
import ImageInf from './imageInf';
/** 大会情報 */
interface Competition extends DocumentBase {
  /** 大会名 */
  compName: string;
  /** 競技 */
  sports: string;
  /** 開催年月日 */
  heldDate: string;
  /** 大会紹介 */
  compIntro?: string;
  /** 大会ロゴ */
  compLogo?: ImageInf;
  /** 大会システム管理者 */
  compAdminInf: AdminInf[];
  /** 主催団体情報 */
  organizerInf: {
  /** 主催団体区分 */
    organizerFlg: string;
  /** 主催団体ID */
    organizerID: string;
  }[];
  /** 参加チームID */
  teamID: string[];
  /** 開催地ID */
  placeID: string[];
}

export default Competition;
