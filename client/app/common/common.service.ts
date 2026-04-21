import { Injectable } from '@angular/core';
import { Router, Params } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog';
import { Observable } from 'rxjs';
import type { ObjectId } from 'mongodb';
import { ApiService, LoginInfo, ApiResponse } from 'defs/api/index.d';
import is from 'is_js';
import { CommonDialogComponent, DialogData } from '../dialog/common-dialog/common-dialog.component';
import { MSG } from '../common/message-defines';
import { CNS } from './defines';
import { Subject } from 'rxjs';

interface Editinfo {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [x: string]: any; // id以外の項目
  id: ObjectId;
}

interface SessionInfo extends LoginInfo {
  editInfo?: Editinfo;
}

interface History {
  path: string;
  editInfo: Editinfo;
}

@Injectable({
  providedIn: 'root'
})
export class CommonService implements ApiService {


  // スマホ判定
  isMobile: boolean;

  loginInfo: SessionInfo;

  // 遷移してきたパスの履歴
  history: History[];

  // 画面遷移時の履歴
  historyBackup: History[];

  // 処理の進捗状態の管理用
  progress: string;

  // ログイン情報の変更通知用
  loginInfoChanged$ = new Subject<LoginInfo | null>();

  msg = MSG;

  constructor(private http: HttpClient, public router: Router, private dialog: MatDialog) {
    this.isMobile = is.mobile();
    this.loginInfo = JSON.parse(sessionStorage.getItem('loginInfo'));
    this.history = sessionStorage.getItem('history') ? JSON.parse(sessionStorage.getItem('history')) : [];
  }

  apiPost<T extends ApiResponse, K extends keyof T>(path: K, data: object): Observable<T[K]> {
    const url = `/api/${String(path)}`;
    const res = this.http.post(url,{
      loginInfo: this.loginInfo,
      data: data}) as Observable<T[K]>;
    return res;
  }

  getLoginInfo(): LoginInfo {
    return this.loginInfo;
  }

  /**
   * リーグ・トーナメント画面でのデバイス判定処理
   */
  getDevice(): 'sp' | 'pc' {
    if (navigator.maxTouchPoints && navigator.maxTouchPoints > 0) {
    // タッチ可能な端末はスマホ・タブレット扱い
    return 'sp';
    }
    return 'pc';
  }

  /**
   * ログイン情報を設定する
   * @param loginInfo ログイン情報
   */
  setLoginInfo(loginInfo: LoginInfo, isUserIdChanged = true): void {
    if (isUserIdChanged) {
      // 最初のログイン時は全て更新
      this.loginInfo = loginInfo;
    } else {
      // ログイン後はユーザーID以外の情報を更新
      this.loginInfo = {...loginInfo, userId: this.loginInfo.userId};
    }
    sessionStorage.setItem('loginInfo', JSON.stringify(this.loginInfo));
    this.loginInfoChanged$.next(loginInfo);
  }

  /**
   * ログイン情報を削除する
   */
  clearLoginInfo(): void {
    this.loginInfo = null;
    sessionStorage.removeItem('loginInfo');
  }

  /**
   * ログイン済判定
   */
  get isLogined(): boolean {
    return (this.loginInfo) ? true : false;
  }

  /**
   * 選手判定
   */
  get isPlayer(): boolean {
    return this.loginInfo && this.loginInfo.isPlayer;
  }

  /**
   * チーム管理者判定
   */
  get isAdminTeam(): boolean {
    return this.loginInfo && this.loginInfo.isAdminTeam;
  }

  /**
   * 団体管理者判定
   */
  get isAdminOrgan(): boolean {
    return this.loginInfo && this.loginInfo.isAdminOrgan;
  }

  /**
   * 大会管理者判定
   */
  get isAdminComp(): boolean {
    return this.loginInfo && this.loginInfo.isAdminComp;
  }

  /**
   * 管理団体ID・チームID取得
   */
  get managementId(): LoginInfo['management'] {
    return this.loginInfo.management;
  }

  setEditInfo(editInfo: Editinfo): void {
    this.loginInfo.editInfo = editInfo;
  }

  getEditInfo(): Editinfo {
    return this.loginInfo.editInfo;
  }

  clearEditInfo(): void {
    this.loginInfo.editInfo = null;
  }

  /**
   * 完了メッセージ等を表示するダイアログ
   * 非同期のためawaitで結果を受け取り後続処理を行わせること
   * @param title
   * @param message
   */
  openNoticeDialog(title: string, message: string): Promise<boolean> {
    const data: DialogData = {
      mode: 'notice',
      title,
      message
    };
    return this.dialog.open(CommonDialogComponent, {
      data
    }).afterClosed().toPromise();
  }

    /**
   * 確認用ダイアログを表示する
   * 非同期のためawaitで結果を受け取り後続処理を行わせること
   * @param title
   * @param message
   */
  openConfirmDialog(title: string, message: string): Promise<boolean> {
    const data: DialogData = {
      mode: 'confirm',
      title,
      message
    };
    return this.dialog.open(CommonDialogComponent, {
      data
    }).afterClosed().toPromise();
  }

  /**
   * 画面遷移用の共通関数
   * 一覧から詳細、詳細から編集等戻り先を管理したい場合に利用する
   * @param path 遷移先のパス
   */
  navigateTo(path: string): void {
    const current = this.router.url;
    sessionStorage.setItem('loginInfo', JSON.stringify(this.loginInfo));
    this.history.push({
      path: current,
      editInfo: this.loginInfo.editInfo
    });
    this.router.navigate([path]);
  }

    /**
   * 画面遷移用の共通関数
   * 一覧から詳細、詳細から編集等戻り先を管理したい場合に利用する
   * @param path 遷移先のパス
   */
  navigateWithEdit(path: string, editInfo?: Editinfo): void {
    const current = this.router.url;
    this.loginInfo.editInfo = editInfo || null;
    sessionStorage.setItem('loginInfo', JSON.stringify(this.loginInfo));
    this.history.push({
      path: current,
      editInfo: this.loginInfo.editInfo
    });
    sessionStorage.setItem('history', JSON.stringify(this.history));
    this.historyBackup = JSON.parse(JSON.stringify(this.history));
    this.router.navigate([path]);
  }

  /**
   * 受け渡し項目抜きで遷移する
   * @param path
   */
  navigateWithoutEdit(path: string): void {
    this.clearHistory();
    this.router.navigate([path]);
  }

  /**
   * 前のページに戻る
   * 直接遷移した等で履歴がない場合はトップへ遷移
   */
  navigateBack(): void {
    this.historyBackup = JSON.parse(JSON.stringify(this.history));
    const history = this.history.pop();
    sessionStorage.setItem('history', JSON.stringify(this.history));
    if (history && history.path != '/login') {
      this.setEditInfo(history.editInfo);
      this.router.navigate([history.path]);
    } else {
      // ログイン状態を削除してから遷移
      this.clearLoginInfo();
      this.router.navigate(['']);
    }

  }

  /**
   * ログインページに戻る
   * 全ての履歴を削除してログインページへ遷移
   */
  navigateToLogin(): void {
    // 遷移履歴・画面引継ぎ内容・ログイン情報を削除
    this.clearHistory();
    this.clearEditInfo();
    this.clearLoginInfo();
    // ログインページに遷移
    this.router.navigate(['']);
  }

  /**
   * ログイン画面に遷移する（参照用）
   */
  navigateToLoginFromRef(): void {
    this.router.navigate(['']);
  }

  /**
   * 画面遷移用の共通関数（参照用）
   * クエリパラメータを渡して遷移する
   * @param path
   * @param params
   */
  navigateForRef(path: string, params: Params): void {
    this.router.navigate([path], {queryParams: params});
  }

  /**
   * 進捗状態をセットする
   * @param status メソッドを呼び出した時点で行っている処理名(logoutなど)
   */
  setProgress(status: string): void {
    this.progress = status;
  }

  getProgress(): string {
    return this.progress;
  }

  /**
   * ページ遷移の履歴を初期化する
   */
  clearHistory(): void {
    this.history = [];
    sessionStorage.setItem('history', JSON.stringify(this.history));
  }

  /**
   * エラーメッセージダイアログを表示してトップへ遷移する
   * @param error エラー出し分けできるようにエラーオブジェクトを引数にしておく
   */
  errorOnApi(error: Error): void {
    this.openNoticeDialog(this.msg.communicationErrTitle, this.msg.communicationErr);
  }

  /**
   *  サービスにエラーが出た時のメッセージ
   * @param target
   * @param action
   */
  async errorOnService(target: string, action: string): Promise<void> {
    await this.openNoticeDialog(this.msg.communicationErrTitle, this.msg.errReason.replace('※1', target).replace('※2', action) + '\n' + this.msg.serviceErr);
  }

  /** アプリにエラーが出た時のメッセージ */
  async errorOnApp(): Promise<void> {
    await this.openNoticeDialog(this.msg.errTitle, this.msg.appErr);
  }

  /**
   * エラーメッセージダイアログを表示してトップへ遷移する
   */
  async errorOnEdit(): Promise<void> {
    await this.openNoticeDialog(this.msg.errTitle, this.msg.infGetErr);
    this.navigateWithoutEdit('profileDetail');
  }

  /**
   * エラーメッセージダイアログを表示して指定したパスへ遷移する(受け渡し項目ありver)
   */
  async errorOnDataGet(path: string, editInfo: Editinfo): Promise<void> {
    await this.openNoticeDialog(this.msg.communicationErrTitle, this.msg.communicationErr);
    this.navigateWithEdit(path, editInfo);
  }

  /**
   * サービス側エラーダイアログ表示後、指定したパスへ遷移する
   * @param path
   * @param editInfo
   * @param target
   * @param action
   */
  async errorOnServiceTransition(path: string, editInfo: Editinfo, target: string, action: string): Promise<void> {
    await this.openNoticeDialog(this.msg.communicationErrTitle, this.msg.errReason.replace('※1', target).replace('※2', action) + '\n' + this.msg.serviceErr);
    this.navigateWithEdit(path, editInfo);
  }

  /**
   * 登録系画面から受け渡し項目なしで遷移する関数
   * @param path
   */
  navigateFromCreate(path: string): void;

  /**
   * 登録系画面から受け渡し項目ありで遷移する関数
   * @param path
   * @param editInfo
   */
  navigateFromCreate(path: string, editInfo: Editinfo): void;

  /**
   * 登録系の画面から遷移する際の共通関数
   * @param path
   */
  public navigateFromCreate(path: string, editInfo?: Editinfo): void {
    if(editInfo) {
      // 引き継ぎ情報ありの場合
      this.loginInfo.editInfo = editInfo || null;
      sessionStorage.setItem('loginInfo', JSON.stringify(this.loginInfo));
      // 遷移後の画面から戻る際にプロフィール画面に遷移するよう履歴を積む
      this.history.push({
        path: CNS.pathToProfileDetail,
        editInfo: this.loginInfo.editInfo
      });
      sessionStorage.setItem('history', JSON.stringify(this.history));
      this.historyBackup = JSON.parse(JSON.stringify(this.history));
      this.router.navigate([path]);
    } else {
      // 引き継ぎ情報無しの場合
      this.clearHistory();
      this.router.navigate([path]);
    }
  }

  /**
   * 日付形式変換処理
   * @param date
   * @return yyyy形式の日付
   */
  public getYear(date: string): string {
    // 文字列型から日付型に変換し、年を取得する
    const dt = new Date(date);
    const y = dt.getFullYear();
    return `${y}`;
  }

  /**
   * 数字入力欄の記号「+」「-」「.」などの入力を厳しく制限する
   * @param score
   */
  public onNumberCheck(score: KeyboardEvent): void {
    if (score.key == '+' || score.code == 'NumpadAdd' || score.key == '-' || score.code == 'NumpadSubtract' || score.key == '.' || score.code == 'NumpadDecimal' || score.key == 'e' || score.code == 'KeyE') {
      score.preventDefault();
    }
  }

  /**
   * Enterキー・スペースキー押下時にクリックイベント発火
   */
  public onKeyCheck(value: KeyboardEvent): void {
    if (value.key === 'Enter' || value.key === ' ') {
      (document.activeElement as HTMLElement).click();
    }
  }

  /**
   * EnterキーのKeydown時に入力を受け付けない処理
   */
  public onKeydown(value: KeyboardEvent): void {
    if (value.key === 'Enter') {
      value.preventDefault();
    }
  }
}
