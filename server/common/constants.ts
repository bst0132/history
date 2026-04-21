import { MailTextConst } from './mail-text';

/**
 * 共通定数クラス
 */
export class CommonConst {

  /** 文字コード */
  static readonly CHARSET = 'UTF-8';

}

/**
 * メール関連の定数クラス
 */
export class MailConst {

  /** ユーザー登録メール：題名 */
  static readonly SUB_CREATE_USER = '【PersonalSportsHistory】ユーザー登録のご案内';

  /** ユーザー登録メール：本文 */
  static readonly TEXT_CREATE_USER = MailTextConst.TEXT_CREATE_USER;

  /** ユーザー登録完了メール：題名 */
  static readonly SUB_CREATE_USER_COMP = '【PersonalSportsHistory】ユーザー登録完了のお知らせ';

  /** ユーザー登録完了メール：本文 */
  static readonly TEXT_CREATE_USER_COMP = MailTextConst.TEXT_CREATE_USER_COMP;

  /** パスワードリセットメール：題名 */
  static readonly SUB_PASSWORD_RESET = '【PersonalSportsHistory】パスワードリセットのご案内';

  /** パスワードリセットメール：本文 */
  static readonly TEXT_PASSWORD_RESET = MailTextConst.TEXT_PASSWORD_RESET;

  /** 認証コード送信メール：題名 */
  static readonly SUB_SEND_AUTH_CODE = '【PersonalSportsHistory】メールアドレス変更';

  /** 認証コード送信メール：本文 */
  static readonly TEXT_SEND_AUTH_CODE = MailTextConst.TEXT_SEND_AUTH_CODE;
}

/**
 * 検索対象
 */
export class AuthType {
  /* 選手 */
  static readonly PLAYER = 'player';

  /* スタッフ */
  static readonly STAFF = 'teamStaff';
}

/**
 * 稼働環境
 */
export class RunEnvironment {
  /* ローカル */
  static LOCAL = 0;

  /* AWS */
  static AWS = 1;

  /* オンプレ */
  static PRODUCTION = 2;
}
