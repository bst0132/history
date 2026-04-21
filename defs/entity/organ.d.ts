import AdminInf from './adminInf';
import DocumentBase from './documentBase';
import ImageInf from './imageInf';

interface Organ extends DocumentBase {
  /** 団体名 */
  organName: string;
  /** 競技 */
  sports: string;
  /** 団体紹介 */
  organIntro?: boolean;
  /** 団体ロゴ */
  organLogo?: ImageInf;
  /** 所在地情報 */
  organAddInf: {
    /** 国 */
    organCountry: string;
    /** 県 */
    organPrefecture: string;
    /** 市区町村 */
    organCity: string;
  };
  /** 団体システム管理者 */
  organAdminInf: AdminInf[];
}

export default Organ;
