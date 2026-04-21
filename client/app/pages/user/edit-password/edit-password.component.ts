import { Component } from '@angular/core';
import { UntypedFormGroup, Validators, UntypedFormBuilder, ValidatorFn, UntypedFormControl } from '@angular/forms';
import { CommonService } from '../../../common/common.service';
import { MSG } from '../../../common/message-defines';
import { CNS } from 'client/app/common/defines';

@Component({
  selector: 'app-edit-password',
  templateUrl: './edit-password.component.html',
  styleUrls: ['./edit-password.component.scss']
})
export class EditPasswordComponent {
  // 入力中のパスワードの強度
  strength: number;
  // 必要なパスワードの強度
  requiredStrength = 60;
  // 英数1文字ずつを含む英数記号8文字以上20文字以下の文字列
  pwdRegexp = /^(?=.*?[a-z])(?=.*?\d)[ -~]{8,20}$/i

  // パスワード可視化の条件分岐用定数
  passHide = true;

  // パスワード（再入力）可視化の条件分岐用定数
  confirmPassHide = true;

  msg = MSG;

  // デバイス判定用変数
  device: 'pc' | 'sp';

  constructor(private commonService: CommonService, private formBuilder: UntypedFormBuilder) {
    // デバイス判定
    this.device = commonService.isMobile ? 'sp' : 'pc';
  }

  canDeactive(): boolean {
    return !this.formGroup.dirty;
  }

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

  // 変更ボタンが押下された時の処理
  async onSubmit(): Promise<void> {
    try{
      const data = this.formGroup.value;
      // api通信開始と結果の格納
      const res = await this.commonService.apiPost('user/editPassword', data).toPromise();
      // 返却結果が'ok'の場合、ダイアログメッセージを表示
      if(res.result == 'ok') {
        await this.commonService.openNoticeDialog(this.msg.confirmationTitle, this.msg.changeDone.replace('※1', CNS.targetTypePass));
        // フォームの変更状態をもとに戻す
        this.formGroup.markAsPristine();
        // 個人情報画面に遷移
        this.commonService.navigateBack();
      } else {
        await this.commonService.errorOnApp();
      }
    }catch(e){
      await this.commonService.errorOnService(CNS.targetTypePass, CNS.actionTypeChange);
    }
  }

  /**
   * 戻るボタン押下時の処理
   */
  public pageBack(): void {
    // 個人情報ページに遷移
    this.commonService.navigateBack();
  }

  onStrengthChanged(strength: number): void {
    this.strength = strength;
  }
}
