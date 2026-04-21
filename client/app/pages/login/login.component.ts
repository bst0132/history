import { Component} from '@angular/core';
import { UntypedFormGroup, Validators, UntypedFormBuilder, ValidatorFn, UntypedFormControl} from '@angular/forms';
import { CommonService } from '../../common/common.service';
import { CNS } from 'client/app/common/defines';
import { MSG } from '../../common/message-defines';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {

  // メールアドレス形式チェック用正規表現
  mailRegexp = /^[A-Za-z0-9_.-]{1}[A-Za-z0-9_.-]*@{1}[A-Za-z0-9_.-]{1,}\.[A-Za-z0-9_.-]{1,}$/;

  // 英数1文字ずつを含む英数記号8文字以上20文字以下の文字列
  pwdRegexp = /^(?=.*?[a-z])(?=.*?\d)[ -~]{8,20}$/i

  // パスワード可視化の条件分岐用定数
  passHide = true;

  passwordValidator = (control: UntypedFormControl): ValidatorFn => {
    let result = null;
    if(control.value && !this.pwdRegexp.test(control.value)) {
      result = {
        vulnerable: true
      };
    }
    return result;
  }

   // 入力値を保持するオブジェクト
  formGroup: UntypedFormGroup = this.formBuilder.group({
    mailAdd: ['', [Validators.required, Validators.pattern(this.mailRegexp), Validators.maxLength(100)]],
    password: ['', [Validators.required, this.passwordValidator]]
  });

  // 画面制御用パスワード認証が通らなかった場合trueにする
  passwordUnmatch = false;

  // モーダルウインドウを初期非表示にする
  showForm = false;
  showPlayer = false;
  showFun = false;
  showAdmin = false;

  msg = MSG;

  // ログイン試行回数エラーのメッセージを格納
  loginOverErr = this.msg.loginOverErr;

  // ログイン試行回数を保持する変数
  public loginCount = 0;

  // ログイン試行上限回数の定数
  public static loginMaxCount = 10;

  // ログイン試行回数が上限に達した際にtrueにする
  public loginOverCount = false;

  constructor(public commonService: CommonService, private formBuilder: UntypedFormBuilder) {
  }

  /**
   * ログイン処理
   * ログイン成功の場合は画面遷移、失敗の場合はエラーメッセージを出す
   */
  public onSubmit(): void {
    const data = this.formGroup.value;

    this.commonService.apiPost('user/login', data).subscribe(
      (res) => {
        if(this.loginCount >= LoginComponent.loginMaxCount) {
          this.passwordUnmatch = false;
          this.loginOverCount = true;
        } else if(res.result != 'ok') {
          this.passwordUnmatch = true;
          this.loginCount += 1;
        } else {
          this.commonService.setLoginInfo(JSON.parse(JSON.stringify(res.loginInfo)));
          // ログイン成功なら大会一覧画面へ遷移
          this.commonService.navigateWithEdit(CNS.pathToCollectionCompetition);
        }
      },
      async (err) => {
        console.log(err);
        await this.commonService.errorOnService(CNS.targetTypeLogin, CNS.actionTypeProcess);
      }
    );
  }

  /**
   * 画面遷移処理
   * @param path 遷移先のパス
   */
  public onClickNavigate(path: string): void {
    this.commonService.navigateWithoutEdit(path);
  }

  /**
   * ログアウト処理
   * ログイン情報を削除し、トップページへ遷移させる
   */
  public async onClickLogout(): Promise<void> {
    const result = await this.commonService.openConfirmDialog(this.msg.logoutConfirmationTitle, this.msg.logoutConfirmation);
    if (!result) {
      return;
    }
    this.commonService.clearLoginInfo();
    this.commonService.navigateWithoutEdit('');
    await this.commonService.openNoticeDialog(this.msg.logoutDoneTitle, this.msg.logoutDone);
  }



  /**
   * ログインモーダル表示
   */
  public openForm(): void {
    this.showForm = true;
  }

  /**
   * 選手向けモーダル表示
   */
  public openPlayer(): void {
    this.showPlayer = true;
  }

  /**
   * ファン向けモーダル表示
   */
  public openFun(): void {
    this.showFun = true;
  }

  /**
   * 管理者向けモーダル表示
   */
  public openAdmin(): void {
    this.showAdmin = true;
  }


  /**
   * モーダルクローズ処理
   * ✖またはグレー部分押下でモーダルを閉じ、フォームに関しては情報クリアにする
   */
  public closeModal(): void {
    this.showForm = false;
    this.showPlayer = false;
    this.showFun = false;
    this.showAdmin = false;
    this.formGroup.reset();
    this.passwordUnmatch = false;
  }

  /**
   * Enterキー・スペースキー押下時にクリックイベント発火
   */
  public onKeyCheck(value: KeyboardEvent): void {
    this.commonService.onKeyCheck(value);
  }
}
