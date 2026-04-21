import { Component, Inject } from '@angular/core';
import { MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA, MatLegacyDialogRef as MatDialogRef } from '@angular/material/legacy-dialog';
import { UntypedFormGroup, UntypedFormBuilder, Validators, UntypedFormArray } from '@angular/forms';
import { MSG } from '../../common/message-defines';
import { CommonService } from 'client/app/common/common.service';
import { CNS } from 'client/app/common/defines';

export interface DialogReqData {
  compId: string;
}

@Component({
  selector: 'app-input-team-dialog',
  templateUrl: './input-team-dialog.component.html',
  styleUrls: ['./input-team-dialog.component.scss']
})
export class InputTeamDialogComponent {

  // 入力情報保持用
  formGroup: UntypedFormGroup = null;

  // 固定のメッセージ
  msg = MSG;

  // 注意メッセージ
  alertMsg: string;

  /**
   * コンストラクタ
   * @param data
   * @param formBuilder
   * @param dialogRef
   */
  constructor(@Inject(MAT_DIALOG_DATA) public data: DialogReqData, private formBuilder: UntypedFormBuilder,
  public commonService: CommonService, private dialogRef: MatDialogRef<InputTeamDialogComponent>) {
    // マスク部分押下でのクローズを制御
    dialogRef.disableClose = true;

    // コントローラー設定
    this.formGroup = this.formBuilder.group({
      teamInfo: this.formBuilder.array([
        this.formBuilder.group({
          compId: [this.data.compId],
          teamName: ['', [Validators.maxLength(50), Validators.required]]
        })
      ])
    });
  }

  /**
   * 初期状態からページの編集がされたか判定
   */
  public canDeactive(): boolean {
    return !this.formGroup.dirty;
  }

  /**
   * teamInfoのゲッター
   */
  get getTeamInfo(): UntypedFormArray {
    return this.formGroup.get('teamInfo') as UntypedFormArray;
  }

  /**
   * 入力フォーム・コントローラー追加
   */
  public onAddTeamInfo(): void {
    this.getTeamInfo.push(this.formBuilder.group({
      compId: [this.data.compId],
      teamName: ['', [Validators.maxLength(50), Validators.required]]
    }));

    // 上限チェックを行う
    this.onCheckCount();
  }

  /**
   * 入力フォーム・コントローラー削除
   */
  public onDelTeamInfo(index: number): void {
    this.getTeamInfo.removeAt(index);
    this.getTeamInfo.markAsDirty();

    // 上限チェックを行うことで、注意メッセージを必要に応じて削除
    this.onCheckCount();
  }

  /**
   * チーム名登録数上限チェック
   */
  public onCheckCount(): void {
    // 上限10までチーム名入力フォームを追加できる
    if (this.getTeamInfo?.length < 10) {
      this.alertMsg = '';
    } else {
      this.alertMsg = '一度に登録できるチーム数を満たしました。';
    }
  }

  /**
   * 登録処理
   */
  public async onClickReg(): Promise<void> {
    // 登録内容をフォームから取得
    const regData = this.formGroup.value;

    try {
      // 登録処理
      const res = await this.commonService.apiPost('teamGameRecord/addEntryTeam', {regData, isRegTeam: false}).toPromise();

      // 正常時の処理
      if (res.result === 'ok') {
        // フォームを初期化
        this.formGroup.markAsPristine();
        // 登録ありのフラグを返してダイアログを閉じる
        this.dialogRef.close(true);

      } else {
        // 登録失敗メッセージ
        await this.commonService.errorOnApp();
      }

    } catch {
      // 登録エラーメッセージ
      await this.commonService.errorOnService(CNS.targetTypeTeam, CNS.actionTypeReg);
    }
  }

  /**
   * Enterキー・スペースキー押下時にクリックイベント発火
   */
  public onKeyCheck(value: KeyboardEvent): void {
    this.commonService.onKeyCheck(value);
  }
}
