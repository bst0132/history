import DocumentBase from './documentBase';

interface MailAddHistory extends DocumentBase {
  /** ユーザーID */
  userID: string;
  /** 変更前メールアドレス */
  oldMailAdd: string;
  /** 変更後メールアドレス */
  newMailAdd: string;
  /** 認証コード */
  authCode: string;
  /** 有効期限 */
  expirationDate: string;
  /** 変更済みフラグ */
  changedFlg: boolean;
}

export default MailAddHistory;
