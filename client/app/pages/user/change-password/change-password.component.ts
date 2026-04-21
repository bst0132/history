import { Component } from '@angular/core';
import { UntypedFormGroup, Validators, UntypedFormBuilder, ValidatorFn, UntypedFormControl } from '@angular/forms';
import { CommonService } from '../../../common/common.service';
import { ActivatedRoute } from '@angular/router';
import { MSG } from '../../../common/message-defines';
import { CNS } from 'client/app/common/defines';

@Component({
  selector: 'app-change-password',
  templateUrl: './change-password.component.html',
  styleUrls: ['./change-password.component.scss']
})
export class ChangePasswordComponent {
  // 入力中のパスワードの強度
  strength: number;
  // 必要なパスワードの強度
  requiredStrength = 60;
  // 英数1文字ずつを含む英数記号8文字以上20文字以下の文字列
  pwdRegexp = /^(?=.*?[a-z])(?=.*?\d)[ -~]{8,20}$/i;

  msg = MSG;

  // 登録完了判定用フラグ
  regFlg: boolean;

  // パスワード可視化の条件分岐用定数
  passHide = true;

  // パスワード（再入力）可視化の条件分岐用定数
  confirmPassHide = true;

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
    password: ['', [Validators.required, this.passwordValidator]],
    confirmPassword: ['', [Validators.required, this.passwordValidator]]
  }, {
    validator: this.groupValidator
  });

  token: string;

  // デバイス判定用変数
  device: 'pc' | 'sp';

  constructor(private commonService: CommonService, private formBuilder: UntypedFormBuilder, private activate: ActivatedRoute) {
    // クエリパラメータ取得
    this.activate.queryParams.subscribe(params => {
      this.token = params.token;
    });
    // 登録完了フラグにfalseを設定する
    this.regFlg = false;
    // デバイス判定
    this.device = commonService.isMobile ? 'sp' : 'pc';
  }

  // 登録ボタンが押下された時の処理
  async onSubmit(): Promise<void> {
    try{
      const data = this.formGroup.value;
      data.token = this.token;
      // api通信開始と結果の格納
      const res = await this.commonService.apiPost('user/changePassword', data).toPromise();
      // 返却結果が'ok'の場合、ダイアログメッセージを表示
      if(res.result == 'ok') {
        // 登録完了フラグにtrueを設定する
        this.regFlg = true;
      } else {
        await this.commonService.errorOnApp();
      }
    }catch(e){
      await this.commonService.errorOnService(CNS.targetTypePass, CNS.actionTypeChange);
    }
  }

  onStrengthChanged(strength: number): void {
    this.strength = strength;
  }
}
