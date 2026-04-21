import { Component } from '@angular/core';
import { UntypedFormGroup, Validators, UntypedFormBuilder, ValidatorFn, UntypedFormControl } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { CommonService } from '../../../common/common.service';
import { userPolicy } from '../../../common/message-defines';
import { MSG } from '../../../common/message-defines';
import { CNS } from 'client/app/common/defines';

@Component({
  selector: 'app-create-user',
  templateUrl: './create-user.component.html',
  styleUrls: ['./create-user.component.scss']
})
export class CreateUserComponent {
  // 入力中のパスワードの強度
  strength: number;
  // 必要なパスワードの強度
  requiredStrength = 60;
  // 英数1文字ずつを含む英数記号8文字以上20文字以下の文字列
  pwdRegexp = /^(?=.*?[a-z])(?=.*?\d)[ -~]{8,20}$/i;
  // 利用規約表示内容
  userPolicy = userPolicy;
  // 利用規約表示制御用変数
  showPolicy = true;

  // パスワード可視化の条件分岐用定数
  passHide = true;

  // パスワード（再入力）可視化の条件分岐用定数
  confirmPassHide = true;

  msg = MSG;

  // 登録完了判定用フラグ
  regFlg: boolean;

  groupValidator = (group: UntypedFormGroup): ValidatorFn => {
    let result = null;
    // パスワードのどちらかが入力されていない場合は評価しない
    if(!group.get('password').value || !group.get('confirmPassword').value) {
      return result;
    } else if(group.get('password').value != group.get('confirmPassword').value) {
      // 確認用パスワードと一致しているか確認
      result = {
        'password-unmatch': true
      };
    }
    return result;
  };
  passwordValidator = (control: UntypedFormControl): ValidatorFn => {
    let result = null;
    if(control.value && !this.pwdRegexp.test(control.value)) {
      result = {
        vulnerable: true
      };
    }
    return result;
  };
  // 入力値を保持するオブジェクト
  formGroup: UntypedFormGroup = this.formBuilder.group({
    userUniqueID: ['', [Validators.required, Validators.pattern(/^(?=.*?[a-zA-Z])(?=.*?\d)[a-zA-Z\d]{8,20}$/)]],
    nickname: ['', [Validators.required, Validators.maxLength(30)]],
    password: ['', [Validators.required, this.passwordValidator]],
    confirmPassword: ['', [Validators.required, this.passwordValidator]],
    // デモ用コード
    createUserCode: ['', Validators.required]
  }, {
    validator: this.groupValidator
  });

  token: string;

  constructor(private commonService: CommonService, private formBuilder: UntypedFormBuilder, private activate: ActivatedRoute) {
    // クエリパラメータ取得
    this.activate.queryParams.subscribe(params => {
      this.token = params.token;
    });
    // 登録完了判定用フラグにfalseを設定する
    this.regFlg = false;
  }

  async onSubmit(): Promise<void> {
    const dialog = await this.commonService.openConfirmDialog(this.msg.confirmationTitle, this.msg.processConfirmation.replace('※1', CNS.targetTypeUser + CNS.actionTypeReg));

    // キャンセルなら処理中断
    if(!dialog) {
      return;
    }
    const data = this.formGroup.value;
    data.token = this.token;
    this.commonService.apiPost('user/createUser', data)
    .subscribe(
      async (res) => {
        if (res.result == 'ok') {
          // 登録完了判定用フラグにtrueを設定する
          this.regFlg = true;
        } else if (res?.message) {
          await this.commonService.openNoticeDialog(this.msg.errTitle, this.msg.registrationErr + '\n' + res.message);
          // 登録済みの場合はトップ画面へ遷移
          if (res.registeredFlg) {
            this.commonService.navigateWithoutEdit('');
          }
        } else {
          await this.commonService.errorOnApp();
        }

      },
      async () => {
        await this.commonService.errorOnService(CNS.targetTypeUser, CNS.actionTypeReg);
      }
    );
  }

  /**
   * 同意ボタン押下時の処理
   * モーダルウィンドウを閉じる
   */
  checkPolicy(): void {
    this.showPolicy = false;
  }

  /**
   * 同意しないボタン押下時の処理
   */
  async cancel(): Promise<void> {
    // 確認ダイアログ表示
    const dialog = await this.commonService.openConfirmDialog(this.msg.confirmationTitle, this.msg.disagreeButtonConfirmation);

    // キャンセルなら処理中断
    if(!dialog) {
      return;
    }
    // トップページに遷移
    this.commonService.navigateWithoutEdit('');
  }

  onStrengthChanged(strength: number): void {
    this.strength = strength;
  }

}
