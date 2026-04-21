import { Component } from '@angular/core';
import { CommonService } from 'client/app/common/common.service';
import { UntypedFormBuilder, Validators, UntypedFormGroup } from '@angular/forms';
import { MSG } from '../../../common/message-defines';

@Component({
  selector: 'app-create-place',
  templateUrl: './create-place.component.html',
  styleUrls: ['./create-place.component.scss']
})
export class CreatePlaceComponent {

  formGroup: UntypedFormGroup;

  msg = MSG;

  constructor(private commonService: CommonService, private formBuilder: UntypedFormBuilder) {
    this.formGroup = this.formBuilder.group({
      placeName: ['', Validators.required],
      placeAdd: [''],
      placeTel: ['']
    });
  }

  canDeactive(): boolean {
    return !this.formGroup.dirty;
  }

  /**
   * 開催地登録処理
   */
  public async onSubmit(): Promise<void> {

    // サーバサイドに送るデータをフォームから設定
    const data = this.formGroup.value;

    // ダイアログ表示
    const dialog = await this.commonService.openConfirmDialog(this.msg.confirmationTitle, this.msg.regConfirmation.replace('※1','開催地'));

    // キャンセルなら処理中断
    if(!dialog) {
      return;
    }

    try {
      // 開催地登録処理
      const res = await this.commonService.apiPost('competition/createPlace', {
        data: data,
        compId: this.commonService.getEditInfo().id
      }).toPromise();

      // サーバサイド処理結果判定
      if(res.result == 'ok') {
        await this.commonService.openNoticeDialog(this.msg.regTitle, this.msg.regDone.replace('※1','開催地'));

        // フォームの変更状態をもとに戻す
        this.formGroup.markAsPristine();

        // 大会情報管理画面に遷移する
        this.returnManageCompetition();

      } else {
        await this.commonService.openNoticeDialog(this.msg.errTitle, this.msg.regErr.replace('※1','開催地'));
      }

    } catch(e) {
      this.commonService.errorOnApi(e);
    }

  }

  /**
   * 大会情報管理に戻る
   */
  public returnManageCompetition(): void {
    this.commonService.navigateBack();
  }

}
