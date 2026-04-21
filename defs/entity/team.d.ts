import DocumentBase from './documentBase';
import AdminInf from './adminInf';
import ImageInf from './imageInf';

interface Team extends DocumentBase {
	/** チーム名 */
	teamName: string;
	/** 競技 */
  sports: string;
	/** チーム紹介 */
	teamIntro?: string;
	/** チームロゴ */
	teamLogo?: ImageInf;
	/** チームシステム管理者 */
	teamAdminInf: AdminInf[];
	/** 設立日 */
	teamEstDate: string;
  /** 所在地情報 */
  teamAddInf: {
    /** 国 */
    teamCountry: string;
    /** 都道府県 */
    teamPrefecture: string;
    /** 市区町村 */
    teamCity: string;
  };
	/** 電話番号 */
  teamTel?: string;
}

export default Team;
