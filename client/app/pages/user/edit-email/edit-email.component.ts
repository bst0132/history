import { Component } from '@angular/core';
import { UntypedFormGroup, Validators, UntypedFormBuilder, ValidatorFn } from '@angular/forms';
import { CommonService } from '../../../common/common.service';
import { CNS } from 'client/app/common/defines';
import { MSG } from '../../../common/message-defines';
import { MatStepper } from '@angular/material/stepper';

@Component({
  selector: 'app-edit-email',
  templateUrl: './edit-email.component.html',
  styleUrls: ['./edit-email.component.scss']
})
export class EditEmailComponent {
  msg = MSG;
  cns = CNS;

  // 変更前後メールアドレス表示用変数
  newEmailAdd: string;
  oldEmailAdd: string;

  // メールアドレス変更履歴情報ID保持用変数
  addHistoryInfId: string;

  // メールアドレス形式チェック用正規表現
  mailRegexp = /^[A-Za-z0-9_.-]{1}[A-Za-z0-9_.-]*@{1}[A-Za-z0-9_.-]{1,}\.[A-Za-z0-9_.-]{1,}$/;
  // 認証コード形式チェック用正規表現
  authCodeRegexp = /^[A-Za-z0-9]{6}$/;

  constructor(private commonService: CommonService, private formBuilder: UntypedFormBuilder) {
  }

  canDeactive(): boolean {

    if(this.mailFormGroup.dirty) {
      return;
    }

    return !this.authCodeFormGroup.dirty;
  }

  groupValidator = (group: UntypedFormGroup): ValidatorFn => {
    let result = null;
    // メールアドレスのどちらかが入力されていない場合は評価しない
    if (!group.get('email').value || !group.get('confirmEmail').value) {
      return result;
    } else if (group.get('email').value != group.get('confirmEmail').value) {
      // 確認用メールアドレスと一致しているか確認
      result = {
        'email-unmatch': true
      };
    }
    return result;
  }

  // 入力値を保持するオブジェクト（メールアドレス）
  mailFormGroup: UntypedFormGroup = this.formBuilder.group({
    email: ['', [Validators.required, Validators.pattern(this.mailRegexp), Validators.maxLength(100)]],
    confirmEmail: ['', [Validators.required, Validators.pattern(this.mailRegexp), Validators.maxLength(100)]]}, {
    validator: this.groupValidator
  });

  // 入力値を保持するオブジェクト（認証コード）
  authCodeFormGroup: UntypedFormGroup = this.formBuilder.group({
    authCode: ['',[Validators.required, Validators.pattern(this.authCodeRegexp)]]
  });

  /**
   * メールアドレス入力後処理
   * @param stepper 参照するstepperの情報
   */
  public async onClickSendAuthCode(stepper: MatStepper): Promise<void> {
    try {
      const data = this.mailFormGroup.value;
      // api通信開始と結果の格納
      const res = await this.commonService.apiPost('user/sendAuthCode', data).toPromise();
      // 返却結果が'ok'の場合、ダイアログメッセージを表示
      if (res.result == 'ok') {
        await this.commonService.openNoticeDialog(this.msg.confirmationTitle, (this.msg.sendDone.replace('※1', CNS.targetTypeCode)).replace('※2', CNS.targetTypeEnterEmail));
        // 通過済みアイコンの要素にクラス追加
        const elems = document.querySelectorAll('.mat-step-header:nth-of-type(1) .mat-step-label,.mat-step-header:nth-of-type(1) .mat-step-icon');
        elems.forEach(elem => elem.classList.add('done'));
        // ページ切り替え
        stepper.next();
      } else if (res?.message) {
        // 返却エラーメッセージ表示
        await this.commonService.openNoticeDialog(this.msg.errTitle, res.message);
      } else {
        await this.commonService.errorOnApp();
      }
    } catch (e) {
      // フォームの変更状態をもとに戻す
      this.mailFormGroup.reset();
      await this.commonService.errorOnService(CNS.targetTypeCode, CNS.actionTypeSend);
    }
  }

  /**
   * 認証コード入力後処理
   * @param stepper 参照するstepperの情報
   */
  public async onClickCheckAuthCode(stepper: MatStepper): Promise<void> {
    try {
      const data = this.authCodeFormGroup.value;
      // api通信開始と結果の格納
      const res = await this.commonService.apiPost('user/checkAuthCode', data).toPromise();
      // 返却結果が'ok'の場合
      if (res.result == 'ok') {
        // 返却値格納
        this.oldEmailAdd = res.oldEmailAdd;
        this.newEmailAdd = res.newEmailAdd;
        this.addHistoryInfId = res.addHistoryInfId;
        // 通過済みアイコンの要素にクラス追加
        const elems = document.querySelectorAll('.mat-step-header:nth-of-type(2) .mat-step-label,.mat-step-header:nth-of-type(2) .mat-step-icon');
        elems.forEach(elem => elem.classList.add('done'));
        // ページ切り替え
        stepper.next();
      } else if (res?.message) {
        // 返却エラーメッセージ表示
        await this.commonService.openNoticeDialog(this.msg.errTitle, res.message);

        // 期限切れの場合、画面を再読み込み
        if (res.expiredFlg) {
          document.location.reload();
        }
      } else {
        await this.commonService.errorOnApp();
      }
    } catch (e) {
      await this.commonService.errorOnService(CNS.targetTypeCode, CNS.actionTypeConfirm);
    }
  }

  /**
   * メールアドレス変更ボタン押下後処理
   * @param stepper 参照するstepperの情報
   */
  public async onClickEditEmail(stepper: MatStepper): Promise<void> {
    try {
      const dialog = await this.commonService.openConfirmDialog(this.msg.confirmationTitle, this.msg.changeConfirmation.replace('※1', CNS.targetTypeEmail));
      // キャンセルなら処理中断
      if(!dialog) {
        return;
      }

      const data = {addHistoryInfId: this.addHistoryInfId};
      // api通信開始と結果の格納
      const res = await this.commonService.apiPost('user/editEmail', data).toPromise();
      // 返却結果が'ok'の場合
      if (res.result == 'ok') {
        // フォームの変更状態をもとに戻す
        this.mailFormGroup.reset();
        this.authCodeFormGroup.reset();
        // 変更履歴情報IDを初期化
        this.addHistoryInfId = '';
        // 通過済みアイコンの要素にクラス追加
        const elems = document.querySelectorAll('.mat-step-header:nth-of-type(3) .mat-step-label,.mat-step-header:nth-of-type(3) .mat-step-icon');
        elems.forEach(elem => elem.classList.add('done'));
        // ページ切り替え
        stepper.next();
      } else if (res?.message) {
        // 返却エラーメッセージ表示
        await this.commonService.openNoticeDialog(this.msg.errTitle, res.message);
        // 画面を再読み込み
        document.location.reload();
      } else {
        await this.commonService.errorOnApp();
      }
    } catch (e) {
      await this.commonService.errorOnService(CNS.targetTypeEmail, CNS.actionTypeChange);
    }
  }

  /**
   * 完了後マイページへボタン押下後処理
   */
  public async navigateProfileDetail(): Promise<void> {
    // マイページへ遷移する
    this.commonService.navigateWithoutEdit(CNS.pathToProfileDetail);
  }
}
