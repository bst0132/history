import DocumentBase from './documentBase';
import SportsInf from './sportsInf';
import ImageInf from './imageInf';
/** ユーザー情報 */
interface User extends DocumentBase {
  /** メールアドレス */
  mailAdd: string;
  /** パスワード */
  password: string;
	/** ニックネーム(表示名) */
	nickname: string;
  /** ユーザー個別ID */
  userUniqueID?: string;
  /** ユーザーの画像 */
  userImage?: ImageInf;
  /** ID検索許可区分 (True：許可、False：不許可) */
  isSearchable: boolean;
  /** 選手情報 */
  playerInf? : {
    /** 姓 */
    lastName: string;
    /** 名 */
    firstName: string;
    /** 姓(カナ) */
    lastNameKana: string;
    /** 名(カナ) */
    firstNameKana: string;
    /** 生年月日 */
    birthDate: string;
    /** 出身地 */
    birthPlace?: string;
    /** 身長（数値） */
    heightNum?: string;
    /** 身長（単位） */
    heightUnit?: string;
    /** 体重（数値） */
    weightNum?: string;
    /** 体重（単位） */
    weightUnit?: string;
    /** 血液型 */
    bloodType?: string;
    /** 国籍 */
    nationallity: string;
    /** 父親の身長 */
    fatherHeight?: string;
    /** 母親の身長 */
    motherHeight?: string;
  };
	/** 保護者ID */
	parentID?: string[];
  /** スポーツ情報 */
  sportsInf?: SportsInf[];
}

export default User;
