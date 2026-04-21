import DocumentBase from './documentBase';

interface InvitationInf extends DocumentBase {
  /** 認証先ユーザーID */
  authDstUserID: string;
  /** 認証種別 */
  authType: string;
  /** 有効期限 */
  expirDate: string;
  /** 認証元ユーザーID */
  authOriUserID: string;
  /** 関連ID */
  relationID?: string;
}

export default InvitationInf;
