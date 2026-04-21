import { Component, Inject } from '@angular/core';
import { MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA, MatLegacyDialogRef as MatDialogRef } from '@angular/material/legacy-dialog';
import { CommonService } from 'client/app/common/common.service';
import { MSG } from 'client/app/common/message-defines';
import { UntypedFormGroup, UntypedFormBuilder, Validators } from '@angular/forms';
import { ObjectId } from 'mongodb';
import { CNS } from 'client/app/common/defines';

export interface DialogData {
  compId: ObjectId;
  existGame: boolean;
}

@Component({
  selector: 'app-copy-competition-dialog',
  templateUrl: './copy-competition-dialog.component.html',
  styleUrl: './copy-competition-dialog.component.scss'
})
export class CopyCompetitionDialogComponent {

  msg = MSG;

  // フォームグループ
  formGroup: UntypedFormGroup;

  // 試合情報の存在判定用(存在する: true, 存在しない: false)
  existGame = this.data.existGame;

  /**
   * コンストラクタ
   */
  constructor(@Inject(MAT_DIALOG_DATA) public data: DialogData, public matDialogRef: MatDialogRef<CopyCompetitionDialogComponent>, public commonService: CommonService, private formBuilder: UntypedFormBuilder) {
    // フォームを作成
    this.formGroup = this.formBuilder.group({
      copyAll: [this.existGame, [Validators.required]]
    });
  }

  /**
   * 複製ボタン押下時の処理
   */
  public async onClickCopyComp(): Promise<void> {
    // フォームの値を取得する
    const copyAll = this.formGroup.get('copyAll').value;

    // APIに渡すデータ
    const data = {
      compId: this.data.compId,
      copyAll: copyAll
    };

    // データ登録処理
    try {
      // 複製大会情報登録処理
      const res = await this.commonService.apiPost('competitionInf/regCopyCompInfo', data).toPromise();

      // 異常があればエラーダイアログ表示して処理終了
      if (res.result != 'ok') {
        if (res?.message) {
          // 再度複製をしようとしたときのエラーダイアログ
          await this.commonService.openNoticeDialog(this.msg.errTitle, res.message);
          this.matDialogRef.close();
          return;
        } else {
          // 複製エラーダイアログ
          await this.commonService.errorOnApp();
          this.matDialogRef.close();
          return;
        }
      }

      // 複製完了ダイアログ
      await this.commonService.openNoticeDialog(this.msg.copyTitle, this.msg.copyDone.replace('※1', CNS.targetTypeComp));
      // フォームの変更状態をもとに戻す
      this.formGroup.markAsPristine();

      // ログイン時必要情報を更新する
      const answer = await this.commonService.apiPost('user/reloadLoginInf', {}).toPromise();
      if (answer.result != 'ok') {
        // 異常があればログイン情報を削除してログインページに遷移
        await this.commonService.errorOnApp();
        this.matDialogRef.close();
        this.commonService.navigateToLogin();
        return;
      }
      this.commonService.setLoginInfo(JSON.parse(JSON.stringify(answer.loginInfo)), false);

      // ダイアログを閉じ、大会IDを返す
      this.matDialogRef.close(res.compId);

    } catch(e) {
      await this.commonService.errorOnService(CNS.targetTypeComp, CNS.actionTypeCopy);
      this.matDialogRef.close();
    }

  }

  /**
   * Enterキー・スペースキー押下時にクリックイベント発火
   */
  public onKeyCheck(value: KeyboardEvent): void {
    this.commonService.onKeyCheck(value);
  }
}
