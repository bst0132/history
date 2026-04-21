import DocumentBase from './documentBase';
import ImageInf from './imageInf';
import AdminInf from './adminInf';

/** (新)大会情報 */
interface CompetitionInf extends DocumentBase {
  /** 大会名 */
  compName: string;
  /** 大会ロゴ */
  compLogo?: ImageInf;
  /** 開会年月日 */
  openingDate: string;
  /** 閉会年月日 */
  closingDate: string;
  /** 開会時間 */
  openingTime?: string;
  /** 閉会時間 */
  closingTime?: string;
  /** 開催地 */
  compPlace?: string[];
  /** 主催情報 */
  organizer?: {
    /** 主催ID */
    orgId: string;
    /** 編集権限 */
    orgEditFlag: boolean;
    /** 主催区分 */
    orgFlag: string;
  }[];
  /** その他主催 */
  otherOrgs?: string[];
  /** 主管 */
  supervisor?: string[];
  /** 協賛 */
  cosponsor?: string[];
  /** 趣旨 */
  purpose?: string;
  /** 参加資格 */
  entryQual?: string;
  /** 競技規則 */
  gameRules?: string[];
  /** 大会方式情報 */
  compSystemInf?: {
    /** 大会方式 */
    compSystem?: string;
    /** 勝ち点情報 */
    winningPointInf?: {
      /** 勝ち */
      winPoint?: number;
      /** 負け */
      losePoint?: number;
      /** 引き分け */
      drawPoint?: number;
    };
  };
  /** 表彰 */
  awards?: string;
  /** 注意事項 */
  notes?: string[];
  /** 参加費用 */
  entryFee?: string;
  /** その他 */
  remarks?: string;
  /** 連絡先 */
  contact?: {
    /** 名前 */
    name?: string;
    /** 電話番号 */
    phoneNumber?: string;
  };
  /** 大会システム管理者 */
  compAdminInf: AdminInf;
  /** QRコード作成画面で使うパーツ */
  qrcodeParts?: {
    /** 暗号化大会ID */
    encryptedCompId?: string;
    /** 暗号化有効期限 */
    encryptedDate?: string;
    /** 有効期限 */
    expirationDate?: string;
  };
}

export default CompetitionInf;
