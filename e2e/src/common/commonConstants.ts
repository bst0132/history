import { protractor } from 'protractor/built/ptor';

/**
 * 定数クラス
 */
export class Constants {
  /** 停止時間の定数*/
  public static readonly SLEEP_TIME = 1000;

  /** ログイン用メールアドレス*/
  public static readonly LOGIN_MAIL = 'dummy_testmail0001';

  /** ログイン用パスワード*/
  public static readonly LOGIN_PASS = 'Bestaff0101';

  /** キーの定数(Ctrl + A)*/
  public static readonly CTRL_A = protractor.Key.chord(protractor.Key.CONTROL, 'a');

  /** ダイアログのメッセージの定数（OK）*/
  public static readonly OK = 'OK';

  /** 日付入力形式エラー用の入力値（二〇二一年五月十一日）*/
  public static readonly ERR_DATE = '二〇二一年五月十一日';

  /** 要素指定時の定数（mat-option）*/
  public static readonly MAT_OPTION = 'mat-option';
}
